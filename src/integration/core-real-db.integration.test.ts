import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getSqlClient } from "@/lib/database/client";
import { assertMigrationsApplied, truncateCoreTables, uniqueId } from "@/integration/helpers/db";

describe("Core Integration (Postgres real)", () => {
  beforeAll(async () => {
    expect(process.env.DATA_MODE).toBe("real");
    await assertMigrationsApplied();
  });

  beforeEach(async () => {
    await truncateCoreTables();
  });

  afterAll(async () => {
    await truncateCoreTables();
    await getSqlClient().end();
  });

  it("integra casos + petições em repositórios reais", async () => {
    const { criarCaso } = await import("@/modules/casos/application/criarCaso");
    const { obterCasoPorId } = await import("@/modules/casos/application/obterCasoPorId");
    const { listarCasos } = await import("@/modules/casos/application/listarCasos");
    const { simularCriacaoPedido } = await import("@/modules/peticoes/application/simularCriacaoPedido");
    const { obterPedidoDePeca } = await import("@/modules/peticoes/application/obterPedidoDePeca");
    const { listarPedidosDePeca } = await import("@/modules/peticoes/application/listarPedidosDePeca");

    const caso = await criarCaso({
      titulo: `Caso integração ${uniqueId("caso")}`,
      cliente: "Cliente Integração",
      materia: "Cível Empresarial",
      tribunal: "TJSP",
      prazoFinal: "2026-12-31",
      resumo: "Caso de integração com banco real.",
      partes: [
        { nome: "Autor Teste", papel: "autor" },
        { nome: "Réu Teste", papel: "réu" },
      ],
    });

    expect(caso.id).toMatch(/^CAS-\d{4}-\d{3}$/);
    expect(caso.partes).toHaveLength(2);

    const pedido = await simularCriacaoPedido({
      casoId: caso.id,
      titulo: "Pedido integração",
      tipoPeca: "Petição inicial",
      prioridade: "alta",
      prazoFinal: "2026-12-31",
    });

    expect(pedido.casoId).toBe(caso.id);
    expect(pedido.id).toMatch(/^PED-\d{4}$/);

    const casoPersistido = await obterCasoPorId(caso.id);
    expect(casoPersistido?.titulo).toContain("Caso integração");

    const pedidoPersistido = await obterPedidoDePeca(pedido.id);
    expect(pedidoPersistido?.titulo).toBe("Pedido integração");

    const casos = await listarCasos();
    const pedidos = await listarPedidosDePeca();
    expect(casos.some((item) => item.id === caso.id)).toBe(true);
    expect(pedidos.some((item) => item.id === pedido.id)).toBe(true);
  });

  it("integra documentos + sincronização de pipeline com snapshots reais", async () => {
    const { criarCaso } = await import("@/modules/casos/application/criarCaso");
    const { simularCriacaoPedido } = await import("@/modules/peticoes/application/simularCriacaoPedido");
    const { getDocumentosInfra } = await import("@/modules/documentos/infrastructure/provider.server");
    const { listarDocumentosComDetalhes } = await import("@/modules/documentos/application/listarDocumentos");
    const { sincronizarPipelinePedido } = await import(
      "@/modules/peticoes/application/operacional/sincronizarPipelinePedido"
    );

    const caso = await criarCaso({
      titulo: `Caso pipeline ${uniqueId("pipeline")}`,
      cliente: "Cliente Pipeline",
      materia: "Cível",
      prazoFinal: "2026-11-30",
      partes: [{ nome: "Parte A", papel: "autor" }],
    });

    const pedido = await simularCriacaoPedido({
      casoId: caso.id,
      titulo: "Pedido pipeline real",
      tipoPeca: "Petição inicial",
      prioridade: "média",
      prazoFinal: "2026-11-30",
    });

    const infra = getDocumentosInfra();
    const arquivo = await infra.arquivoFisicoRepository.criar({
      provider: "mock",
      providerKey: `mock/${uniqueId("file")}.txt`,
      url: "https://example.invalid/documento.txt",
      nomeOriginal: "documento.txt",
      mimeType: "text/plain",
      extensao: "txt",
      tamanhoBytes: 120,
      sha256: "sha256-integration",
      checksumAlgoritmo: "sha256",
    });

    const documento = await infra.documentoJuridicoRepository.criar({
      arquivoFisicoId: arquivo.id,
      titulo: "Documento de teste pipeline",
      tipoDocumento: "Petição",
      statusDocumento: "pendente de leitura",
      metadados: { origem: "integration-test" },
    });

    await infra.documentoJuridicoRepository.atualizarConteudoProcessado(documento.id, {
      textoExtraido: "01/01/2026 Fato principal. Contestação apresentada com divergência contratual.",
      textoNormalizado:
        "01/01/2026 Fato principal. Contestação apresentada com divergência contratual. Pedido liminar de urgência.",
      statusDocumento: "lido",
    });

    await infra.documentoVinculoRepository.vincular({
      documentoJuridicoId: documento.id,
      tipoEntidade: "caso",
      entidadeId: caso.id,
      papel: "principal",
    });
    await infra.documentoVinculoRepository.vincular({
      documentoJuridicoId: documento.id,
      tipoEntidade: "pedido_peca",
      entidadeId: pedido.id,
      papel: "principal",
    });

    const docsPorPedido = await listarDocumentosComDetalhes({ pedidoId: pedido.id });
    expect(docsPorPedido).toHaveLength(1);
    expect(docsPorPedido[0].documento.id).toBe(documento.id);

    const primeiraSync = await sincronizarPipelinePedido(pedido.id);
    const snapshotsPrimeira = primeiraSync.snapshots;

    expect(snapshotsPrimeira.length).toBeGreaterThanOrEqual(9);
    expect(snapshotsPrimeira.some((item) => item.etapa === "classificacao" && item.status === "concluido")).toBe(
      true,
    );
    expect(
      snapshotsPrimeira.some((item) => item.etapa === "analise_adversa" && item.status === "mock_controlado"),
    ).toBe(true);
    expect(primeiraSync.contextoAtual).not.toBeNull();

    const segundaSync = await sincronizarPipelinePedido(pedido.id);
    expect(segundaSync.snapshots.length).toBe(snapshotsPrimeira.length);
    expect(segundaSync.etapaAtual).toBe("aprovacao");
  });
});
