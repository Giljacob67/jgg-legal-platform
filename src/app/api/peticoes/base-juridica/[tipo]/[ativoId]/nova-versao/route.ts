import { NextResponse } from "next/server";
import { criarNovaVersaoAtivoBaseJuridica, type TipoGestaoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

function tipoValido(tipo: string): tipo is TipoGestaoBaseJuridica {
  return tipo === "templates" || tipo === "teses" || tipo === "checklists";
}

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const authResult = await requireSessionWithPermission({ modulo: "peticoes", acao: "write" });
  if (authResult.response) return authResult.response;

  try {
    const params = await context.params;
    const tipo = params.tipo;
    const ativoId = params.ativoId;

    if (!tipoValido(tipo)) {
      return apiError("VALIDATION_ERROR", "Tipo de ativo inválido.", 400);
    }

    const formData = await request.formData();
    const redirectTo = String(formData.get("redirectTo") ?? "/peticoes/base-juridica");

    const novo = await criarNovaVersaoAtivoBaseJuridica({
      tipo,
      id: ativoId,
    });

    const destino = `/peticoes/base-juridica/${tipo}/${novo.id}`;
    const finalUrl = redirectTo.includes(`/peticoes/base-juridica/${tipo}/`) ? destino : redirectTo;

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "create",
      resource: "peticoes.base-juridica.nova-versao",
      resourceId: `${tipo}:${ativoId}`,
      result: "success",
      details: { novaVersaoId: novo.id },
    });

    return NextResponse.redirect(new URL(finalUrl, request.url), 303);
  } catch (error) {
    return apiError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Falha ao criar nova versão do ativo jurídico.",
      500,
    );
  }
}
