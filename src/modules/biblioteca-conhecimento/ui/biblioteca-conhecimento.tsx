"use client";

import { useState } from "react";
import type { DocumentoBiblioteca } from "@/modules/biblioteca-juridica/domain/types";
import type { ResultadoSyncDrive } from "@/modules/biblioteca-juridica/domain/types";
import { UploadDropzone } from "@/modules/biblioteca-juridica/ui/upload-dropzone";
import { SyncDrivePanel } from "@/modules/biblioteca-juridica/ui/sync-drive-panel";
import { ListaDocumentosBiblioteca } from "@/modules/biblioteca-juridica/ui/lista-documentos-biblioteca";
import { Card } from "@/components/ui/card";

type BibliotecaConhecimentoProps = {
  documentosIniciais: DocumentoBiblioteca[];
  statsIniciais: { total: number; concluidos: number; pendentes: number; erros: number; chunks: number };
  driveConfigurado: boolean;
  driveFolderId: string | null;
  ultimaSync: ResultadoSyncDrive | null;
};

export function BibliotecaConhecimento({
  documentosIniciais,
  statsIniciais,
  driveConfigurado,
  driveFolderId,
  ultimaSync,
}: BibliotecaConhecimentoProps) {
  const [documentos, setDocumentos] = useState<DocumentoBiblioteca[]>(documentosIniciais);
  const [stats, setStats] = useState(statsIniciais);

  async function recarregarDados() {
    const res = await fetch("/api/biblioteca");
    if (res.ok) {
      const data = await res.json() as { documentos: DocumentoBiblioteca[]; stats: typeof stats };
      setDocumentos(data.documentos);
      setStats(data.stats);
    }
  }

  async function removerDocumento(id: string) {
    if (!confirm("Remover este documento da biblioteca?")) return;
    await fetch(`/api/biblioteca?id=${id}`, { method: "DELETE" });
    await recarregarDados();
  }

  function aoNovoUpload(doc: DocumentoBiblioteca) {
    setDocumentos((prev) => [doc, ...prev]);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      concluidos: doc.embeddingStatus === "concluido" ? prev.concluidos + 1 : prev.concluidos,
      chunks: prev.chunks + doc.chunksGerados,
    }));
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Documentos", valor: stats.total, emoji: "📚" },
          { label: "Indexados", valor: stats.concluidos, emoji: "✅" },
          { label: "Chunks RAG", valor: stats.chunks, emoji: "🧩" },
          { label: "Erros", valor: stats.erros, emoji: "❌" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
            <p className="text-xl font-bold text-[var(--color-ink)]">{s.emoji} {s.valor}</p>
            <p className="text-xs text-[var(--color-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          {/* Upload Manual */}
          <Card title="⬆️ Upload manual" subtitle="Petições, contratos, teses e modelos do escritório — PDF, DOCX ou TXT.">
            <UploadDropzone onUploadConcluido={aoNovoUpload} />
          </Card>

          {/* Lista de documentos */}
          <Card title={`📚 Documentos na biblioteca (${stats.total})`} subtitle="Todos sincronizados e prontos para uso nos agentes de IA.">
            <ListaDocumentosBiblioteca documentos={documentos} onRemover={removerDocumento} />
          </Card>
        </div>

        {/* Sidebar — Drive Sync */}
        <div className="space-y-6">
          <Card title="🔗 Google Drive" subtitle="Sincronização automática com suas pastas do escritório.">
            <SyncDrivePanel
              configurado={driveConfigurado}
              folderId={driveFolderId}
              ultimaSync={ultimaSync}
              onSyncConcluido={recarregarDados}
            />
          </Card>

          {/* Mapa de pastas */}
          <Card title="📂 Mapeamento de pastas" subtitle="Como o Drive é classificado automaticamente.">
            <div className="space-y-2 text-xs">
              {[
                { pasta: "01_Jurídico/Clientes Ativos", tipo: "⚖️ Petição" },
                { pasta: "07_Contratos", tipo: "📄 Contrato" },
                { pasta: "05_Biblioteca e Pesquisa", tipo: "💡 Tese Jurídica" },
                { pasta: "06_Modelos", tipo: "📋 Modelo" },
                { pasta: "RAG - Agrário / Teses", tipo: "💡 Tese Jurídica" },
                { pasta: "Dossiês / DOSSIES", tipo: "📁 Dossiê" },
              ].map((m) => (
                <div key={m.pasta} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2">
                  <span className="text-[var(--color-muted)] font-mono truncate">{m.pasta}</span>
                  <span className="whitespace-nowrap font-semibold text-[var(--color-ink)]">{m.tipo}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
