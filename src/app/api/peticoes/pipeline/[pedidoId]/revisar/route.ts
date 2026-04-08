import { NextResponse } from "next/server";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";
import { services } from "@/services/container";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { requireResourceScope } from "@/lib/authz";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "write" });
  if (authResult.response) return authResult.response;

  const { pedidoId } = await params;
  const pedido = await services.peticoesRepository.obterPedidoPorId(pedidoId);
  if (!pedido) {
    return apiError("NOT_FOUND", `Pedido ${pedidoId} não encontrado.`, 404);
  }
  const scopeDenied = requireResourceScope({
    session: authResult.session,
    ownerName: pedido.responsavel ?? null,
  });
  if (scopeDenied) {
    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "peticoes.pipeline.revisao",
      resourceId: pedidoId,
      result: "denied",
    });
    return scopeDenied;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      comentario?: string;
      checklistConferido?: boolean;
    };
    const comentario = typeof body.comentario === "string" ? body.comentario.trim() : "";
    const checklistConferido = body.checklistConferido !== false;

    const infra = getPeticoesOperacionalInfra();
    const redacao = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(pedidoId, "redacao");
    if (!redacao || redacao.status !== "concluido") {
      return apiError(
        "CONFLICT",
        "A redação ainda não foi concluída. Finalize a etapa de redação antes da revisão humana.",
        409,
      );
    }

    if (!checklistConferido) {
      return apiError(
        "VALIDATION_ERROR",
        "Checklist de revisão não confirmado. Conclua a conferência antes de avançar.",
        400,
      );
    }

    const snapshot = await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: "revisao",
      entradaRef: {
        origem: "revisao_humana",
        revisadoPorUserId: authResult.session.user.id,
        revisadoPor: authResult.session.user.name ?? authResult.session.user.email ?? "Usuário",
        redacaoVersao: redacao.versao,
      },
      saidaEstruturada: {
        revisaoHumanaConcluida: true,
        checklistConferido: true,
        comentario: comentario || null,
      },
      status: "concluido",
      tentativa: 1,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "peticoes.pipeline.revisao",
      resourceId: pedidoId,
      result: "success",
      details: { versao: snapshot.versao, comentario: comentario || null, redacaoVersao: redacao.versao },
    });

    return NextResponse.json({
      ok: true,
      pedidoId,
      versao: snapshot.versao,
      revisadoEm: snapshot.executadoEm,
      redacaoVersao: redacao.versao,
    });
  } catch (error) {
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao concluir revisão humana.",
      500,
    );
  }
}
