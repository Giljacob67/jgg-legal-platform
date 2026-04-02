import { NextResponse } from "next/server";
import { listarDocumentosComDetalhes } from "@/modules/documentos/application/listarDocumentos";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const casoId = searchParams.get("casoId") ?? undefined;
    const pedidoId = searchParams.get("pedidoId") ?? undefined;

    const documentos = await listarDocumentosComDetalhes({ casoId, pedidoId });

    return NextResponse.json({ documentos });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao listar documentos.",
      },
      { status: 500 },
    );
  }
}
