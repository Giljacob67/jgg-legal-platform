import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listarDocumentos } from "@/modules/documentos/application/listarDocumentos";
import type { Documento } from "@/modules/documentos/domain/types";
import { formatarDataHora } from "@/lib/utils";

export default function DocumentosPage() {
  const documentos = listarDocumentos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Upload, leitura e rastreio documental para suportar a produção das peças."
      />

      {documentos.length === 0 ? (
        <EmptyState title="Sem documentos" message="Faça upload de documentos para iniciar a triagem." />
      ) : (
        <DataTable<Documento>
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
                <Link href={`/casos/${documento.casoId}`} className="font-semibold text-[var(--color-accent)]">
                  {documento.casoId}
                </Link>
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
              render: (documento) => <StatusBadge label={documento.status} variant="implantacao" />,
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
          ]}
        />
      )}
    </div>
  );
}
