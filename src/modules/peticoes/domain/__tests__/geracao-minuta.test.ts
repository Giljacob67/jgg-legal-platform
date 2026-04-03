import { describe, it, expect } from "vitest";
import {
  normalizarTipoPecaCanonica,
  normalizarMateriaCanonica,
} from "@/modules/peticoes/domain/geracao-minuta";

describe("normalizarTipoPecaCanonica", () => {
  it("should normalize 'Petição inicial' to 'peticao_inicial'", () => {
    expect(normalizarTipoPecaCanonica("Petição inicial")).toBe("peticao_inicial");
  });

  it("should normalize 'Contestação' to 'contestacao'", () => {
    expect(normalizarTipoPecaCanonica("Contestação")).toBe("contestacao");
  });

  it("should normalize 'Réplica' to 'replica'", () => {
    expect(normalizarTipoPecaCanonica("Réplica")).toBe("replica");
  });

  it("should normalize 'Embargos à execução' to 'embargos_execucao'", () => {
    expect(normalizarTipoPecaCanonica("Embargos à execução")).toBe("embargos_execucao");
  });

  it("should normalize 'Impugnação' to 'impugnacao'", () => {
    expect(normalizarTipoPecaCanonica("Impugnação")).toBe("impugnacao");
  });

  it("should normalize 'Apelação cível' to 'apelacao_civel'", () => {
    expect(normalizarTipoPecaCanonica("Apelação cível")).toBe("apelacao_civel");
  });

  it("should normalize 'Recurso especial cível' to 'recurso_especial_civel'", () => {
    expect(normalizarTipoPecaCanonica("Recurso especial cível")).toBe("recurso_especial_civel");
  });

  it("should normalize 'Agravo de instrumento' to 'agravo_instrumento'", () => {
    expect(normalizarTipoPecaCanonica("Agravo de instrumento")).toBe("agravo_instrumento");
  });

  it("should normalize 'Agravo interno' to 'agravo_interno'", () => {
    expect(normalizarTipoPecaCanonica("Agravo interno")).toBe("agravo_interno");
  });

  it("should normalize 'Embargos de declaração' to 'embargos_declaracao'", () => {
    expect(normalizarTipoPecaCanonica("Embargos de declaração")).toBe("embargos_declaracao");
  });

  it("should normalize 'Mandado de segurança' to 'mandado_seguranca'", () => {
    expect(normalizarTipoPecaCanonica("Mandado de segurança")).toBe("mandado_seguranca");
  });

  it("should normalize 'Habeas corpus' to 'habeas_corpus'", () => {
    expect(normalizarTipoPecaCanonica("Habeas corpus")).toBe("habeas_corpus");
  });

  it("should normalize 'Reconvenção' to 'reconvencao'", () => {
    expect(normalizarTipoPecaCanonica("Reconvenção")).toBe("reconvencao");
  });

  it("should normalize 'Exceção de pré-executividade' to 'excecao_pre_executividade'", () => {
    expect(normalizarTipoPecaCanonica("Exceção de pré-executividade")).toBe("excecao_pre_executividade");
  });

  it("should normalize 'Pedido de tutela de urgência' to 'tutela_urgencia'", () => {
    expect(normalizarTipoPecaCanonica("Pedido de tutela de urgência")).toBe("tutela_urgencia");
  });

  it("should normalize 'Contrarrazões' to 'contrarrazoes'", () => {
    expect(normalizarTipoPecaCanonica("Contrarrazões")).toBe("contrarrazoes");
  });

  it("should normalize 'Manifestação' to 'manifestacao'", () => {
    expect(normalizarTipoPecaCanonica("Manifestação")).toBe("manifestacao");
  });

  it("should normalize 'Recurso' (generic) to 'manifestacao'", () => {
    expect(normalizarTipoPecaCanonica("Recurso")).toBe("manifestacao");
  });

  it("should handle uppercase input", () => {
    expect(normalizarTipoPecaCanonica("PETIÇÃO INICIAL")).toBe("peticao_inicial");
  });

  it("should default unknown types to 'manifestacao'", () => {
    expect(normalizarTipoPecaCanonica("tipo desconhecido")).toBe("manifestacao");
  });
});

describe("normalizarMateriaCanonica", () => {
  it("should normalize 'Cível' to 'civel'", () => {
    expect(normalizarMateriaCanonica("Cível")).toBe("civel");
  });

  it("should normalize 'Trabalhista' to 'trabalhista'", () => {
    expect(normalizarMateriaCanonica("Trabalhista")).toBe("trabalhista");
  });

  it("should normalize 'Tributário' to 'tributario'", () => {
    expect(normalizarMateriaCanonica("Tributário")).toBe("tributario");
  });

  it("should normalize 'Criminal' to 'criminal'", () => {
    expect(normalizarMateriaCanonica("Criminal")).toBe("criminal");
  });

  it("should normalize 'Direito Penal' to 'criminal'", () => {
    expect(normalizarMateriaCanonica("Direito Penal")).toBe("criminal");
  });

  it("should normalize 'Consumidor' to 'consumidor'", () => {
    expect(normalizarMateriaCanonica("Consumidor")).toBe("consumidor");
  });

  it("should normalize 'Empresarial' to 'empresarial'", () => {
    expect(normalizarMateriaCanonica("Empresarial")).toBe("empresarial");
  });

  it("should normalize 'Sociedades e Societário' to 'empresarial'", () => {
    expect(normalizarMateriaCanonica("Societário")).toBe("empresarial");
  });

  it("should normalize 'Família' to 'familia'", () => {
    expect(normalizarMateriaCanonica("Família")).toBe("familia");
  });

  it("should normalize 'Ambiental' to 'ambiental'", () => {
    expect(normalizarMateriaCanonica("Ambiental")).toBe("ambiental");
  });

  it("should normalize agrário/agronegócio variations", () => {
    expect(normalizarMateriaCanonica("Agrário")).toBe("agrario_agronegocio");
    expect(normalizarMateriaCanonica("Agronegócio")).toBe("agrario_agronegocio");
  });

  it("should normalize 'Bancário' to 'bancario'", () => {
    expect(normalizarMateriaCanonica("Bancário")).toBe("bancario");
  });

  it("should default undefined to 'civel'", () => {
    expect(normalizarMateriaCanonica(undefined)).toBe("civel");
  });

  it("should default empty string to 'civel'", () => {
    expect(normalizarMateriaCanonica("")).toBe("civel");
  });
});
