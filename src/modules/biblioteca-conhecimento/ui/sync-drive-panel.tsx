"use client";

import { useState } from "react";
import type { ResultadoSyncDrive } from "../domain/types";

type SyncDrivePanelProps = {
  configurado: boolean;
  folderId?: string | null;
  ultimaSync?: ResultadoSyncDrive | null;
  onSyncConcluido?: () => void;
};

export function SyncDrivePanel({ configurado, folderId, ultimaSync: syncInicial, onSyncConcluido }: SyncDrivePanelProps) {
  const [sync, setSync] = useState<ResultadoSyncDrive | null>(syncInicial ?? null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function executarSync() {
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/sync/google-drive", { method: "POST" });
      const data = await res.json() as ResultadoSyncDrive & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro na sincronização.");
      setSync(data);
      onSyncConcluido?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!configurado) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-800">⚙️ Google Drive não configurado</p>
        <p className="mt-1 text-amber-700 text-xs">
          Para ativar a sincronização automática, adicione as variáveis no Vercel:
        </p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-amber-800">
          <li>• <strong>GOOGLE_SERVICE_ACCOUNT_KEY</strong> — JSON da service account</li>
          <li>• <strong>GOOGLE_DRIVE_FOLDER_ID</strong> — ID da pasta raiz</li>
        </ul>
        <a
          href="https://console.cloud.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-semibold text-amber-700 underline"
        >
          Abrir Google Cloud Console →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <p className="font-semibold text-emerald-800">✅ Google Drive conectado</p>
        {folderId && (
          <p className="text-xs text-emerald-700 mt-0.5 font-mono">Pasta: {folderId}</p>
        )}
      </div>

      <button
        onClick={executarSync}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
      >
        {loading ? (
          <><span className="animate-spin">⟳</span> Sincronizando Drive...</>
        ) : (
          <>⟳ Sincronizar Google Drive agora</>
        )}
      </button>

      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}

      {sync && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-muted)]">
            Última sync: {new Date(sync.executadoEm).toLocaleString("pt-BR")}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-800">{sync.novos}</p>
              <p className="text-xs text-emerald-600">Novos</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-600">{sync.pulados}</p>
              <p className="text-xs text-gray-500">Pulados</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
              <p className="text-xl font-bold text-rose-800">{sync.erros}</p>
              <p className="text-xs text-rose-600">Erros</p>
            </div>
          </div>

          {sync.detalhes.filter((d) => d.status !== "pulado").length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                Ver detalhes ({sync.detalhes.length} arquivos processados)
              </summary>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2">
                {sync.detalhes.filter((d) => d.status !== "pulado").map((d, i) => (
                  <div key={i} className={`flex items-start gap-2 ${d.status === "erro" ? "text-rose-700" : "text-emerald-700"}`}>
                    <span>{d.status === "erro" ? "❌" : "✅"}</span>
                    <div>
                      <p>{d.arquivo}</p>
                      {d.erro && <p className="text-rose-500">{d.erro}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
