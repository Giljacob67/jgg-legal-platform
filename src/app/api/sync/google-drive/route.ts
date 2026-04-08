import { NextResponse } from "next/server";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import { processarDocumento } from "@/modules/biblioteca-conhecimento/infrastructure/processamentoPipeline.server";
import { isDriveConfigurado, listarArquivosDrive, baixarArquivoDrive } from "@/modules/biblioteca-conhecimento/infrastructure/driveClient.server";
import { inferirTipoPorPasta } from "@/modules/biblioteca-conhecimento/domain/types";
import type { ResultadoSyncDrive } from "@/modules/biblioteca-conhecimento/domain/types";
import { requireSessionWithPermission } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/security/audit-log";

let ultimaSync: ResultadoSyncDrive | null = null;

export async function GET(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "biblioteca_juridica", acao: "read" });
  if (authResult.response) return authResult.response;

  await writeAuditLog({
    request,
    session: authResult.session,
    action: "read",
    resource: "biblioteca.sync-google-drive",
    result: "success",
    details: {
      configurado: isDriveConfigurado(),
      hasUltimaSync: Boolean(ultimaSync),
    },
  });

  return NextResponse.json({
    configurado: isDriveConfigurado(),
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
    ultimaSync,
  });
}

export async function POST(request: Request) {
  const authResult = await requireSessionWithPermission({ modulo: "biblioteca_juridica", acao: "execute" });
  if (authResult.response) return authResult.response;

  if (!isDriveConfigurado()) {
    return apiError(
      "INTERNAL_ERROR",
      "Google Drive não configurado. Adicione GOOGLE_SERVICE_ACCOUNT_KEY e GOOGLE_DRIVE_FOLDER_ID.",
      503,
      { configurado: false },
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

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "execute",
      resource: "biblioteca.sync-google-drive",
      result: erros > 0 ? "error" : "success",
      details: {
        novos,
        pulados,
        erros,
      },
    });

    return NextResponse.json(ultimaSync);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na sincronização.";

    await writeAuditLog({
      request,
      session: authResult.session,
      action: "execute",
      resource: "biblioteca.sync-google-drive",
      result: "error",
      details: { error: message },
    });

    return apiError("INTERNAL_ERROR", message, 500);
  }
}
