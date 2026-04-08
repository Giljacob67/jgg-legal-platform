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
      action: "approve",
      resource: "peticoes.pipeline.aprovacao",
      resourceId: pedidoId,
      result: "denied",
    });
    return scopeDenied;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { comentario?: string };
    const comentario = typeof body.comentario === "string" ? body.comentario.trim() : "";

    const infra = getPeticoesOperacionalInfra();
    const revisao = await infra.pipelineSnapshotRepository.obterUltimoPorEtapa(pedidoId, "revisao");
    const revisaoHumanaConcluida =
      revisao?.status === "concluido" &&
      Boolean((revisao.saidaEstruturada as { revisaoHumanaConcluida?: boolean }).revisaoHumanaConcluida);

    if (!revisaoHumanaConcluida) {
      return apiError(
        "CONFLICT",
        "A revisão humana ainda não foi concluída. Finalize a etapa de revisão antes de aprovar.",
        409,
      );
    }

    const snapshot = await infra.pipelineSnapshotRepository.salvarNovaVersao({
      pedidoId,
      etapa: "aprovacao",
      entradaRef: {
        origem: "revisao_humana",
        aprovadoPorUserId: authResult.session.user.id,
        aprovadoPor: authResult.session.user.name ?? authResult.session.user.email ?? "Usuário",
      },
      saidaEstruturada: {
        aprovado: true,
        comentario: comentario || null,
      },
      status: "concluido",
      tentativa: 1,
    });

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "approve",
      resource: "peticoes.pipeline.aprovacao",
      resourceId: pedidoId,
      result: "success",
      details: { comentario: comentario || null, versao: snapshot.versao },
    });

    return NextResponse.json({
      ok: true,
      pedidoId,
      versao: snapshot.versao,
      aprovadoEm: snapshot.executadoEm,
    });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Falha ao aprovar revisão.", 500);
  }
}
