import type { ChangeEvent } from "react";
import { SelectInput } from "@/components/ui/select-input";
import type { DocumentoSelecionadoNovoPedido, PendenciaNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";

type DocumentosProvasStepProps = {
  documentos: DocumentoSelecionadoNovoPedido[];
  pendencias: PendenciaNovoPedido[];
  tipoDocumentoUpload: string;
  onSelecionarArquivos: (arquivos: File[]) => void;
  onRemoverDocumento: (documentoId: string) => void;
  onAlterarTipoDocumentoUpload: (tipo: string) => void;
};

export function DocumentosProvasStep({
  documentos,
  pendencias,
  tipoDocumentoUpload,
  onSelecionarArquivos,
  onRemoverDocumento,
  onAlterarTipoDocumentoUpload,
}: DocumentosProvasStepProps) {
  const pendenciasDaEtapa = pendencias.filter((item) => item.etapaRelacionada === "documentos_provas");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onSelecionarArquivos(event.target.files ? Array.from(event.target.files) : []);
    event.target.value = "";
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
