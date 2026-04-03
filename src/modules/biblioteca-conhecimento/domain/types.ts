// ─────────────────────────────────────────────────────────────
// MÓDULO BIBLIOTECA DE CONHECIMENTO — Domain Types
// ─────────────────────────────────────────────────────────────

export type TipoDocumentoBC =
  | "peticao"
  | "contrato"
  | "jurisprudencia"
  | "tese"
  | "modelo"
  | "dossie"
  | "checklist"
  | "outro";

export const LABEL_TIPO_BC: Record<TipoDocumentoBC, string> = {
  peticao: "Petição/Peça Processual",
  contrato: "Contrato",
  jurisprudencia: "Jurisprudência",
  tese: "Tese Jurídica",
  modelo: "Modelo",
  dossie: "Dossiê",
  checklist: "Checklist",
  outro: "Outro",
};

export const EMOJI_TIPO_BC: Record<TipoDocumentoBC, string> = {
  peticao: "⚖️",
  contrato: "📄",
  jurisprudencia: "🏛️",
  tese: "💡",
  modelo: "📋",
  dossie: "📁",
  checklist: "✅",
  outro: "📎",
};

export type FonteDocumentoBC = "upload_manual" | "google_drive";
export type StatusEmbedding = "pendente" | "processando" | "concluido" | "erro";

export interface DocumentoBiblioteca {
  id: string;
  titulo: string;
  tipo: TipoDocumentoBC;
  subtipo?: string;              // ex: "contestação", "arrendamento_rural"
  fonte: FonteDocumentoBC;
  driveFileId?: string;          // para deduplicação no re-sync
  driveFolderPath?: string;      // caminho no Drive, ex: "01_Jurídico/Clientes Ativos/..."
  urlArquivo?: string;           // Vercel Blob URL
  mimeType?: string;
  tamanhoBytes?: number;
  chunksGerados: number;
  embeddingStatus: StatusEmbedding;
  erroProcessamento?: string;
  processadoEm?: string;
  criadoEm: string;
}

export interface ResultadoSyncDrive {
  novos: number;
  pulados: number;
  erros: number;
  detalhes: { arquivo: string; status: "novo" | "pulado" | "erro"; erro?: string }[];
  executadoEm: string;
}

// Mapeamento de pasta Drive → tipo de documento
// Baseado na estrutura real do escritório:
export const PASTA_DRIVE_PARA_TIPO: Array<{ padroes: string[]; tipo: TipoDocumentoBC; subtipo?: string }> = [
  { padroes: ["01_jurídico", "01_juridico", "clientes ativos", "clientes inativos"], tipo: "peticao" },
  { padroes: ["07_contratos", "contratos"], tipo: "contrato" },
  { padroes: ["06_modelos", "modelos"], tipo: "modelo" },
  { padroes: ["05_biblioteca", "pesquisa", "rag - agrário", "rag - agrario", "teses jurídicas", "teses juridicas"], tipo: "tese" },
  { padroes: ["agiotagem", "dossie", "dossiê"], tipo: "dossie" },
  { padroes: ["jurisprudência", "jurisprudencia"], tipo: "jurisprudencia" },
  { padroes: ["checklist"], tipo: "checklist" },
];

export function inferirTipoPorPasta(folderPath: string): TipoDocumentoBC {
  const lower = folderPath.toLowerCase();
  for (const { padroes, tipo } of PASTA_DRIVE_PARA_TIPO) {
    if (padroes.some((p) => lower.includes(p))) return tipo;
  }
  return "outro";
}
