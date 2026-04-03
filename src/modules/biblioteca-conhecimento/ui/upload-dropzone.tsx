"use client";

import { useState, useRef } from "react";
import type { DocumentoBiblioteca, TipoDocumentoBC } from "../domain/types";
import { LABEL_TIPO_BC } from "../domain/types";

const TIPOS = Object.entries(LABEL_TIPO_BC) as [TipoDocumentoBC, string][];

type UploadDropzoneProps = {
  onUploadConcluido: (doc: DocumentoBiblioteca) => void;
};

export function UploadDropzone({ onUploadConcluido }: UploadDropzoneProps) {
  const [arrastando, setArrastando] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [tipo, setTipo] = useState<TipoDocumentoBC>("peticao");
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function aoSoltarArquivo(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (file) selecionarArquivo(file);
  }

  function selecionarArquivo(file: File) {
    const tiposPermitidos = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!tiposPermitidos.includes(file.type)) {
      setErro("Tipo não suportado. Use PDF, DOCX ou TXT.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErro("Arquivo excede 20 MB.");
      return;
    }
    setErro("");
    setArquivoSelecionado(file);
    if (!titulo) setTitulo(file.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload() {
    if (!arquivoSelecionado) return;
    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivoSelecionado);
      formData.append("tipo", tipo);
      formData.append("titulo", titulo);

      const res = await fetch("/api/biblioteca/upload", { method: "POST", body: formData });
      const data = await res.json() as { documento?: DocumentoBiblioteca; error?: string; chunksGerados?: number };

      if (!res.ok) throw new Error(data.error ?? "Erro no upload.");

      setSucesso(`✅ Processado! ${data.chunksGerados ?? 0} chunks gerados e prontos para RAG.`);
      setArquivoSelecionado(null);
      setTitulo("");
      if (data.documento) onUploadConcluido(data.documento);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltarArquivo}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition ${
          arrastando
            ? "border-[var(--color-accent)] bg-violet-50"
            : arquivoSelecionado
              ? "border-emerald-400 bg-emerald-50"
              : "border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && selecionarArquivo(e.target.files[0])}
        />
        <span className="text-3xl">{arquivoSelecionado ? "📄" : "☁️"}</span>
        {arquivoSelecionado ? (
          <div className="text-center">
            <p className="font-semibold text-sm text-emerald-800">{arquivoSelecionado.name}</p>
            <p className="text-xs text-emerald-600">{(arquivoSelecionado.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Arraste um arquivo ou clique para selecionar</p>
            <p className="text-xs text-[var(--color-muted)]">PDF, DOCX ou TXT — máximo 20 MB</p>
          </div>
        )}
      </div>

      {arquivoSelecionado && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">Tipo de documento</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {TIPOS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipo(key)}
                  className={`rounded-xl border px-3 py-2 text-sm text-left transition ${
                    tipo === key
                      ? "border-violet-500 bg-violet-50 text-violet-800 font-semibold"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--color-ink)]">Título (opcional)</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="Nome amigável para este documento"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
          >
            {loading ? "⏳ Processando..." : "⬆️ Enviar e processar para RAG"}
          </button>
        </div>
      )}

      {sucesso && <p className="text-sm text-emerald-700">{sucesso}</p>}
      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}
    </div>
  );
}
