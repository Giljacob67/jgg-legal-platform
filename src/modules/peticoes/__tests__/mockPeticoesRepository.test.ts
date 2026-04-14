import { describe, it, expect, beforeEach } from "vitest";
import { MockPeticoesRepository } from "@/modules/peticoes/infrastructure/mockPeticoesRepository";
import type { NovoPedidoPayload } from "@/modules/peticoes/domain/types";

describe("MockPeticoesRepository — contrato do repositório", () => {
  let repo: MockPeticoesRepository;

  beforeEach(() => {
    repo = new MockPeticoesRepository();
  });

  describe("listarPedidos", () => {
    it("deve retornar ao menos um pedido de seed", async () => {
      const pedidos = await repo.listarPedidos();
      expect(pedidos.length).toBeGreaterThan(0);
    });

    it("cada pedido deve ter campos obrigatórios preenchidos", async () => {
      const pedidos = await repo.listarPedidos();
      for (const p of pedidos) {
        expect(p.id).toBeTruthy();
        expect(p.titulo).toBeTruthy();
        expect(p.tipoPeca).toBeTruthy();
        expect(p.status).toBeTruthy();
        expect(p.prioridade).toBeTruthy();
      }
    });
  });

  describe("obterPedidoPorId", () => {
    it("deve retornar o pedido quando o ID existe", async () => {
      const pedidos = await repo.listarPedidos();
      const alvo = pedidos[0];
      const resultado = await repo.obterPedidoPorId(alvo.id);
      expect(resultado).toBeDefined();
      expect(resultado?.id).toBe(alvo.id);
    });

    it("deve retornar undefined para ID inexistente", async () => {
      const resultado = await repo.obterPedidoPorId("ID-INEXISTENTE-9999");
      expect(resultado).toBeUndefined();
    });
  });

  describe("listarEtapasPipeline", () => {
    it("deve retornar pelo menos 5 etapas", async () => {
      const etapas = await repo.listarEtapasPipeline();
      expect(etapas.length).toBeGreaterThanOrEqual(5);
    });

    it("todas as etapas devem ter id e nome", async () => {
      const etapas = await repo.listarEtapasPipeline();
      for (const e of etapas) {
        expect(e.id).toBeTruthy();
        expect(e.nome).toBeTruthy();
      }
    });
  });

  describe("listarHistoricoPipeline", () => {
    it("deve retornar histórico de pedido existente", async () => {
      const pedidos = await repo.listarPedidos();
      const historico = await repo.listarHistoricoPipeline(pedidos[0].id);
      expect(Array.isArray(historico)).toBe(true);
    });

    it("cada entry de histórico deve ter id, etapa, descricao e data", async () => {
      const pedidos = await repo.listarPedidos();
      const historico = await repo.listarHistoricoPipeline(pedidos[0].id);
      for (const h of historico) {
        expect(h.id).toBeTruthy();
        expect(h.etapa).toBeTruthy();
        expect(h.descricao).toBeTruthy();
        expect(h.data).toBeTruthy();
      }
    });
  });

  describe("simularCriacaoPedido", () => {
    const payload: NovoPedidoPayload = {
      casoId: "CAS-TEST-001",
      titulo: "Contestação — Caso de Teste",
      tipoPeca: "Contestação",
      prioridade: "alta",
      prazoFinal: "2027-01-01",
    };

    it("deve criar e retornar o novo pedido", async () => {
      const novo = await repo.simularCriacaoPedido(payload);
      expect(novo.id).toBeTruthy();
      expect(novo.titulo).toBe(payload.titulo);
      expect(novo.tipoPeca).toBe(payload.tipoPeca);
      expect(novo.prioridade).toBe(payload.prioridade);
    });

    it("pedido criado deve ser encontrado por obterPedidoPorId", async () => {
      const novo = await repo.simularCriacaoPedido(payload);
      const encontrado = await repo.obterPedidoPorId(novo.id);
      expect(encontrado).toBeDefined();
      expect(encontrado?.id).toBe(novo.id);
    });

    it("pedido criado deve aparecer em listarPedidos", async () => {
      const antes = (await repo.listarPedidos()).length;
      await repo.simularCriacaoPedido(payload);
      const depois = (await repo.listarPedidos()).length;
      expect(depois).toBe(antes + 1);
    });
  });

  describe("listarTiposPeca", () => {
    it("deve retornar lista não-vazia de tipos de peça", async () => {
      const tipos = await repo.listarTiposPeca();
      expect(tipos.length).toBeGreaterThan(0);
    });
  });
});
