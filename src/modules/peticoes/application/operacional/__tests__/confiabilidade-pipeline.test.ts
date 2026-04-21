import { describe, expect, it } from "vitest";
import {
  classificarFalhaPipeline,
  existeExecucaoEmAndamentoRecente,
} from "@/modules/peticoes/application/operacional/confiabilidade-pipeline";
import type { SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

describe("confiabilidade pipeline", () => {
  it("deve classificar timeout como falha transitória reprocessável", () => {
    const falha = classificarFalhaPipeline(new Error("Request timed out calling provider"));
    expect(falha.codigoErro).toBe("FALHA_TRANSITORIA_IA");
    expect(falha.statusHttp).toBe(503);
    expect(falha.reprocessavel).toBe(true);
  });

  it("deve classificar falta de contexto como erro operacional de dependência", () => {
    const falha = classificarFalhaPipeline(
      new Error("Contexto jurídico não disponível para gerar minuta. Execute os estágios anteriores primeiro."),
    );
    expect(falha.codigoErro).toBe("CONTEXTO_JURIDICO_INDISPONIVEL");
    expect(falha.statusHttp).toBe(422);
    expect(falha.reprocessavel).toBe(true);
  });

  it("deve detectar execução em andamento recente", () => {
    const snapshot: SnapshotPipelineEtapa = {
      id: "SNP-RECENTE",
      pedidoId: "PED-2026-001",
      etapa: "classificacao",
      versao: 3,
      entradaRef: {},
      saidaEstruturada: {},
      status: "em_andamento",
      executadoEm: new Date(Date.now() - 60_000).toISOString(),
      tentativa: 1,
    };
    expect(existeExecucaoEmAndamentoRecente(snapshot)).toBe(true);
  });
});
