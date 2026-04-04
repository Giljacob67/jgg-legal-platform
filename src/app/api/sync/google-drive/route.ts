import { NextResponse } from "next/server";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import { processarDocumento } from "@/modules/biblioteca-conhecimento/infrastructure/processamentoPipeline.server";
import { isDriveConfigurado, listarArquivosDrive, baixarArquivoDrive } from "@/modules/biblioteca-conhecimento/infrastructure/driveClient.server";
import { inferirTipoPorPasta } from "@/modules/biblioteca-conhecimento/domain/types";
import type { ResultadoSyncDrive } from "@/modules/biblioteca-conhecimento/domain/types";
import { requireAuth } from "@/lib/api-auth";

// Armazena status da última sync em memória
let ultimaSync: ResultadoSyncDrive | null = null;

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  return NextResponse.json({
    configurado: isDriveConfigurado(),
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
    ultimaSync,
  });
}

export async function POST() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  if (!isDriveConfigurado()) {
    return NextResponse.json(
      {
        error: "Google Drive não configurado. Adicione GOOGLE_SERVICE_ACCOUNT_KEY e GOOGLE_DRIVE_FOLDER_ID no Vercel.",
        configurado: false,
      },
      { status: 503 }
    );
  }

  const detalhes: ResultadoSyncDrive["detalhes"] = [];
  let novos = 0;
  let pulados = 0;
  let erros = 0;

  try {
    const repo = getBibliotecaRepo();
    const arquivos = await listarArquivosDrive();

    for (const arquivo of arquivos) {
      const existente = await repo.encontrarPorDriveId(arquivo.id);
      if (existente) {
        pulados++;
        detalhes.push({ arquivo: arquivo.nome, status: "pulado" });
        continue;
      }

      try {
        const tipoInferido = inferirTipoPorPasta(arquivo.folderPath || arquivo.nome);
        const titulo = arquivo.nome.replace(/\.[^.]+$/, "");

        const doc = await repo.criar({
          titulo,
          tipo: tipoInferido,
          fonte: "google_drive",
          driveFileId: arquivo.id,
          driveFolderPath: arquivo.folderPath,
          mimeType: arquivo.mimeType,
          tamanhoBytes: arquivo.tamanhoBytes,
        });

        const { buffer, mimeTypeEfetivo } = await baixarArquivoDrive(arquivo.id, arquivo.mimeType);
        await processarDocumento(doc.id, buffer, mimeTypeEfetivo);

        novos++;
        detalhes.push({ arquivo: arquivo.nome, status: "novo" });
      } catch (err) {
        erros++;
        detalhes.push({
          arquivo: arquivo.nome,
          status: "erro",
          erro: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    ultimaSync = { novos, pulados, erros, detalhes, executadoEm: new Date().toISOString() };
    return NextResponse.json(ultimaSync);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro na sincronização." },
      { status: 500 }
    );
  }
}
