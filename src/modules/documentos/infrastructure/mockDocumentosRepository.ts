import type { DocumentoListItem } from "@/modules/documentos/domain/types";

export interface DocumentosRepository {
  listarDocumentos(): DocumentoListItem[];
  listarPorCaso(casoId: string): DocumentoListItem[];
}

export class MockDocumentosRepository implements DocumentosRepository {
  private readonly documentos: DocumentoListItem[] = [
    {
      id: "DOC-001",
      casoId: "CAS-2026-001",
      titulo: "Contrato principal de fornecimento",
      tipo: "Contrato",
      status: "lido",
      statusProcessamento: "processado",
      dataUpload: "2026-03-29T11:20:00-03:00",
      tamanhoMb: 3.2,
      resumo: "Instrumento com cláusulas de penalidade e prazo de entrega.",
      urlArquivo: "mock://storage/mock/ARQ-001-contrato-principal.pdf",
    },
    {
      id: "DOC-002",
      casoId: "CAS-2026-001",
      titulo: "Notificação extrajudicial enviada",
      tipo: "Comprovante",
      status: "extraído",
      statusProcessamento: "processado",
      dataUpload: "2026-03-30T09:50:00-03:00",
      tamanhoMb: 1.1,
      resumo: "Comprovante de recebimento e prazo para resposta.",
      urlArquivo: "mock://storage/mock/ARQ-002-notificacao.pdf",
    },
    {
      id: "DOC-003",
      casoId: "CAS-2026-001",
      pedidoId: "PED-2026-001",
      titulo: "Minuta inicial da petição",
      tipo: "Petição",
      status: "pendente de leitura",
      statusProcessamento: "nao_iniciado",
      dataUpload: "2026-04-01T15:05:00-03:00",
      tamanhoMb: 0.8,
      resumo: "Versão preliminar para alinhamento de estratégia.",
      urlArquivo: "mock://storage/mock/ARQ-003-minuta-inicial.docx",
    },
    {
      id: "DOC-004",
      casoId: "CAS-2026-002",
      titulo: "Planilha de controle de jornada",
      tipo: "Comprovante",
      status: "extraído",
      statusProcessamento: "processado",
      dataUpload: "2026-03-28T16:00:00-03:00",
      tamanhoMb: 2.4,
      resumo: "Consolidação mensal de ponto do colaborador.",
      urlArquivo: "mock://storage/mock/ARQ-004-jornada.pdf",
    },
    {
      id: "DOC-005",
      casoId: "CAS-2026-002",
      titulo: "Procuração ad judicia",
      tipo: "Procuração",
      status: "lido",
      statusProcessamento: "processado",
      dataUpload: "2026-03-28T11:35:00-03:00",
      tamanhoMb: 0.4,
      resumo: "Procuração com poderes para contestação e recursos.",
      urlArquivo: "mock://storage/mock/ARQ-005-procuracao.pdf",
    },
    {
      id: "DOC-006",
      casoId: "CAS-2026-003",
      titulo: "Parecer contábil tributário",
      tipo: "Parecer",
      status: "pendente de leitura",
      statusProcessamento: "enfileirado",
      dataUpload: "2026-04-01T10:30:00-03:00",
      tamanhoMb: 4.9,
      resumo: "Memorial técnico sobre base de cálculo questionada.",
      urlArquivo: "mock://storage/mock/ARQ-006-parecer.pdf",
    },
  ];

  listarDocumentos(): DocumentoListItem[] {
    return this.documentos;
  }

  listarPorCaso(casoId: string): DocumentoListItem[] {
    return this.documentos.filter((documento) => documento.casoId === casoId);
  }
}
