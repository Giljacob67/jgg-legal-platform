import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { DocumentoSelecionadoNovoPedido, PendenciaNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";
import type { DriveExplorerItem, DriveExplorerResultado } from "@/modules/drive-explorer/domain/types";

type DocumentosProvasStepProps = {
  documentos: DocumentoSelecionadoNovoPedido[];
  pendencias: PendenciaNovoPedido[];
  onSelecionarArquivos: (arquivos: File[]) => void;
  onAdicionarArquivoDrive: (arquivo: DriveExplorerItem) => void;
  onRemoverDocumento: (documentoId: string) => void;
};

export function DocumentosProvasStep({
  documentos,
  pendencias,
  onSelecionarArquivos,
  onAdicionarArquivoDrive,
  onRemoverDocumento,
}: DocumentosProvasStepProps) {
  const pendenciasDaEtapa = pendencias.filter((item) => item.etapaRelacionada === "documentos_provas");
  const [carregandoDrive, setCarregandoDrive] = useState(false);
  const [erroDrive, setErroDrive] = useState<string | null>(null);
  const [explorer, setExplorer] = useState<DriveExplorerResultado | null>(null);
  const [selecionadosDrive, setSelecionadosDrive] = useState<Record<string, DriveExplorerItem>>({});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onSelecionarArquivos(event.target.files ? Array.from(event.target.files) : []);
    event.target.value = "";
  }

  async function carregarPastaDrive(folderId?: string) {
    setCarregandoDrive(true);
    setErroDrive(null);
    try {
      const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
      const response = await fetch(`/api/documentos/drive/explorer${query}`);
      const payload = (await response.json()) as DriveExplorerResultado & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao listar arquivos no Google Drive.");
      }
      setExplorer(payload);
    } catch (error) {
      setErroDrive(error instanceof Error ? error.message : "Falha ao listar arquivos no Google Drive.");
    } finally {
      setCarregandoDrive(false);
    }
  }

  useEffect(() => {
    void carregarPastaDrive();
  }, []);

  const arquivosDriveSelecionados = useMemo(
    () => Object.values(selecionadosDrive),
    [selecionadosDrive],
  );

  function alternarSelecao(item: DriveExplorerItem, checked: boolean) {
    setSelecionadosDrive((current) => {
      if (checked) {
        return { ...current, [item.id]: item };
      }
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  }

  function adicionarSelecionados() {
    arquivosDriveSelecionados.forEach((item) => onAdicionarArquivoDrive(item));
    setSelecionadosDrive({});
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
          <p className="text-sm font-semibold text-[var(--color-ink)]">Leitura documental posterior</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            A classificação do que foi anexado será inferida automaticamente na leitura documental. Aqui o foco é reunir o material certo do processo.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Importar do Google Drive</p>
          <p className="text-sm text-[var(--color-muted)]">
            Abra o Drive, navegue por pastas e selecione vários arquivos do processo. Eles serão importados para o pedido após a criação final.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            {(explorer?.breadcrumbs ?? []).map((crumb, index, list) => (
              <button
                key={crumb.id}
                type="button"
                onClick={() => void carregarPastaDrive(crumb.id === "root" ? undefined : crumb.id)}
                className="font-medium text-[var(--color-accent)]"
              >
                {crumb.nome}
                {index < list.length - 1 ? " /" : ""}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void carregarPastaDrive()}
              disabled={carregandoDrive}
              className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-60"
            >
              {carregandoDrive ? "Atualizando..." : "Atualizar pasta"}
            </button>
            <button
              type="button"
              onClick={adicionarSelecionados}
              disabled={arquivosDriveSelecionados.length === 0}
              className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Adicionar selecionados ({arquivosDriveSelecionados.length})
            </button>
          </div>
        </div>

        {erroDrive ? (
          <p className="mt-3 text-sm text-rose-700">{erroDrive}</p>
        ) : null}

        {explorer ? (
          <div className="mt-4 space-y-3">
            {explorer.itens.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum item encontrado nesta pasta.
              </p>
            ) : explorer.itens.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {item.tipo === "arquivo" && item.importavel ? (
                      <input
                        type="checkbox"
                        checked={Boolean(selecionadosDrive[item.id])}
                        onChange={(event) => alternarSelecao(item, event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
                      />
                    ) : (
                      <span className="mt-1 text-xs text-[var(--color-muted)]">{item.tipo === "pasta" ? "📁" : "—"}</span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{item.nome}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {item.mimeType}
                        {item.tamanhoLabel ? ` • ${item.tamanhoLabel}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tipo === "pasta" ? (
                      <button
                        type="button"
                        onClick={() => void carregarPastaDrive(item.id)}
                        className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
                      >
                        Abrir pasta
                      </button>
                    ) : null}
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
                    {item.tipo === "arquivo" && item.importavel ? null : item.tipo === "arquivo" ? (
                      <span className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)]">
                        Ainda não importável
                      </span>
                    ) : null}
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
