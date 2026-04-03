/**
 * Extrator de texto de arquivos PDF e DOCX — server-side only.
 * Nunca importe este arquivo em Client Components.
 */

// Extrai texto de um Buffer de PDF
export async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const resultado = await pdfParse(buffer);
  return resultado.text.trim();
}

// Extrai texto de um Buffer de DOCX
export async function extrairTextoDOCX(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require("mammoth") as {
    extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const resultado = await mammoth.extractRawText({ buffer });
  return resultado.value.trim();
}

// Detecta extrator pelo MIME type
export async function extrairTexto(buffer: Buffer, mimeType: string): Promise<string> {
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("pdf")
  ) {
    return extrairTextoPDF(buffer);
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("docx")
  ) {
    return extrairTextoDOCX(buffer);
  }
  if (
    mimeType === "text/plain" ||
    mimeType.startsWith("text/")
  ) {
    return buffer.toString("utf-8").trim();
  }
  throw new Error(`Tipo de arquivo não suportado para extração de texto: ${mimeType}`);
}
