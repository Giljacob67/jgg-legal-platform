import { describe, it, expect } from "vitest";
import {
  criarTemplatesJuridicosPadrao,
  criarTesesJuridicasPadrao,
  criarChecklistsJuridicosPadrao,
} from "../infrastructure/defaultCatalog";

describe("defaultCatalog — validação de schema", () => {
  describe("criarTemplatesJuridicosPadrao()", () => {
    it("cada template tem campos obrigatórios", () => {
      const templates = criarTemplatesJuridicosPadrao();
      for (const t of templates) {
        expect(t.id, `${t.id} deve ter id`).toBeTruthy();
        expect(t.nome, `${t.id} deve ter nome`).toBeTruthy();
        expect(t.tipo, `${t.id} deve ter tipo`).toBe("template");
        expect(t.versao, `${t.id} deve ter versão`).toBeGreaterThan(0);
        expect(t.status, `${t.id} deve ter status`).toBeTruthy();
        expect(Array.isArray(t.blocos), `${t.id} deve ter blocos array`).toBe(true);
        expect(t.blocos.length, `${t.id} deve ter ao menos 1 bloco`).toBeGreaterThan(0);
        expect(Array.isArray(t.tiposPecaCanonica), `${t.id} deve ter tiposPecaCanonica`).toBe(true);
        expect(Array.isArray(t.materias), `${t.id} deve ter materias`).toBe(true);
      }
    });

    it("ids são únicos", () => {
      const templates = criarTemplatesJuridicosPadrao();
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("cada bloco tem id e orientacaoBase", () => {
      const templates = criarTemplatesJuridicosPadrao();
      for (const t of templates) {
        for (const bloco of t.blocos) {
          expect(bloco.id, `bloco de ${t.id} deve ter id`).toBeTruthy();
          expect(bloco.orientacaoBase, `bloco ${bloco.id} de ${t.id} deve ter orientacaoBase`).toBeTruthy();
        }
      }
    });
  });

  describe("criarTesesJuridicasPadrao()", () => {
    it("cada tese tem campos obrigatórios", () => {
      const teses = criarTesesJuridicasPadrao();
      for (const t of teses) {
        expect(t.id, `tese deve ter id`).toBeTruthy();
        expect(t.titulo, `${t.id} deve ter titulo`).toBeTruthy();
        expect(t.fundamentoSintetico, `${t.id} deve ter fundamentoSintetico`).toBeTruthy();
        expect(t.tipo, `${t.id} deve ter tipo`).toBe("tese");
        expect(t.status, `${t.id} deve ter status`).toBeTruthy();
        expect(Array.isArray(t.materias), `${t.id} deve ter materias`).toBe(true);
        expect(t.materias.length, `${t.id} deve ter ao menos 1 materia`).toBeGreaterThan(0);
        expect(Array.isArray(t.tiposPecaCanonica), `${t.id} deve ter tiposPecaCanonica`).toBe(true);
      }
    });

    it("ids são únicos", () => {
      const teses = criarTesesJuridicasPadrao();
      const ids = teses.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("criarChecklistsJuridicosPadrao()", () => {
    it("cada checklist tem campos obrigatórios", () => {
      const checklists = criarChecklistsJuridicosPadrao();
      for (const c of checklists) {
        expect(c.id, `checklist deve ter id`).toBeTruthy();
        expect(c.descricao, `${c.id} deve ter descricao`).toBeTruthy();
        expect(c.tipo, `${c.id} deve ter tipo`).toBe("checklist");
        expect(["obrigatorio", "recomendavel"], `${c.id} categoria inválida`).toContain(c.categoria);
        expect(Array.isArray(c.materias), `${c.id} deve ter materias`).toBe(true);
      }
    });

    it("ids são únicos", () => {
      const checklists = criarChecklistsJuridicosPadrao();
      const ids = checklists.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
