import "server-only";

import { services } from "@/services/container";
import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";
import type { RastroGeracaoMinuta } from "@/modules/peticoes/domain/geracao-minuta";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";
import { gerarMinutaEstruturada } from "@/modules/peticoes/application/operacional/gerarMinutaEstruturada";

export async function obterEditorMinutaOperacional(minutaId: string): Promise<{
  minuta: Minuta;
  contextoJuridico: ContextoJuridicoPedido | null;
  versaoContextoAtual?: number;
  rastroGeracaoAtual?: RastroGeracaoMinuta;
}> {
  const minutaBase = services.peticoesRepository.obterMinutaPorId(minutaId);
  if (!minutaBase) {
    throw new Error("Minuta não encontrada.");
  }

  await sincronizarPipelinePedido(minutaBase.pedidoId);

  const infra = getPeticoesOperacionalInfra();
  const contextoJuridico = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(minutaBase.pedidoId);
  const pedido = services.peticoesRepository.obterPedidoPorId(minutaBase.pedidoId);
  const caso = pedido ? services.casosRepository.obterCasoPorId(pedido.casoId) : undefined;

  const geracaoAtual = pedido
    ? gerarMinutaEstruturada({
        pedido,
        caso,
        contextoJuridico,
      })
    : null;

  const rastrosPersistidos = await infra.minutaRastroContextoRepository.listarPorMinuta(minutaBase.id);
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
  }

  return {
    minuta,
    contextoJuridico,
    versaoContextoAtual: contextoJuridico?.versaoContexto,
    rastroGeracaoAtual: geracaoAtual?.rastro,
  };
}
