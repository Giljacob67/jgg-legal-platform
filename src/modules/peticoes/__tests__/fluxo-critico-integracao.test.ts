import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockRequireAuth = vi.fn();
const mockRequireRBAC = vi.fn();
const mockAuth = vi.fn();
const mockObterPedidoDePeca = vi.fn();
const mockGetSqlClient = vi.fn();
const mockRetryStreamText = vi.fn();
const mockIsAIAvailable = vi.fn();

type SnapshotStatus = "concluido" | "em_andamento" | "erro" | "mock_controlado" | "pendente";
type SnapshotInput = {
  pedidoId: string;
  etapa: string;
  entradaRef: Record<string, unknown>;
  saidaEstruturada: Record<string, unknown>;
  status: SnapshotStatus;
  tentativa: number;
  mensagemErro?: string;
  codigoErro?: string;
};
type SnapshotSalvo = SnapshotInput & {
  id: string;
  versao: number;
  executadoEm: string;
};

const snapshotsSalvos: SnapshotSalvo[] = [];

const mockPipelineSnapshotRepository = {
  salvarNovaVersao: vi.fn(async (input: SnapshotInput) => {
    const versao =
      snapshotsSalvos.filter((snapshot) => snapshot.pedidoId === input.pedidoId && snapshot.etapa === input.etapa)
        .length + 1;
    const snapshot: SnapshotSalvo = {
      ...input,
      id: `SNP-TEST-${snapshotsSalvos.length + 1}`,
      versao,
      executadoEm: new Date().toISOString(),
    };
    snapshotsSalvos.push(snapshot);
    return snapshot;
  }),
  listarPorPedido: vi.fn(async (pedidoId: string) =>
    snapshotsSalvos.filter((snapshot) => snapshot.pedidoId === pedidoId),
  ),
  obterUltimoPorEtapa: vi.fn(async (pedidoId: string, etapa: string) =>
    [...snapshotsSalvos].reverse().find((snapshot) => snapshot.pedidoId === pedidoId && snapshot.etapa === etapa) ??
    null,
  ),
};

vi.mock("@/lib/api-auth", () => ({
  requireAuth: mockRequireAuth,
  requireRBAC: mockRequireRBAC,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/modules/peticoes/application/obterPedidoDePeca", () => ({
  obterPedidoDePeca: mockObterPedidoDePeca,
}));

vi.mock("@/lib/database/client", () => ({
  getSqlClient: mockGetSqlClient,
}));

vi.mock("@/lib/ai/retry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/retry")>("@/lib/ai/retry");
  return {
    ...actual,
    retryStreamText: mockRetryStreamText,
  };
});

vi.mock("@/lib/ai/provider", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/provider")>("@/lib/ai/provider");
  return {
    ...actual,
    isAIAvailable: mockIsAIAvailable,
    getLLM: vi.fn(() => ({ provider: "test", modelId: "fake-model" })),
  };
});

vi.mock("@/modules/peticoes/infrastructure/operacional/provider.server", () => ({
  getPeticoesOperacionalInfra: () => ({
    pipelineSnapshotRepository: mockPipelineSnapshotRepository,
    contextoJuridicoPedidoRepository: {
      listarVersoes: vi.fn(async () => []),
      obterUltimaVersao: vi.fn(async () => null),
      salvarNovaVersao: vi.fn(),
    },
    minutaRastroContextoRepository: {
      upsertVinculo: vi.fn(),
      listarPorMinuta: vi.fn(async () => []),
    },
  }),
}));

let postCriarPedido: (request: Request) => Promise<Response>;
let postExecutarPipeline: (
  req: NextRequest,
  ctx: { params: Promise<{ pedidoId: string; estagio: string }> },
) => Promise<Response>;
let postAprovacao: (
  req: NextRequest,
  ctx: { params: Promise<{ pedidoId: string }> },
) => Promise<Response>;
let patchMinuta: (
  req: NextRequest,
  ctx: { params: Promise<{ minutaId: string }> },
) => Promise<Response>;

function createTextStream(chunks: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  } as AsyncIterable<string>;
}

