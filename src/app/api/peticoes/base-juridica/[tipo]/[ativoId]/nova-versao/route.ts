import { NextResponse } from "next/server";
import { criarNovaVersaoAtivoBaseJuridica, type TipoGestaoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";

function tipoValido(tipo: string): tipo is TipoGestaoBaseJuridica {
  return tipo === "templates" || tipo === "teses" || tipo === "checklists";
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
    const redirectTo = String(formData.get("redirectTo") ?? "/peticoes/base-juridica");

    const novo = await criarNovaVersaoAtivoBaseJuridica({
      tipo,
      id: ativoId,
    });

    const destino = `/peticoes/base-juridica/${tipo}/${novo.id}`;
    const finalUrl = redirectTo.includes(`/peticoes/base-juridica/${tipo}/`) ? destino : redirectTo;

    return NextResponse.redirect(new URL(finalUrl, request.url), 303);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao criar nova versão do ativo jurídico.",
      },
      { status: 500 },
    );
  }
}
