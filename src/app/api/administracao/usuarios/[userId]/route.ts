import { NextResponse } from "next/server";
import { atualizarPerfilUsuario, ativarDesativarUsuario } from "@/modules/administracao/application";
import type { PerfilUsuario } from "@/modules/administracao/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "admin" });
  if (authResult.response) return authResult.response;

  const { userId } = await params;

  try {
    const body = (await request.json()) as { perfil?: PerfilUsuario; ativo?: boolean };

    if (body.perfil !== undefined) {
      const usuario = await atualizarPerfilUsuario(userId, body.perfil);

      await writeAuditLog({
        request,
        session: authResult.session,
        action: "update",
        resource: "administracao.usuarios",
        resourceId: userId,
        result: "success",
        details: { perfil: body.perfil },
      });

      return NextResponse.json({ usuario });
    }

    if (body.ativo !== undefined) {
      const usuario = await ativarDesativarUsuario(userId, body.ativo);

      await writeAuditLog({
        request,
        session: authResult.session,
        action: "update",
        resource: "administracao.usuarios",
        resourceId: userId,
        result: "success",
        details: { ativo: body.ativo },
      });

      return NextResponse.json({ usuario });
    }

    return apiError("VALIDATION_ERROR", "Forneça 'perfil' ou 'ativo'.", 400);
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao atualizar usuário.", 500);
  }
}
