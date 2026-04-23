import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArchiveIcon } from "@/components/ui/icons";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";
import type { DocumentoListItem, StatusDocumento, StatusProcessamentoDocumental } from "@/modules/documentos/domain/types";
import { DocumentoUploadPanel } from "@/modules/documentos/ui/documento-upload-panel";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { getDataMode } from "@/lib/data-mode";
import { formatarDataHora } from "@/lib/utils";

const VARIANT_STATUS_DOC: Record<StatusDocumento, "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro"> = {
  "pendente de leitura": "neutro",
  "lido": "implantacao",
  "extraído": "sucesso",
};

const VARIANT_STATUS_PROC: Record<StatusProcessamentoDocumental, "ativo" | "implantacao" | "planejado" | "sucesso" | "alerta" | "neutro"> = {
  "nao_iniciado": "neutro",
  "enfileirado": "neutro",
  "em_processamento": "implantacao",
  "processado_parcial": "alerta",
  "processado": "sucesso",
  "erro": "alerta",
};

export default async function DocumentosPage() {
  const dataMode = getDataMode();
  const [documentos, casos, pedidos] = await Promise.all([
    listarDocumentos(),
    Promise.resolve(listarCasos()),
    Promise.resolve(listarPedidosDePeca()),
  ]);

  const opcoesCasos = casos.map((caso) => ({
    id: caso.id,
    label: `${caso.id} • ${caso.titulo}`,
  }));

  const opcoesPedidos = pedidos.map((pedido) => ({
    id: pedido.id,
    label: `${pedido.id} • ${pedido.titulo}`,
    casoId: pedido.casoId,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Upload, leitura e rastreio documental para suportar a produção das peças."
        actions={(
          <Link
            href="/documentos/drive"
            className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Google Drive
          </Link>
        )}
        meta={
          <>
            <StatusBadge label={`${documentos.length} documentos`} variant="neutro" />
            <StatusBadge label={dataMode === "real" ? "modo real" : "modo mock"} variant={dataMode === "real" ? "ativo" : "mock"} />
          </>
        }
      />
      <DocumentoUploadPanel
        casos={opcoesCasos}
        pedidos={opcoesPedidos}
        modoUpload={dataMode === "real" ? "cliente_blob" : "api"}
      />

      {documentos.length === 0 ? (
        <EmptyState
          title="Sem documentos"
          message="Faça upload de documentos para iniciar a triagem."
          icon={<ArchiveIcon size={24} />}
        />
      ) : (
        <DataTable<DocumentoListItem>
          rows={documentos}
          columns={[
            {
              key: "id",
              title: "Documento",
              render: (documento) => (
                <div>
                  <p className="font-semibold">{documento.id}</p>
                  <p className="text-xs text-[var(--color-muted)]">{documento.titulo}</p>
                </div>
              ),
            },
            {
              key: "caso",
              title: "Caso",
              render: (documento) => (
                documento.casoId ? (
                  <Link href={`/casos/${documento.casoId}`} className="font-semibold text-[var(--color-accent)]">
                    {documento.casoId}
                  </Link>
                ) : (
                  <span className="text-[var(--color-muted)]">Sem vínculo</span>
                )
              ),
            },
            {
              key: "tipo",
              title: "Tipo",
              render: (documento) => documento.tipo,
            },
            {
              key: "status",
              title: "Status",
              render: (documento) => (
                <div className="flex flex-wrap gap-1">
                  <StatusBadge label={documento.status} variant={VARIANT_STATUS_DOC[documento.status] ?? "neutro"} />
                  <StatusBadge label={documento.statusProcessamento} variant={VARIANT_STATUS_PROC[documento.statusProcessamento] ?? "neutro"} />
                </div>
              ),
            },
            {
              key: "upload",
              title: "Upload",
              render: (documento) => formatarDataHora(documento.dataUpload),
            },
            {
              key: "tamanho",
              title: "Tamanho",
              render: (documento) => `${documento.tamanhoMb.toFixed(1)} MB`,
            },
            {
              key: "hash",
              title: "Hash",
              render: (documento) => (
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {documento.sha256 ? documento.sha256.slice(0, 12) : "indisponível"}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
