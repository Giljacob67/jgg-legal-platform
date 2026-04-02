import "server-only";

import { services } from "@/services/container";
import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";
import {
  normalizarMateriaCanonica,
  normalizarTipoPecaCanonica,
  type RastroGeracaoMinuta,
} from "@/modules/peticoes/domain/geracao-minuta";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";
import { gerarMinutaEstruturada } from "@/modules/peticoes/application/operacional/gerarMinutaEstruturada";
import { avaliarPainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/application/avaliarPainelInteligenciaJuridica";
import type { PainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/domain/types";

function logDebug(mensagem: string, detalhe?: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[peticoes][editor] ${mensagem}`, detalhe);
}

export async function obterEditorMinutaOperacional(minutaId: string): Promise<{
  minuta: Minuta;
  contextoJuridico: ContextoJuridicoPedido | null;
  versaoContextoAtual?: number;
  rastroGeracaoAtual?: RastroGeracaoMinuta;
  inteligenciaJuridica: PainelInteligenciaJuridica | null;
}> {
  const minutaBase = services.peticoesRepository.obterMinutaPorId(minutaId);
  if (!minutaBase) {
    throw new Error("Minuta não encontrada.");
  }

  try {
    await sincronizarPipelinePedido(minutaBase.pedidoId);
  } catch (error) {
    logDebug("Sincronização do pipeline falhou. Editor seguirá com fallback seguro.", {
      minutaId,
      pedidoId: minutaBase.pedidoId,
      error,
    });
  }

  const infra = getPeticoesOperacionalInfra();
  let contextoJuridico: ContextoJuridicoPedido | null = null;
  try {
    contextoJuridico = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(minutaBase.pedidoId);
  } catch (error) {
    logDebug("Não foi possível obter contexto jurídico persistido.", {
      minutaId,
      pedidoId: minutaBase.pedidoId,
      error,
    });
  }

  const pedido = services.peticoesRepository.obterPedidoPorId(minutaBase.pedidoId);
  const caso = pedido ? services.casosRepository.obterCasoPorId(pedido.casoId) : undefined;

  const geracaoAtual = pedido
    ? await gerarMinutaEstruturada({
        pedido,
        caso,
        contextoJuridico,
      })
    : null;

  const rastrosPersistidos = await infra.minutaRastroContextoRepository
    .listarPorMinuta(minutaBase.id)
    .catch((error) => {
      logDebug("Não foi possível listar rastros persistidos da minuta.", {
        minutaId,
        pedidoId: minutaBase.pedidoId,
        error,
      });
      return [];
    });
  const rastrosMap = new Map(rastrosPersistidos.map((rastro) => [rastro.versaoId, rastro]));
  const versaoContextoPadrao = contextoJuridico?.versaoContexto ?? 1;
  const versaoMaisRecenteId = minutaBase.versoes.reduce((acumulador, item) => {
    if (!acumulador || item.numero > acumulador.numero) {
      return item;
    }

    return acumulador;
  }, minutaBase.versoes[0])?.id;

  const minuta: Minuta = {
    ...minutaBase,
    conteudoAtual: geracaoAtual?.conteudoCompleto ?? minutaBase.conteudoAtual,
    versoes: minutaBase.versoes.map((versao) => ({
      ...versao,
      contextoVersaoOrigem:
        rastrosMap.get(versao.id)?.contextoVersao ?? versao.contextoVersaoOrigem ?? versaoContextoPadrao,
      templateIdOrigem:
        rastrosMap.get(versao.id)?.templateId ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.templateId : versao.templateIdOrigem),
      templateNomeOrigem:
        rastrosMap.get(versao.id)?.templateNome ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.templateNome : versao.templateNomeOrigem),
      templateVersaoOrigem:
        rastrosMap.get(versao.id)?.templateVersao ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.templateVersao : versao.templateVersaoOrigem),
      tipoPecaCanonicaOrigem:
        rastrosMap.get(versao.id)?.tipoPecaCanonica ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.tipoPecaCanonica : versao.tipoPecaCanonicaOrigem),
      materiaCanonicaOrigem:
        rastrosMap.get(versao.id)?.materiaCanonica ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.materiaCanonica : versao.materiaCanonicaOrigem),
      referenciasDocumentaisOrigem:
        rastrosMap.get(versao.id)?.referenciasDocumentais ??
        (versao.id === versaoMaisRecenteId ? geracaoAtual?.rastro.referenciasDocumentais : versao.referenciasDocumentaisOrigem),
    })),
  };

  for (const versao of minuta.versoes) {
    if (!versao.contextoVersaoOrigem) {
      continue;
    }

    try {
      await infra.minutaRastroContextoRepository.upsertVinculo({
        minutaId: minuta.id,
        versaoId: versao.id,
        pedidoId: minuta.pedidoId,
        numeroVersao: versao.numero,
        contextoVersao: versao.contextoVersaoOrigem,
        templateId: versao.templateIdOrigem,
        templateNome: versao.templateNomeOrigem,
        templateVersao: versao.templateVersaoOrigem,
        tipoPecaCanonica: versao.tipoPecaCanonicaOrigem,
        materiaCanonica: versao.materiaCanonicaOrigem,
        referenciasDocumentais: versao.referenciasDocumentaisOrigem ?? [],
      });
    } catch (error) {
      logDebug("Falha ao persistir rastro de versão da minuta.", {
        minutaId,
        versaoId: versao.id,
        error,
      });
    }
  }

  let inteligenciaJuridica: PainelInteligenciaJuridica | null = null;
  try {
    const tipoPecaCanonica = geracaoAtual?.rastro.tipoPecaCanonica ?? normalizarTipoPecaCanonica(pedido?.tipoPeca ?? "");
    const materiaCanonica = geracaoAtual?.rastro.materiaCanonica ?? normalizarMateriaCanonica(caso?.materia);
    inteligenciaJuridica = await avaliarPainelInteligenciaJuridica({
      minuta,
      contextoJuridico,
      tipoPecaCanonica,
      materiaCanonica,
    });
  } catch (error) {
    logDebug("Falha na avaliação de inteligência jurídica. Editor seguirá com fallback visual.", {
      minutaId,
      pedidoId: minuta.pedidoId,
      error,
    });
  }

  return {
    minuta,
    contextoJuridico,
    versaoContextoAtual: contextoJuridico?.versaoContexto,
    rastroGeracaoAtual: geracaoAtual?.rastro,
    inteligenciaJuridica,
  };
}