function createSqlClientScenario(input: {
  pedidoId: string;
  maxNumeroAtual: number;
  minutaExiste?: boolean;
}) {
  const writes = {
    updates: 0,
    inserts: 0,
  };

  const tx = (<T = unknown>(strings: TemplateStringsArray) => {
    const sql = strings.join(" ").replace(/\s+/g, " ").trim().toLowerCase();

    if (sql.includes("select id, pedido_id from minutas")) {
      if (input.minutaExiste === false) return Promise.resolve([] as T[]);
      return Promise.resolve([{ id: "MIN-TEST-001", pedido_id: input.pedidoId }] as unknown as T[]);
    }

    if (sql.includes("select max(numero)::int as max_numero")) {
      return Promise.resolve([{ max_numero: input.maxNumeroAtual }] as unknown as T[]);
    }

    if (sql.startsWith("update minutas")) {
      writes.updates += 1;
      return Promise.resolve([] as T[]);
    }

    if (sql.startsWith("insert into versoes_minuta")) {
      writes.inserts += 1;
      return Promise.resolve([] as T[]);
    }

    return Promise.resolve([] as T[]);
  }) as unknown as (<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T>);

  const sqlClient = {
    begin: async <T>(cb: (txLike: typeof tx) => Promise<T>) => cb(tx),
  };

  return { sqlClient, writes };
}

beforeAll(async () => {
  ({ POST: postCriarPedido } = await import("@/app/api/peticoes/route"));
  ({ POST: postExecutarPipeline } = await import(
    "@/app/api/peticoes/pipeline/[pedidoId]/executar/[estagio]/route"
  ));
  ({ POST: postAprovacao } = await import("@/app/api/peticoes/pipeline/[pedidoId]/aprovacao/route"));
  ({ PATCH: patchMinuta } = await import("@/app/api/peticoes/minutas/[minutaId]/route"));
});

beforeEach(() => {
  vi.clearAllMocks();
  snapshotsSalvos.length = 0;

  mockRequireAuth.mockResolvedValue(null);
  mockRequireRBAC.mockResolvedValue(null);
  mockAuth.mockResolvedValue({
    user: {
      id: "usr-adv-001",
      name: "Mariana Couto",
      email: "mariana@jgg.adv.br",
      role: "advogado",
    },
  });
  mockObterPedidoDePeca.mockImplementation(async (pedidoId: string) => ({
    id: pedidoId,
    casoId: "CAS-2026-001",
    titulo: "Pedido em teste integrado",
    tipoPeca: "Petição inicial",
    prioridade: "alta",
    status: "em produção",
    etapaAtual: "classificacao",
    responsavel: "Mariana Couto",
    prazoFinal: "2026-12-01",
    criadoEm: new Date().toISOString(),
  }));
  mockIsAIAvailable.mockReturnValue(true);
  mockRetryStreamText.mockResolvedValue({
    textStream: createTextStream(["Trecho 1 ", "Trecho 2"]),
    textPromise: Promise.resolve("Trecho 1 Trecho 2"),
    attempts: 1,
  });
});

