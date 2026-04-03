import type { DocumentoBiblioteca } from "../domain/types";
import { LABEL_TIPO_BC, EMOJI_TIPO_BC } from "../domain/types";

type ListaDocumentosProps = {
  documentos: DocumentoBiblioteca[];
  onRemover?: (id: string) => void;
};

const STATUS_BADGE: Record<string, string> = {
  concluido: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  processando: "bg-blue-100 text-blue-800 border-blue-200",
  erro: "bg-rose-100 text-rose-800 border-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  concluido: "✅ Indexado",
  pendente: "⏳ Pendente",
  processando: "⚙️ Processando",
  erro: "❌ Erro",
};

function formatarBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ListaDocumentosBiblioteca({ documentos, onRemover }: ListaDocumentosProps) {
  if (documentos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-muted)]">
        Nenhum documento na biblioteca ainda. Faça upload ou sincronize com o Google Drive.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)]">Documento</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)]">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)]">Fonte</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)]">Status / Chunks</th>
            {onRemover && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc, i) => (
            <tr
              key={doc.id}
              className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-surface-alt)]/40"}`}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--color-ink)] truncate max-w-xs">{doc.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-[var(--color-muted)]">{doc.mimeType?.split("/").pop()?.toUpperCase()}</span>
                  {doc.tamanhoBytes && <span className="text-xs text-[var(--color-muted)]">{formatarBytes(doc.tamanhoBytes)}</span>}
                  {doc.driveFolderPath && (
                    <span className="text-xs text-[var(--color-muted)] truncate max-w-[150px]" title={doc.driveFolderPath}>
                      📂 {doc.driveFolderPath.split("/").slice(-2).join("/")}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm">{EMOJI_TIPO_BC[doc.tipo]}</span>{" "}
                <span className="text-xs text-[var(--color-muted)]">{LABEL_TIPO_BC[doc.tipo]}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${doc.fonte === "google_drive" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {doc.fonte === "google_drive" ? "🔗 Drive" : "⬆️ Upload"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[doc.embeddingStatus] ?? ""}`}>
                  {STATUS_LABEL[doc.embeddingStatus]}
                </span>
                {doc.chunksGerados > 0 && (
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{doc.chunksGerados} chunks</p>
                )}
                {doc.erroProcessamento && (
                  <p className="text-xs text-rose-600 mt-0.5 truncate max-w-[150px]" title={doc.erroProcessamento}>
                    {doc.erroProcessamento}
                  </p>
                )}
              </td>
              {onRemover && (
                <td className="px-4 py-3">
                  <button
                    onClick={() => onRemover(doc.id)}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Remover
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
