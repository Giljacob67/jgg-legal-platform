import type { TipoDocumento } from "@/modules/documentos/domain/types";

const MIME_TYPES_PERMITIDOS = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const EXTENSOES_PERMITIDAS = new Set(["pdf", "docx", "txt"]);

export function validarTipoDocumento(tipo: string): asserts tipo is TipoDocumento {
  const tipos: TipoDocumento[] = ["Contrato", "Petição", "Comprovante", "Procuração", "Parecer"];

  if (!tipos.includes(tipo as TipoDocumento)) {
    throw new Error("Tipo de documento inválido para o domínio jurídico.");
  }
}

export function validarArquivoPermitido(filename: string, contentType: string): void {
  const extensao = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : undefined;
  const mimeOk = MIME_TYPES_PERMITIDOS.has(contentType);
  const extOk = extensao ? EXTENSOES_PERMITIDAS.has(extensao) : false;

  if (!mimeOk && !extOk) {
    throw new Error("Formato não suportado. Utilize arquivos PDF, DOCX ou TXT.");
  }
}

export function inferirTipoDocumentoArquivo(filename: string, contentType?: string): TipoDocumento {
  const nome = filename.toLowerCase();
  const mime = (contentType ?? "").toLowerCase();

  if (nome.includes("procur") || nome.includes("substabelec")) {
    return "Procuração";
  }

  if (nome.includes("contrato") || nome.includes("aditivo") || nome.includes("distrato")) {
    return "Contrato";
  }

  if (nome.includes("comprov") || nome.includes("boleto") || nome.includes("extrato") || nome.includes("recibo")) {
    return "Comprovante";
  }

  if (nome.includes("parecer") || nome.includes("opiniao")) {
    return "Parecer";
  }

  if (mime.includes("pdf") || mime.includes("word") || mime.includes("text")) {
    return "Petição";
  }

  return "Petição";
}
