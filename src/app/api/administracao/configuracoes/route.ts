import { NextResponse } from "next/server";
import { obterConfiguracoes, atualizarConfiguracao } from "@/modules/administracao/application";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "read" });
  if (authResult.response) return authResult.response;

  try {
    const configuracoes = await obterConfiguracoes();

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "administracao.configuracoes",
      result: "success",
      details: { total: configuracoes.length },
    });

    return NextResponse.json({ configuracoes });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao obter configurações.", 500);
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as { chave?: string; valor?: string };
    if (!body.chave || body.valor === undefined) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: chave e valor.", 400);
    }

    await atualizarConfiguracao(body.chave, body.valor);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "update",
      resource: "administracao.configuracoes",
      resourceId: body.chave,
      result: "success",
      details: { chave: body.chave },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao atualizar configuração.", 500);
  }
}
