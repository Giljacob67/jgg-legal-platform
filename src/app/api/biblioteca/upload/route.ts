import { NextResponse } from "next/server";
import { getBibliotecaRepo } from "@/modules/biblioteca-conhecimento/infrastructure/mockBibliotecaRepository";
import { processarDocumento } from "@/modules/biblioteca-conhecimento/infrastructure/processamentoPipeline.server";
import { inferirTipoPorPasta } from "@/modules/biblioteca-conhecimento/domain/types";
import type { TipoDocumentoBC } from "@/modules/biblioteca-conhecimento/domain/types";

// Tamanho máximo: 20 MB
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const titulo = (formData.get("titulo") as string | null)?.trim();
    const tipoManual = formData.get("tipo") as TipoDocumentoBC | null;

    if (!arquivo) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });

    if (arquivo.size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo excede o limite de 20 MB." }, { status: 413 });
    }

    const mimeType = arquivo.type || "application/octet-stream";
    const tiposPermitidos = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!tiposPermitidos.includes(mimeType)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${mimeType}. Use PDF, DOCX ou TXT.` },
        { status: 415 }
      );
    }

    const nomeArquivo = arquivo.name;
    const tipoInferido = tipoManual ?? inferirTipoPorPasta(nomeArquivo);
    const tituloFinal = titulo || nomeArquivo.replace(/\.[^.]+$/, "");

    // Registra documento
    const repo = getBibliotecaRepo();
    const doc = await repo.criar({
      titulo: tituloFinal,
      tipo: tipoInferido,
      fonte: "upload_manual",
      mimeType,
      tamanhoBytes: arquivo.size,
    });

    // Processa em background (em prod: usar queue — Vercel funciona com await aqui)
    const arrayBuffer = await arquivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { chunksGerados } = await processarDocumento(doc.id, buffer, mimeType);

    // Retorna documento atualizado
    const docAtualizado = (await repo.listar()).find((d) => d.id === doc.id) ?? doc;

    return NextResponse.json(
      { documento: docAtualizado, chunksGerados },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro no upload." },
      { status: 500 }
    );
  }
}
