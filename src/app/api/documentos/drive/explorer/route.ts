import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { listarArquivosDriveExplorer } from "@/modules/drive-explorer/application/importacao";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rbac = await requireRBAC("documentos", "edicao");
  if (rbac) return rbac;

  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId")?.trim() || undefined;
    const resultado = await listarArquivosDriveExplorer(session.user.id, { folderId });
    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar arquivos do Google Drive." },
      { status: 500 },
    );
  }
}