describe("Fluxo crítico de Petições (integração de rotas)", () => {
  it("deve executar novo pedido -> pipeline -> aprovação -> editor", async () => {
    const createResponse = await postCriarPedido(
      new Request("http://localhost/api/peticoes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          casoId: "CAS-2026-001",
          titulo: `Pedido integrado ${Date.now()}`,
          tipoPeca: "Petição inicial",
          prioridade: "alta",
          prazoFinal: "2026-12-01",
        }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const createJson = (await createResponse.json()) as { pedido: { id: string; titulo: string } };
    expect(createJson.pedido.id).toBeTruthy();

    const pedidoId = createJson.pedido.id;

    const pipelineResponse = await postExecutarPipeline(
      new Request("http://localhost/api/peticoes/pipeline", {
        method: "POST",
        headers: { "x-request-id": "req-pipeline-001" },
      }) as unknown as NextRequest,
      { params: Promise.resolve({ pedidoId, estagio: "triagem" }) },
    );

    expect(pipelineResponse.status).toBe(200);
    expect(pipelineResponse.headers.get("x-request-id")).toBe("req-pipeline-001");
    expect(mockPipelineSnapshotRepository.salvarNovaVersao).toHaveBeenCalled();
    const snapshotExecucao = snapshotsSalvos.find((item) => item.etapa === "classificacao" && item.status === "em_andamento");
    expect(snapshotExecucao?.entradaRef).toMatchObject({
      requestId: "req-pipeline-001",
      usuarioId: "usr-adv-001",
      perfilUsuario: "advogado",
    });

    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr-soc-001",
        name: "Gilberto Jacob",
        email: "gilberto@jgg.adv.br",
        role: "socio_direcao",
      },
    });

    const aprovacaoResponse = await postAprovacao(
      new Request("http://localhost/api/peticoes/pipeline/aprovacao", {
        method: "POST",
        headers: { "content-type": "application/json", "x-request-id": "req-aprov-001" },
        body: JSON.stringify({ resultado: "aprovado", observacoes: "Fluxo aprovado no teste." }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ pedidoId }) },
    );

    expect(aprovacaoResponse.status).toBe(200);
    const aprovacaoJson = (await aprovacaoResponse.json()) as {
      resultado: string;
      requestId: string;
      snapshot: { entradaRef: Record<string, unknown> };
    };
    expect(aprovacaoJson.resultado).toBe("aprovado");
    expect(aprovacaoJson.requestId).toBe("req-aprov-001");
    expect(aprovacaoJson.snapshot.entradaRef).toMatchObject({
      requestId: "req-aprov-001",
      usuarioId: "usr-soc-001",
      perfilUsuario: "socio_direcao",
    });

    const { sqlClient, writes } = createSqlClientScenario({
      pedidoId,
      maxNumeroAtual: 0,
    });
    mockGetSqlClient.mockReturnValue(sqlClient);

    const minutaResponse = await patchMinuta(
      new Request("http://localhost/api/peticoes/minutas/MIN-TEST-001", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-request-id": "req-minuta-001" },
        body: JSON.stringify({
          conteudo: "Texto revisado da minuta.",
          resumo: "Ajustes finais no pedido.",
          ultimaVersaoConhecida: 0,
        }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ minutaId: "MIN-TEST-001" }) },
    );

    expect(minutaResponse.status).toBe(200);
    const minutaJson = (await minutaResponse.json()) as { ok: boolean; numero: number; requestId: string };
    expect(minutaJson.ok).toBe(true);
    expect(minutaJson.numero).toBe(1);
    expect(minutaJson.requestId).toBe("req-minuta-001");
    expect(writes.updates).toBe(1);
    expect(writes.inserts).toBe(1);
  });

  it("deve retornar 409 no editor quando houver conflito de concorrência", async () => {
    const { sqlClient } = createSqlClientScenario({
      pedidoId: "PED-2026-001",
      maxNumeroAtual: 3,
    });
    mockGetSqlClient.mockReturnValue(sqlClient);

    const response = await patchMinuta(
      new Request("http://localhost/api/peticoes/minutas/MIN-TEST-001", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-request-id": "req-minuta-409" },
        body: JSON.stringify({
          conteudo: "Novo conteúdo da minuta.",
          ultimaVersaoConhecida: 2,
        }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ minutaId: "MIN-TEST-001" }) },
    );

    expect(response.status).toBe(409);
    const json = (await response.json()) as { error: string; details: { ultimaVersaoAtual: number } };
    expect(json.error).toContain("Conflito de concorrência");
    expect(json.details.ultimaVersaoAtual).toBe(3);
  });

  it("deve bloquear execução de estágio para perfil sem alçada operacional", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr-adm-001",
        name: "Admin Sistema",
        email: "admin@jgg.adv.br",
        role: "administrador_sistema",
      },
    });

    const response = await postExecutarPipeline(
      new Request("http://localhost/api/peticoes/pipeline", {
        method: "POST",
        headers: { "x-request-id": "req-pipeline-sem-alcada" },
      }) as unknown as NextRequest,
      { params: Promise.resolve({ pedidoId: "PED-2026-001", estagio: "triagem" }) },
    );

    expect(response.status).toBe(403);
    const json = (await response.json()) as { error: string };
    expect(json.error).toContain("alçada");
    expect(mockPipelineSnapshotRepository.salvarNovaVersao).not.toHaveBeenCalled();
  });

  it("deve permitir aprovação para administrador do sistema", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "usr-adm-001",
        name: "Admin Sistema",
        email: "admin@jgg.adv.br",
        role: "administrador_sistema",
      },
    });

    const response = await postAprovacao(
      new Request("http://localhost/api/peticoes/pipeline/aprovacao", {
        method: "POST",
        headers: { "content-type": "application/json", "x-request-id": "req-aprov-admin-001" },
        body: JSON.stringify({ resultado: "aprovado", observacoes: "Aprovação por perfil administrador." }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ pedidoId: "PED-2026-001" }) },
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      resultado: string;
      snapshot: {
        entradaRef: Record<string, unknown>;
        saidaEstruturada: { perfil_aprovador: string };
      };
    };
    expect(json.resultado).toBe("aprovado");
    expect(json.snapshot.saidaEstruturada.perfil_aprovador).toBe("administrador_sistema");
    expect(json.snapshot.entradaRef).toMatchObject({
      requestId: "req-aprov-admin-001",
      usuarioId: "usr-adm-001",
      perfilUsuario: "administrador_sistema",
    });
  });
});
