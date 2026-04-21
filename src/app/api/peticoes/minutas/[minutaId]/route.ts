import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { getSqlClient } from "@/lib/database/client";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";
import { getRequestId, jsonError, jsonWithRequestId, logApiError, logApiInfo } from "@/lib/api-response";

type RouteContext = { params: Promise<{ minutaId: string }> };
type PatchMinutaPayload = { conteudo: string; resumo?: string; ultimaVersaoConhecida?: number };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const requestId = getRequestId(req);

  const forbidden = await requireRBAC("peticoes", "edicao");
  if (forbidden) return forbidden;

  const session = await auth();
  if (!session) {
    return jsonError(requestId, "Não autorizado.", 401);
  }

  const { minutaId } = await params;

  let conteudo: string;
  let resumo: string | undefined;
  let ultimaVersaoConhecida: number | undefined;
  try {
    const body = (await req.json()) as PatchMinutaPayload;
    if (!body.conteudo || typeof body.conteudo !== "string") {
      return jsonError(requestId, "Campo 'conteudo' é obrigatório.", 400);
    }
    if (
      body.ultimaVersaoConhecida !== undefined &&
      (!Number.isInteger(body.ultimaVersaoConhecida) || body.ultimaVersaoConhecida < 0)
    ) {
      return jsonError(requestId, "Campo 'ultimaVersaoConhecida' deve ser um número inteiro >= 0.", 400);
    }

    conteudo = body.conteudo;
    resumo = body.resumo;
    ultimaVersaoConhecida = body.ultimaVersaoConhecida;
  } catch {
    return jsonError(requestId, "Corpo da requisição inválido.", 400);
  }

  try {
    const sql = getSqlClient();
    const autor = session.user?.name ?? session.user?.email ?? "Usuário";

    const resultado = await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as typeof sql;

      const minutas = await tx<Array<{ id: string; pedido_id: string | null }>>`
        SELECT id, pedido_id
        FROM minutas
        WHERE id = ${minutaId}
        FOR UPDATE
      `;

      if (minutas.length === 0) {
        return { tipo: "not_found" as const };
      }

      const pedidoId = minutas[0].pedido_id ?? "";
      if (!pedidoId) {
        return { tipo: "sem_pedido" as const };
      }

      const pedido = await obterPedidoDePeca(pedidoId);
      if (!pedido) {
        return { tipo: "pedido_nao_encontrado" as const };
      }

      const versoes = await tx<Array<{ max_numero: number | null }>>`
        SELECT MAX(numero)::int AS max_numero
        FROM versoes_minuta
        WHERE minuta_id = ${minutaId}
        FOR UPDATE
      `;

      const numeroAtual = versoes[0]?.max_numero ?? 0;
      if (ultimaVersaoConhecida !== undefined && ultimaVersaoConhecida !== numeroAtual) {
        return {
          tipo: "conflito_concorrencia" as const,
          numeroAtual,
          numeroRecebido: ultimaVersaoConhecida,
        };
      }

      const proximoNumero = numeroAtual + 1;
      const versaoId = `VER-${minutaId}-${proximoNumero.toString().padStart(3, "0")}`;

      await tx`
        UPDATE minutas
        SET conteudo_atual = ${conteudo}
        WHERE id = ${minutaId}
      `;

      await tx`
        INSERT INTO versoes_minuta (id, minuta_id, numero, autor, resumo_mudancas, conteudo)
        VALUES (
          ${versaoId},
          ${minutaId},
          ${proximoNumero},
          ${autor},
          ${resumo ?? "Rascunho salvo manualmente."},
          ${conteudo}
        )
      `;

      return {
        tipo: "ok" as const,
        versaoId,
        numero: proximoNumero,
        numeroAnterior: numeroAtual,
      };
    });

    if (resultado.tipo === "not_found") {
      return jsonError(requestId, "Minuta não encontrada.", 404);
    }
    if (resultado.tipo === "sem_pedido") {
      return jsonError(requestId, "Minuta sem pedido vinculado.", 422);
    }
    if (resultado.tipo === "pedido_nao_encontrado") {
      return jsonError(requestId, "Pedido da minuta não encontrado.", 404);
    }
    if (resultado.tipo === "conflito_concorrencia") {
      return jsonError(requestId, "Conflito de concorrência ao salvar minuta. Atualize a página e tente novamente.", 409, {
        ultimaVersaoAtual: resultado.numeroAtual,
        ultimaVersaoEnviada: resultado.numeroRecebido,
      });
    }

    logApiInfo("api/peticoes/minutas/PATCH", requestId, "minuta salva", {
      minutaId,
      versao: resultado.numero,
      usuarioId: session.user.id,
    });

    return jsonWithRequestId(
      requestId,
      {
        ok: true,
        versaoId: resultado.versaoId,
        numero: resultado.numero,
        numeroAnterior: resultado.numeroAnterior,
        savedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    logApiError("api/peticoes/minutas/PATCH", requestId, error, { minutaId });
    return jsonError(
      requestId,
      error instanceof Error ? error.message : "Erro ao salvar minuta.",
      500,
    );
  }
}
