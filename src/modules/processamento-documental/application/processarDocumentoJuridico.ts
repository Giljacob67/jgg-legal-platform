import "server-only";

import type { DocumentoComArquivoEVinculos, StatusDocumento, StatusExecucaoEtapa, StatusProcessamentoDocumental } from "@/modules/documentos/domain/types";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";
import { criarProcessadoresDocumentais } from "@/modules/processamento-documental/infrastructure/processadores";
import type {
  ResultadoEtapaDocumental,
  ResultadoExtracaoFatos,
  ResultadoLeituraDocumental,
  ResultadoProcessamentoDocumento,
  ResultadoResumoDocumental,
} from "@/modules/processamento-documental/domain/types";

function truncarMensagemErro(error: unknown): string {
  const message = error instanceof Error ? error.message : "Erro não identificado no processamento documental.";
  return message.length > 900 ? `${message.slice(0, 897)}...` : message;
}

function statusDaEtapa(resultado: ResultadoEtapaDocumental[]): StatusProcessamentoDocumental {
  if (resultado.some((item) => item.status === "falha")) {
    return "erro";
  }

  const todosSucesso = resultado.every((item) => item.status === "sucesso");
  return todosSucesso ? "processado" : "processado_parcial";
}

function statusDocumento(resultado: ResultadoEtapaDocumental[]): StatusDocumento | undefined {
  const extracao = resultado.find((item) => item.etapa === "extracao_fatos");
  if (extracao?.status === "sucesso" || extracao?.status === "parcial") {
    return "extraído";
  }

  const leitura = resultado.find((item) => item.etapa === "leitura");
  if (leitura?.status === "sucesso" || leitura?.status === "parcial") {
    return "lido";
  }

  return undefined;
}

function toStatusEtapaParcialOuSucesso(etapa: ResultadoEtapaDocumental): StatusExecucaoEtapa {
  if (etapa.etapa === "leitura") {
    const saida = etapa.saida as ResultadoLeituraDocumental;
    return saida.textoNormalizado?.trim() ? "sucesso" : "parcial";
  }

  if (etapa.etapa === "extracao_fatos") {
    const saida = etapa.saida as ResultadoExtracaoFatos;
    return saida.fatosRelevantes.length > 0 ? "sucesso" : "parcial";
  }

  return "sucesso";
}

export async function processarDocumentoJuridico(
  documentoDetalhado: DocumentoComArquivoEVinculos,
): Promise<ResultadoProcessamentoDocumento> {
  const infra = getDocumentosInfra();
  const processadores = criarProcessadoresDocumentais();
  const execucoesExistentes = await infra.processamentoEtapaRepository.listarPorDocumento(
    documentoDetalhado.documento.id,
  );

  const resultados: ResultadoEtapaDocumental[] = [];

  for (const processador of processadores) {
    const existenteConcluida = execucoesExistentes.find(
      (execucao) =>
        execucao.etapa === processador.etapa &&
        (execucao.status === "sucesso" || execucao.status === "parcial"),
    );

    if (existenteConcluida) {
      resultados.push({
        etapa: processador.etapa,
        status: existenteConcluida.status,
        tentativa: existenteConcluida.tentativa,
        saida: existenteConcluida.saida as unknown as ResultadoEtapaDocumental["saida"],
        codigoErro: existenteConcluida.codigoErro,
        mensagemErro: existenteConcluida.mensagemErro,
      });
      continue;
    }

    const execucao = await infra.processamentoEtapaRepository.iniciarTentativa({
      documentoJuridicoId: documentoDetalhado.documento.id,
      etapa: processador.etapa,
      entradaRef: {
        documentoId: documentoDetalhado.documento.id,
        arquivoFisicoId: documentoDetalhado.documento.arquivoFisicoId,
        titulo: documentoDetalhado.documento.titulo,
      },
    });

    try {
      const saida = await processador.executar(documentoDetalhado);
      const status = toStatusEtapaParcialOuSucesso({
        etapa: processador.etapa,
        status: "sucesso",
        tentativa: execucao.tentativa,
        saida,
      });

      const concluida = await infra.processamentoEtapaRepository.concluirTentativa({
        execucaoId: execucao.id,
        status,
        saida: saida as unknown as Record<string, unknown>,
      });

      resultados.push({
        etapa: processador.etapa,
        status: concluida.status,
        tentativa: concluida.tentativa,
        saida,
        codigoErro: concluida.codigoErro,
        mensagemErro: concluida.mensagemErro,
      });
    } catch (error) {
      const mensagemErro = truncarMensagemErro(error);
      const concluida = await infra.processamentoEtapaRepository.concluirTentativa({
        execucaoId: execucao.id,
        status: "falha",
        codigoErro: "PROCESSAMENTO_ETAPA_FALHA",
        mensagemErro,
      });

      resultados.push({
        etapa: processador.etapa,
        status: concluida.status,
        tentativa: concluida.tentativa,
        saida: {} as ResultadoEtapaDocumental["saida"],
        codigoErro: concluida.codigoErro,
        mensagemErro: concluida.mensagemErro,
      });
    }
  }

  const leitura = resultados.find((item) => item.etapa === "leitura")?.saida as
    | ResultadoLeituraDocumental
    | undefined;
  const resumo = resultados.find((item) => item.etapa === "resumo")?.saida as
    | ResultadoResumoDocumental
    | undefined;

  await infra.documentoJuridicoRepository.atualizarConteudoProcessado(documentoDetalhado.documento.id, {
    textoExtraido: leitura?.textoExtraido,
    textoNormalizado: leitura?.textoNormalizado,
    resumoJuridico: resumo?.resumo,
    statusDocumento: statusDocumento(resultados),
  });

  await infra.documentoJuridicoRepository.atualizarStatusProcessamento(
    documentoDetalhado.documento.id,
    statusDaEtapa(resultados),
  );

  return {
    documentoId: documentoDetalhado.documento.id,
    resultados,
  };
}
