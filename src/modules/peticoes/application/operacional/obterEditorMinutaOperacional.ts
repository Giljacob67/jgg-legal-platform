import "server-only";

import { services } from "@/services/container";
import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { sincronizarPipelinePedido } from "@/modules/peticoes/application/operacional/sincronizarPipelinePedido";

export async function obterEditorMinutaOperacional(minutaId: string): Promise<{
  minuta: Minuta;
  contextoJuridico: ContextoJuridicoPedido | null;
  versaoContextoAtual?: number;
}> {
  const minutaBase = services.peticoesRepository.obterMinutaPorId(minutaId);
  if (!minutaBase) {
    throw new Error("Minuta não encontrada.");
  }

  await sincronizarPipelinePedido(minutaBase.pedidoId);

  const infra = getPeticoesOperacionalInfra();
  const contextoJuridico = await infra.contextoJuridicoPedidoRepository.obterUltimaVersao(minutaBase.pedidoId);
  const rastrosPersistidos = await infra.minutaRastroContextoRepository.listarPorMinuta(minutaBase.id);
  const rastrosMap = new Map(rastrosPersistidos.map((rastro) => [rastro.versaoId, rastro.contextoVersao]));
  const versaoContextoPadrao = contextoJuridico?.versaoContexto ?? 1;

  const minuta: Minuta = {
    ...minutaBase,
    versoes: minutaBase.versoes.map((versao) => ({
      ...versao,
      contextoVersaoOrigem:
        rastrosMap.get(versao.id) ?? versao.contextoVersaoOrigem ?? versaoContextoPadrao,
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
    });
  }

  return {
    minuta,
    contextoJuridico,
    versaoContextoAtual: contextoJuridico?.versaoContexto,
  };
}
