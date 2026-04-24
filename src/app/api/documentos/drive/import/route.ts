import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { uploadDocumento } from "@/modules/documentos/application/uploadDocumento";
import { inferirTipoDocumentoArquivo, validarTipoDocumento } from "@/modules/documentos/application/validation";
import { baixarArquivoDriveParaImportacao } from "@/modules/drive-explorer/application/importacao";

type Body = {
  driveFileId?: string;
  titulo?: string;
  tipoDocumento?: TipoDocumento;
  vinculos?: Array<{
    tipoEntidade: "caso" | "pedido_peca";
    entidadeId: string;
    papel?: "principal" | "apoio";
  }>;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rbac = await requireRBAC("documentos", "edicao");
  if (rbac) return rbac;

  try {
    const body = (await request.json()) as Body;
    if (!body.driveFileId?.trim()) {
      return NextResponse.json({ error: "driveFileId é obrigatório." }, { status: 400 });
    }
    const vinculos = (body.vinculos ?? []).filter(
      (item) =>
        (item.tipoEntidade === "caso" || item.tipoEntidade === "pedido_peca") &&
        typeof item.entidadeId === "string" &&
        item.entidadeId.trim().length > 0,
    );

    if (vinculos.length === 0) {
      return NextResponse.json({ error: "Informe ao menos um vínculo válido." }, { status: 400 });
    }

    const arquivoDrive = await baixarArquivoDriveParaImportacao(session.user.id, body.driveFileId.trim());
    const tipoDocumento = body.tipoDocumento
      ? (validarTipoDocumento(body.tipoDocumento), body.tipoDocumento)
      : inferirTipoDocumentoArquivo(arquivoDrive.filename, arquivoDrive.contentType);
    const resultado = await uploadDocumento({
      filename: arquivoDrive.filename,
      contentType: arquivoDrive.contentType,
      bytes: arquivoDrive.bytes,
      titulo: body.titulo?.trim() || arquivoDrive.filename.replace(/\.[^.]+$/, ""),
      tipoDocumento,
      vinculos,
    });

    return NextResponse.json({
      documentoId: resultado.documento.id,
      arquivoId: resultado.arquivo.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao importar documento do Google Drive." },
      { status: 500 },
    );
  }
}
