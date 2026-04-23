import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { buscarArquivosImportaveisDrive } from "@/modules/drive-explorer/application/importacao";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rbac = await requireRBAC("documentos", "edicao");
  if (rbac) return rbac;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ itens: [] });
    const itens = await buscarArquivosImportaveisDrive(session.user.id, q);
    return NextResponse.json({ itens });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao buscar arquivos do Drive." },
      { status: 500 },
    );
  }
}
