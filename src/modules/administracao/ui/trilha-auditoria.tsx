"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

type AuditAction = "read" | "create" | "update" | "delete" | "download" | "upload" | "execute" | "approve";
type AuditResult = "success" | "error" | "denied";

type AuditLogEntry = {
  id: string;
  userId: string;
  userEmail: string | null;
  userRole: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  result: AuditResult;
  details: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
};

const ACTION_OPTIONS: Array<{ value: AuditAction; label: string }> = [
  { value: "read", label: "Leitura" },
  { value: "create", label: "Criação" },
  { value: "update", label: "Atualização" },
  { value: "delete", label: "Remoção" },
  { value: "download", label: "Download" },
  { value: "upload", label: "Upload" },
  { value: "execute", label: "Execução" },
  { value: "approve", label: "Aprovação" },
];

const RESULT_OPTIONS: Array<{ value: AuditResult; label: string }> = [
  { value: "success", label: "Sucesso" },
  { value: "error", label: "Erro" },
  { value: "denied", label: "Negado" },
];

function toStatusVariant(result: AuditResult): "sucesso" | "alerta" | "neutro" {
  if (result === "success") return "sucesso";
  if (result === "error") return "alerta";
  return "neutro";
}

function labelAction(action: AuditAction): string {
  return ACTION_OPTIONS.find((item) => item.value === action)?.label ?? action;
}

function labelResult(result: AuditResult): string {
  return RESULT_OPTIONS.find((item) => item.value === result)?.label ?? result;
}

export function TrilhaAuditoria() {
  const [userId, setUserId] = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [limit, setLimit] = useState("50");

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<AuditResponse>({ logs: [], total: 0, limit: 50 });

  async function carregar() {
    setLoading(true);
    setErro("");

    try {
      const params = new URLSearchParams();
      params.set("limit", limit || "50");
      if (userId.trim()) params.set("userId", userId.trim());
      if (resource.trim()) params.set("resource", resource.trim());
      if (action) params.set("action", action);
      if (result) params.set("result", result);

      const res = await fetch(`/api/administracao/auditoria?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Falha ao carregar trilha de auditoria.");
      }

      const body = (await res.json()) as AuditResponse;
      setDados(body);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }

  function limparFiltros() {
    setUserId("");
    setResource("");
    setAction("");
    setResult("");
    setLimit("50");
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumo = useMemo(() => {
    const total = dados.logs.length;
    const sucesso = dados.logs.filter((item) => item.result === "success").length;
    const erroCount = dados.logs.filter((item) => item.result === "error").length;
    const negado = dados.logs.filter((item) => item.result === "denied").length;
    return { total, sucesso, erroCount, negado };
  }, [dados.logs]);

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          void carregar();
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">User ID</span>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
            placeholder="usr-123 ou UUID"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Recurso</span>
          <input
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
            placeholder="peticoes.pipeline.estagio"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Ação</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {ACTION_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Resultado</span>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {RESULT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Limite</span>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Carregando..." : "Aplicar"}
          </button>
          <button
            type="button"
            onClick={() => {
              limparFiltros();
              setTimeout(() => void carregar(), 0);
            }}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          >
            Limpar
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Eventos</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{resumo.total}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Sucesso</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{resumo.sucesso}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Erro</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{resumo.erroCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Negado</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{resumo.negado}</p>
        </div>
      </div>

      {erro ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-[var(--color-surface-alt)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">Data/Hora</th>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">Ação</th>
              <th className="px-3 py-2 text-left">Recurso</th>
              <th className="px-3 py-2 text-left">Resultado</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <th className="px-3 py-2 text-left">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {dados.logs.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-[var(--color-muted)]" colSpan={7}>
                  {loading ? "Carregando eventos..." : "Nenhum evento encontrado para os filtros aplicados."}
                </td>
              </tr>
            ) : (
              dados.logs.map((item) => (
                <tr key={item.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    {new Date(item.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    <p className="font-medium">{item.userEmail ?? item.userId}</p>
                    <p className="text-xs text-[var(--color-muted)]">{item.userRole ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">{labelAction(item.action)}</td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    <p className="font-mono text-xs">{item.resource}</p>
                    {item.resourceId ? <p className="text-xs text-[var(--color-muted)]">{item.resourceId}</p> : null}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    <StatusBadge label={labelResult(item.result)} variant={toStatusVariant(item.result)} />
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    <p className="font-mono text-xs">{item.ip ?? "-"}</p>
                    <p className="line-clamp-1 max-w-[260px] text-xs text-[var(--color-muted)]">{item.userAgent ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-ink)]">
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-[var(--color-accent)]">ver JSON</summary>
                      <pre className="mt-1 max-w-[320px] overflow-x-auto rounded-md bg-[var(--color-surface-alt)] p-2 text-xs">
                        {JSON.stringify(item.details ?? {}, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
