import { NextResponse } from "next/server";
import { atualizarStatusAtivoBaseJuridica, type TipoGestaoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";

function tipoValido(tipo: string): tipo is TipoGestaoBaseJuridica {
  return tipo === "templates" || tipo === "teses" || tipo === "checklists";
}

function statusValido(status: string): status is "ativo" | "inativo" {
  return status === "ativo" || status === "inativo";
}

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  try {
    const params = await context.params;
    const tipo = params.tipo;
    const ativoId = params.ativoId;

    if (!tipoValido(tipo)) {
      return NextResponse.json({ error: "Tipo de ativo inválido." }, { status: 400 });
    }

    const formData = await request.formData();
    const statusRaw = String(formData.get("status") ?? "");
    const redirectTo = String(formData.get("redirectTo") ?? "/peticoes/base-juridica");

    if (!statusValido(statusRaw)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    await atualizarStatusAtivoBaseJuridica({
      tipo,
      id: ativoId,
      status: statusRaw,
    });

    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao atualizar status do ativo jurídico.",
      },
      { status: 500 },
    );
  }
}
