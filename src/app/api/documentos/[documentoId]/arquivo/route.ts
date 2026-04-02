import { NextResponse } from "next/server";
import { obterSessaoMock } from "@/modules/auth/application/obterSessaoMock";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";

export async function GET(
  _request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  try {
    const sessao = obterSessaoMock();
    if (!sessao) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const params = await context.params;
    const documentoId = params.documentoId;

    if (!documentoId) {
      return NextResponse.json({ error: "documentoId é obrigatório." }, { status: 400 });
    }

    const infra = getDocumentosInfra();
    const documento = await infra.documentoJuridicoRepository.obterPorId(documentoId);
    if (!documento) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }

    const arquivo = await infra.arquivoFisicoRepository.obterPorId(documento.arquivoFisicoId);
    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo físico não encontrado." }, { status: 404 });
    }

    const leitura = await infra.fileStorageGateway.get({ providerKey: arquivo.providerKey });
    if (!leitura) {
      return NextResponse.json(
        { error: "Leitura de arquivo não disponível para este provider." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(new URL(leitura.downloadUrl), { status: 307 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao recuperar arquivo.",
      },
      { status: 500 },
    );
  }
}
