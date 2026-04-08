import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Session } from "next-auth";
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

  it("persiste trilha de auditoria em audit_log para ações sensíveis", async () => {
    const { writeAuditLog } = await import("@/lib/security/audit-log");

    const request = new Request("http://localhost/api/peticoes", {
      headers: {
        "x-forwarded-for": "203.0.113.15",
        "user-agent": "integration-test-agent/1.0",
      },
    });

    const session: Session = {
      user: {
        id: "usr-int-audit-001",
        email: "audit.integration@jgg.com.br",
        role: "advogado",
        name: "Audit Integration",
        initials: "AI",
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };

    await writeAuditLog({
      request,
      session,
      action: "read",
      resource: "peticoes.pipeline.estagio",
      resourceId: "PED-INT-AUD-001:triagem",
      result: "success",
      details: { stage: "triagem", scenario: "audit-log-success" },
    });

    await writeAuditLog({
      request,
      session,
      action: "approve",
      resource: "peticoes.pipeline.aprovacao",
      resourceId: "PED-INT-AUD-001",
      result: "denied",
      details: { scenario: "audit-log-denied" },
    });

    const sql = getSqlClient();
    const rows = await sql<{
      user_id: string;
      acao: string;
      recurso: string;
      recurso_id: string | null;
      resultado: string;
      ip: string | null;
      user_agent: string | null;
      detalhes: Record<string, unknown>;
    }[]>`
      SELECT user_id, acao, recurso, recurso_id, resultado, ip, user_agent, detalhes
      FROM audit_log
      WHERE user_id = ${session.user.id}
      ORDER BY criado_em ASC
    `;

    expect(rows).toHaveLength(2);
    expect(rows[0].acao).toBe("read");
    expect(rows[0].resultado).toBe("success");
    expect(rows[0].recurso).toBe("peticoes.pipeline.estagio");
    expect(rows[0].ip).toBe("203.0.113.15");
    expect(rows[0].user_agent).toContain("integration-test-agent");
    expect(rows[0].detalhes?.scenario).toBe("audit-log-success");

    expect(rows[1].acao).toBe("approve");
    expect(rows[1].resultado).toBe("denied");
    expect(rows[1].recurso).toBe("peticoes.pipeline.aprovacao");
    expect(rows[1].detalhes?.scenario).toBe("audit-log-denied");
  });

  it("aplica lock/idempotência de execução no pipeline_execution_control", async () => {
    const { acquireExecutionControl, finalizeExecutionControl, hashEntrada } = await import(
      "@/lib/security/execution-control"
    );

    const pedidoId = "PED-INT-EXEC-001";
    const estagio = "triagem";
    const hashA = hashEntrada({ pedidoId, estagio, payload: "A" });
    const hashB = hashEntrada({ pedidoId, estagio, payload: "B" });

    const started = await acquireExecutionControl({
      pedidoId,
      estagio,
      userId: "usr-int-lock-001",
      inputHash: hashA,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const runningDenied = await acquireExecutionControl({
      pedidoId,
      estagio,
      userId: "usr-int-lock-002",
      inputHash: hashB,
    });
    expect(runningDenied.ok).toBe(false);
    if (!runningDenied.ok) {
      expect(runningDenied.reason).toBe("running");
    }

    await finalizeExecutionControl({
      controlId: started.controlId,
      pedidoId,
      estagio,
      inputHash: hashA,
      status: "completed",
      schemaValid: true,
      ragDegraded: false,
    });

    const duplicateDenied = await acquireExecutionControl({
      pedidoId,
      estagio,
      userId: "usr-int-lock-003",
      inputHash: hashA,
    });
    expect(duplicateDenied.ok).toBe(false);
    if (!duplicateDenied.ok) {
      expect(duplicateDenied.reason).toBe("duplicate");
    }

    const second = await acquireExecutionControl({
      pedidoId,
      estagio,
      userId: "usr-int-lock-004",
      inputHash: hashB,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    await finalizeExecutionControl({
      controlId: second.controlId,
      pedidoId,
      estagio,
      inputHash: hashB,
      status: "failed",
      schemaValid: false,
      ragDegraded: true,
      errorMessage: "integration-failure",
    });

    const sql = getSqlClient();
    const rows = await sql<{
      status: string;
      input_hash: string;
      schema_valid: boolean | null;
      rag_degraded: boolean | null;
      error_message: string | null;
    }[]>`
      SELECT status, input_hash, schema_valid, rag_degraded, error_message
      FROM pipeline_execution_control
      WHERE pedido_id = ${pedidoId}
        AND estagio = ${estagio}
      ORDER BY created_at ASC
    `;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      status: "completed",
      input_hash: hashA,
      schema_valid: true,
      rag_degraded: false,
    });
    expect(rows[1]).toMatchObject({
      status: "failed",
      input_hash: hashB,
      schema_valid: false,
      rag_degraded: true,
      error_message: "integration-failure",
    });
  });

  it("persiste contagem de rate limit no banco e bloqueia excedente", async () => {
    const { checkRateLimit } = await import("@/lib/security/rate-limit");

    const bucketKey = `rl-${uniqueId("integration")}`;
    const limit = 2;
    const windowSeconds = 60;

    const first = await checkRateLimit({ key: bucketKey, limit, windowSeconds });
    const second = await checkRateLimit({ key: bucketKey, limit, windowSeconds });
    const third = await checkRateLimit({ key: bucketKey, limit, windowSeconds });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.count).toBe(3);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);

    const sql = getSqlClient();
    const [row] = await sql<{ count: number }[]>`
      SELECT MAX(count)::int AS count
      FROM api_rate_limit
      WHERE bucket_key = ${bucketKey}
    `;
    expect(row.count).toBe(3);
  });
});
