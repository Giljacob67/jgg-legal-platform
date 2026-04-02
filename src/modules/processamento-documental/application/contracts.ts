import type { DocumentoComArquivoEVinculos, EtapaProcessamentoDocumental } from "@/modules/documentos/domain/types";
import type { SaidaEtapaDocumental } from "@/modules/processamento-documental/domain/types";

export interface ProcessadorEtapaDocumental {
  etapa: EtapaProcessamentoDocumental;
  executar(documento: DocumentoComArquivoEVinculos): Promise<SaidaEtapaDocumental>;
}
