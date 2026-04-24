import { useState, type ChangeEvent } from "react";
import { SelectInput } from "@/components/ui/select-input";
import type { DocumentoSelecionadoNovoPedido, PendenciaNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";
import { TextInput } from "@/components/ui/text-input";
import type { DriveExplorerItem } from "@/modules/drive-explorer/domain/types";

type DocumentosProvasStepProps = {
  documentos: DocumentoSelecionadoNovoPedido[];
  pendencias: PendenciaNovoPedido[];
  tipoDocumentoUpload: string;
  onSelecionarArquivos: (arquivos: File[]) => void;
  onAdicionarArquivoDrive: (arquivo: DriveExplorerItem) => void;
  onRemoverDocumento: (documentoId: string) => void;
  onAlterarTipoDocumentoUpload: (tipo: string) => void;
};

export function DocumentosProvasStep({
  documentos,
  pendencias,
  tipoDocumentoUpload,
  onSelecionarArquivos,
  onAdicionarArquivoDrive,
  onRemoverDocumento,
  onAlterarTipoDocumentoUpload,
}: DocumentosProvasStepProps) {
  const pendenciasDaEtapa = pendencias.filter((item) => item.etapaRelacionada === "documentos_provas");
  const [buscaDrive, setBuscaDrive] = useState("");
  const [buscandoDrive, setBuscandoDrive] = useState(false);
  const [erroDrive, setErroDrive] = useState<string | null>(null);
  const [resultadosDrive, setResultadosDrive] = useState<DriveExplorerItem[]>([]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onSelecionarArquivos(event.target.files ? Array.from(event.target.files) : []);
    event.target.value = "";
  }

  async function buscarNoDrive() {
    const query = buscaDrive.trim();
    if (!query) {
      setResultadosDrive([]);
      return;
    }

    setBuscandoDrive(true);
    setErroDrive(null);
    try {
      const response = await fetch(`/api/documentos/drive/busca?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as { error?: string; itens?: DriveExplorerItem[] };
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao buscar arquivos no Google Drive.");
      }
      setResultadosDrive(payload.itens ?? []);
    } catch (error) {
      setErroDrive(error instanceof Error ? error.message : "Falha ao buscar arquivos no Google Drive.");
    } finally {
      setBuscandoDrive(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Adicionar documentos e provas</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Os anexos só serão vinculados ao pedido após a confirmação final. Até lá, ficam preparados para revisão humana.
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleChange}
            className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)]"
          />
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <SelectInput
            label="Classificação padrão dos anexos"
            value={tipoDocumentoUpload}
            options={[
              { value: "Petição", label: "Petição" },
              { value: "Contrato", label: "Contrato" },
              { value: "Comprovante", label: "Comprovante" },
              { value: "Procuração", label: "Procuração" },
              { value: "Parecer", label: "Parecer" },
            ]}
            helperText="A classificação orienta o vínculo que será gravado ao concluir o wizard."
            onChange={(event) => onAlterarTipoDocumentoUpload(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Importar do Google Drive</p>
          <p className="text-sm text-[var(--color-muted)]">
            Selecione arquivos específicos do Drive para instruir os agentes já no intake. Eles serão importados para o pedido após a criação final.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto]">
          <TextInput
            label="Buscar no Drive"
            value={buscaDrive}
            onChange={(event) => setBuscaDrive(event.target.value)}
            placeholder="Ex.: inicial, contrato, procuração, comprovante"
            helperText="A busca retorna arquivos importáveis por nome."
          />
          <button
            type="button"
            onClick={buscarNoDrive}
            disabled={buscandoDrive || !buscaDrive.trim()}
            className="mt-7 rounded-2xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buscandoDrive ? "Buscando..." : "Buscar no Drive"}
          </button>
        </div>

        {erroDrive ? (
          <p className="mt-3 text-sm text-rose-700">{erroDrive}</p>
        ) : null}

        {resultadosDrive.length > 0 ? (
          <div className="mt-4 space-y-3">
            {resultadosDrive.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.nome}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {item.mimeType}
                      {item.tamanhoLabel ? ` • ${item.tamanhoLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.webViewLink ? (
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
                      >
                        Abrir no Drive
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onAdicionarArquivoDrive(item)}
                      className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Preparar para o pedido
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Arquivos preparados</p>
        {documentos.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Nenhum arquivo selecionado até agora.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {documentos.map((documento) => (
              <div
                key={documento.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{documento.nome}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {(documento.tamanhoBytes / 1024).toFixed(0)} KB • {documento.mimeType || "tipo não identificado"}
                    {documento.origem === "google_drive" ? " • Google Drive" : " • Upload local"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoverDocumento(documento.id)}
                  className="rounded-xl border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <p className="text-sm font-semibold text-[var(--color-ink)]">O que ainda pode faltar</p>
        {pendenciasDaEtapa.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            {pendenciasDaEtapa.map((pendencia) => (
              <li key={pendencia.codigo}>• {pendencia.descricao}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Nenhuma pendência específica desta etapa foi detectada.
          </p>
        )}
      </div>
    </div>
  );
}
