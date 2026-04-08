import { NextResponse } from "next/server";
import { listarUsuarios, convidarUsuario } from "@/modules/administracao/application";
import type { ConviteUsuario } from "@/modules/administracao/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { enviarEmailConvite } from "@/lib/email/convite";
import { writeAuditLog } from "@/lib/security/audit-log";

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "admin" });
  if (authResult.response) return authResult.response;

  try {
    const usuarios = await listarUsuarios();

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "read",
      resource: "administracao.usuarios",
      result: "success",
      details: { total: usuarios.length },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao listar usuários.", 500);
  }
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "administracao", acao: "admin" });
  if (authResult.response) return authResult.response;

  try {
    const body = (await request.json()) as ConviteUsuario;
    if (!body.nome || !body.email || !body.perfil) {
      return apiError("VALIDATION_ERROR", "Campos obrigatórios: nome, email e perfil.", 400);
    }

    const usuario = await convidarUsuario(body);
    const resultadoEmail = await enviarEmailConvite(body.nome, body.email, body.perfil);

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "administracao.usuarios",
      resourceId: usuario.id,
      result: "success",
      details: { perfil: body.perfil, email: body.email },
    });

    return NextResponse.json({ usuario, email: resultadoEmail }, { status: 201 });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Erro ao convidar usuário.", 500);
  }
}
