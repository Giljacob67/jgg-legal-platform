import type { EtapaProcessamentoDocumental } from "@/modules/documentos/domain/types";
import type { EtapaPipeline } from "@/modules/peticoes/domain/types";

export const ETAPAS_IMPLEMENTADAS_PIPELINE: EtapaPipeline[] = [
  "classificacao",
  "leitura_documental",
  "extracao_de_fatos",
  "estrategia_juridica",
  "redacao",
  "revisao",
];

export const ETAPAS_MOCK_CONTROLADO: EtapaPipeline[] = [
  "analise_adversa",
  "analise_documental_do_cliente",
  "pesquisa_de_apoio",
];

export const MAPA_ETAPA_DOCUMENTAL_PIPELINE: Record<EtapaProcessamentoDocumental, EtapaPipeline> = {
  leitura: "leitura_documental",
  classificacao: "classificacao",
  resumo: "redacao",
  extracao_fatos: "extracao_de_fatos",
};
