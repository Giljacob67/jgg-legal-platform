import { NextResponse } from "next/server";
import { vincularDocumento } from "@/modules/documentos/application/vincularDocumento";
import { requireAuth } from "@/lib/api-auth";

type VincularDocumentoRequestBody = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const params = await context.params;
    const documentoId = params.documentoId;

    if (!documentoId) {
      return NextResponse.json({ error: "documentoId é obrigatório." }, { status: 400 });
    }

    const body = (await request.json()) as VincularDocumentoRequestBody;

    if (!body.entidadeId?.trim()) {
      return NextResponse.json({ error: "entidadeId é obrigatório." }, { status: 400 });
    }

    if (body.tipoEntidade !== "caso" && body.tipoEntidade !== "pedido_peca") {
      return NextResponse.json({ error: "tipoEntidade inválido." }, { status: 400 });
    }

    const vinculo = await vincularDocumento({
      documentoId,
      tipoEntidade: body.tipoEntidade,
      entidadeId: body.entidadeId,
      papel: body.papel,
    });

    return NextResponse.json({ vinculo });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao vincular documento.",
      },
      { status: 500 },
    );
  }
}
