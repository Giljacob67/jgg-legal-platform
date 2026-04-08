import { describe, expect, it } from "vitest";
import type { SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";
import { serializar, toEtapaAtual } from "../snapshot-persistence";

function snapshot(input: Partial<SnapshotPipelineEtapa> & Pick<SnapshotPipelineEtapa, "etapa">): SnapshotPipelineEtapa {
  return {
    id: input.id ?? `SNP-${input.etapa}`,
    pedidoId: input.pedidoId ?? "PED-2026-001",
    etapa: input.etapa,
    versao: input.versao ?? 1,
    entradaRef: input.entradaRef ?? {},
    saidaEstruturada: input.saidaEstruturada ?? {},
    status: input.status ?? "concluido",
    executadoEm: input.executadoEm ?? new Date().toISOString(),
    codigoErro: input.codigoErro,
    mensagemErro: input.mensagemErro,
    tentativa: input.tentativa ?? 1,
  };
}

describe("snapshot-persistence", () => {
  it("serializa objetos de forma estável", () => {
    const a = { b: 1, a: [{ y: 2, x: 1 }] };
    const b = { a: [{ x: 1, y: 2 }], b: 1 };
    expect(serializar(a)).toBe(serializar(b));
  });

  it("identifica etapa atual considerando aprovação", () => {
    const snapshots = [
      snapshot({ etapa: "classificacao", status: "concluido" }),
      snapshot({ etapa: "leitura_documental", status: "concluido" }),
      snapshot({ etapa: "extracao_de_fatos", status: "concluido" }),
      snapshot({ etapa: "estrategia_juridica", status: "concluido" }),
      snapshot({ etapa: "redacao", status: "concluido" }),
      snapshot({ etapa: "revisao", status: "concluido" }),
    ];

    expect(toEtapaAtual(snapshots)).toBe("aprovacao");
  });

  it("retorna primeira etapa pendente quando pipeline incompleto", () => {
    const snapshots = [
      snapshot({ etapa: "classificacao", status: "concluido" }),
      snapshot({ etapa: "leitura_documental", status: "erro" }),
    ];

    expect(toEtapaAtual(snapshots)).toBe("leitura_documental");
  });
});
