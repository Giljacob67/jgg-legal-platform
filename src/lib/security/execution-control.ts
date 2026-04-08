import "server-only";

import { createHash } from "node:crypto";
import { getDataMode } from "@/lib/data-mode";
import { getSqlClient } from "@/lib/database/client";

type AcquireResult =
  | { ok: true; controlId: string }
  | { ok: false; reason: "running" | "duplicate"; message: string };

const runningLocks = new Set<string>();
const completedHashes = new Map<string, number>();

function buildRunningKey(pedidoId: string, estagio: string): string {
  return `${pedidoId}::${estagio}`;
}

function buildHashKey(pedidoId: string, estagio: string, inputHash: string): string {
  return `${pedidoId}::${estagio}::${inputHash}`;
}

export function hashEntrada(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function acquireExecutionControl(input: {
  pedidoId: string;
  estagio: string;
  userId: string;
  inputHash: string;
}): Promise<AcquireResult> {
  const { pedidoId, estagio, userId, inputHash } = input;

  if (getDataMode() !== "real") {
    const runningKey = buildRunningKey(pedidoId, estagio);
    const completedKey = buildHashKey(pedidoId, estagio, inputHash);

    if (runningLocks.has(runningKey)) {
      return { ok: false, reason: "running", message: "Já existe execução em andamento para este estágio." };
    }

    const completedAt = completedHashes.get(completedKey);
    if (completedAt && Date.now() - completedAt < 10 * 60 * 1000) {
      return { ok: false, reason: "duplicate", message: "Execução idêntica recente já concluída." };
    }

    runningLocks.add(runningKey);
    return { ok: true, controlId: runningKey };
  }

  try {
    const sql = getSqlClient();

    const [running] = await sql<{ id: string }[]>`
      SELECT id
      FROM pipeline_execution_control
      WHERE pedido_id = ${pedidoId}
        AND estagio = ${estagio}
        AND status = 'running'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (running) {
      return { ok: false, reason: "running", message: "Já existe execução em andamento para este estágio." };
    }

    const [duplicate] = await sql<{ id: string }[]>`
      SELECT id
      FROM pipeline_execution_control
      WHERE pedido_id = ${pedidoId}
        AND estagio = ${estagio}
        AND input_hash = ${inputHash}
        AND status = 'completed'
        AND created_at > NOW() - interval '10 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (duplicate) {
      return { ok: false, reason: "duplicate", message: "Execução idêntica recente já concluída." };
    }

    const [created] = await sql<{ id: string }[]>`
      INSERT INTO pipeline_execution_control (pedido_id, estagio, user_id, input_hash, status)
      VALUES (${pedidoId}, ${estagio}, ${userId}, ${inputHash}, 'running')
      RETURNING id
    `;

    return { ok: true, controlId: created.id };
  } catch (error) {
    console.warn("[execution-control] fallback em memória após falha de banco.", error);
    const runningKey = buildRunningKey(pedidoId, estagio);
    if (runningLocks.has(runningKey)) {
      return { ok: false, reason: "running", message: "Já existe execução em andamento para este estágio." };
    }
    runningLocks.add(runningKey);
    return { ok: true, controlId: runningKey };
  }
}

export async function finalizeExecutionControl(input: {
  controlId: string;
  pedidoId: string;
  estagio: string;
  inputHash: string;
  status: "completed" | "failed";
  schemaValid?: boolean;
  ragDegraded?: boolean;
  errorMessage?: string;
}): Promise<void> {
  const {
    controlId,
    pedidoId,
    estagio,
    inputHash,
    status,
    schemaValid,
    ragDegraded,
    errorMessage,
  } = input;

  if (getDataMode() !== "real") {
    const runningKey = buildRunningKey(pedidoId, estagio);
    runningLocks.delete(runningKey);
    if (status === "completed") {
      completedHashes.set(buildHashKey(pedidoId, estagio, inputHash), Date.now());
    }
    return;
  }

  try {
    const sql = getSqlClient();
    await sql`
      UPDATE pipeline_execution_control
      SET status = ${status},
          schema_valid = ${schemaValid ?? null},
          rag_degraded = ${ragDegraded ?? null},
          error_message = ${errorMessage ?? null},
          finished_at = NOW()
      WHERE id = ${controlId}::uuid
    `;
  } catch (error) {
    console.warn("[execution-control] não foi possível finalizar controle de execução.", error);
  }
}
