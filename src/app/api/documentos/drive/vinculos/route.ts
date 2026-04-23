import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRBAC } from "@/lib/api-auth";
import { criarVinculoDriveExplorer } from "@/modules/drive-explorer/application/vinculos";

type Body = {
  driveFileId?: string;
  driveFileName?: string;
  driveMimeType?: string;
  driveWebViewLink?: string;
  tipoEntidade?: "caso" | "pedido" | "cliente";
  entidadeId?: string;
  entidadeLabel?: string;
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
    if (!body.driveFileId?.trim() || !body.driveFileName?.trim()) {
      return NextResponse.json({ error: "Arquivo do Drive inválido." }, { status: 400 });
    }
    if (!body.entidadeId?.trim() || !body.entidadeLabel?.trim()) {
      return NextResponse.json({ error: "Selecione um registro válido para vincular." }, { status: 400 });
    }
    if (body.tipoEntidade !== "caso" && body.tipoEntidade !== "pedido" && body.tipoEntidade !== "cliente") {
      return NextResponse.json({ error: "tipoEntidade inválido." }, { status: 400 });
    }

    const vinculo = await criarVinculoDriveExplorer({
      userId: session.user.id,
      driveFileId: body.driveFileId.trim(),
      driveFileName: body.driveFileName.trim(),
      driveMimeType: body.driveMimeType?.trim(),
      driveWebViewLink: body.driveWebViewLink?.trim(),
      tipoEntidade: body.tipoEntidade,
      entidadeId: body.entidadeId.trim(),
      entidadeLabel: body.entidadeLabel.trim(),
    });

    return NextResponse.json({ vinculo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao criar vínculo operacional do arquivo." },
      { status: 500 },
    );
  }
}
