import { describe, expect, it } from "vitest";
import type { ResultadoEtapaDocumental } from "@/modules/processamento-documental/domain/types";
import {
  montarEtapasConsolidadas,
  statusPipelinePorEtapa,
  type ResultadoProcessamentoDocumento,
} from "../document-processing";

function etapa(input: Partial<ResultadoEtapaDocumental> & Pick<ResultadoEtapaDocumental, "etapa">): ResultadoEtapaDocumental {
  return {
    etapa: input.etapa,
    status: input.status ?? "sucesso",
    tentativa: input.tentativa ?? 1,
    saida: input.saida ?? {},
    codigoErro: input.codigoErro,
    mensagemErro: input.mensagemErro,
  } as ResultadoEtapaDocumental;
}

function documentoMock(id: string, titulo: string): ResultadoProcessamentoDocumento {
  return {
    documento: {
      documento: {
        id,
        titulo,
        tipoDocumento: "Petição",
        resumoJuridico: `Resumo ${id}`,
      },
    } as ResultadoProcessamentoDocumento["documento"],
    etapas: [],
  };
}

describe("document-processing", () => {
  it("consolida etapas para snapshots do pipeline", () => {
    const docA = documentoMock("DOC-1", "Inicial");
    docA.etapas = [
      etapa({
        etapa: "classificacao",
        saida: { classePrincipal: "civil", confianca: 0.9, justificativa: "conteudo civel" },
      }),
      etapa({ etapa: "leitura", saida: { observacao: "ok" } }),
      etapa({
        etapa: "extracao_fatos",
        saida: {
          fatosRelevantes: [{ descricao: "Fato A", trechoBase: "x", documentoId: "DOC-1" }],
          cronologia: [{ data: "2026-01-01", descricao: "Evento A", documentoId: "DOC-1" }],
          pontosControvertidos: ["Ponto A"],
        },
      }),
      etapa({ etapa: "resumo", saida: { resumo: "Resumo A", palavrasChave: ["a"] } }),
    ];

    const docB = documentoMock("DOC-2", "Contestação");
    docB.etapas = [
      etapa({
        etapa: "classificacao",
        saida: { classePrincipal: "trabalhista", confianca: 0.85, justificativa: "conteudo trabalhista" },
      }),
      etapa({ etapa: "leitura", saida: { observacao: "ok" }, status: "parcial" }),
      etapa({
        etapa: "extracao_fatos",
        saida: {
          fatosRelevantes: [{ descricao: "Fato B", trechoBase: "y", documentoId: "DOC-2" }],
          cronologia: [{ data: "2026-01-02", descricao: "Evento B", documentoId: "DOC-2" }],
          pontosControvertidos: ["Ponto B"],
        },
      }),
      etapa({ etapa: "resumo", saida: { resumo: "Resumo B", palavrasChave: ["b"] } }),
    ];

    const etapas = montarEtapasConsolidadas("PED-2026-001", [docA, docB]);
    expect(etapas).toHaveLength(6);

    const classificacao = etapas.find((item) => item.etapa === "classificacao");
    expect(classificacao?.saida.totalDocumentos).toBe(2);

    const extracao = etapas.find((item) => item.etapa === "extracao_de_fatos");
    expect(Array.isArray(extracao?.saida.fatosRelevantes)).toBe(true);
    expect((extracao?.saida.fatosRelevantes as unknown[]).length).toBe(2);
  });

  it("calcula status de etapa para snapshots", () => {
    expect(statusPipelinePorEtapa([])).toBe("pendente");

    expect(
      statusPipelinePorEtapa([
        etapa({ etapa: "classificacao", status: "sucesso" }),
        etapa({ etapa: "classificacao", status: "parcial" }),
      ]),
    ).toBe("concluido");

    expect(
      statusPipelinePorEtapa([
        etapa({ etapa: "classificacao", status: "falha" }),
      ]),
    ).toBe("erro");
  });
});
