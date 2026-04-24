"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UploadIcon, FileIcon, XIcon } from "@/components/ui/icons";

type AnexoChatUploaderProps = {
  pedidoId: string;
  casoId: string;
  onAnexar: (documento: { id: string; titulo: string; tipo: string; status: string }) => void;
  
};

export function AnexoChatUploader({
  pedidoId,
  casoId,
  onAnexar,
  
}: AnexoChatUploaderProps) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function selecionarArquivo(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setErro("Arquivo excede 20MB.");
      return;
    }
    setArquivo(file);
    setTitulo(file.name.replace(/\.[^/.]+$/, ""));
    setErro(null);
  }

  async function enviar() {
    if (!arquivo || !titulo.trim()) return;
    setCarregando(true);
    setErro(null);

    try {
      const formData = new FormData();
      formData.append("file", arquivo);
      formData.append("titulo", titulo.trim());
      formData.append("tipoDocumento", inferirTipoDocumento(arquivo.name));
      formData.append(
        "vinculos",
        JSON.stringify([
          { tipoEntidade: "caso", entidadeId: casoId, papel: "principal" },
          { tipoEntidade: "pedido_peca", entidadeId: pedidoId, papel: "apoio" },
        ]),
      );

      const res = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        documentoId?: string;
        error?: string;
        titulo?: string;
      };

      if (!res.ok) {
        setErro(json.error ?? "Falha no upload.");
        setCarregando(false);
        return;
      }

      onAnexar({
        id: json.documentoId ?? `doc-${Date.now()}`,
        titulo: titulo.trim(),
        tipo: inferirTipoDocumento(arquivo.name),
        status: "pendente de leitura",
      });

      setArquivo(null);
      setTitulo("");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de conexão.");
    } finally {
      setCarregando(false);
    }
  }

  function cancelar() {
    setArquivo(null);
    setTitulo("");
    setErro(null);
  }

  return (
    <div className="space-y-2">
      {!arquivo ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) selecionarArquivo(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <UploadIcon size={14} />
            Anexar documento
          </button>
          <span className="text-[10px] text-[var(--color-muted)]">PDF, DOCX, DOC, TXT — máx. 20MB</span>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <div className="flex items-center gap-2">
            <FileIcon size={16} className="text-[var(--color-accent)]" />
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-1 text-sm text-[var(--color-ink)] outline-none"
              placeholder="Título do documento"
            />
            <button
              type="button"
              onClick={cancelar}
              className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-border)]"
            >
              <XIcon size={14} />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-[var(--color-muted)]">
            {arquivo.name} • {(arquivo.size / 1024 / 1024).toFixed(2)} MB • {arquivo.type || "tipo desconhecido"}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={enviar}
              disabled={carregando || !titulo.trim()}
              className={cn(
                "rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white",
                carregando || !titulo.trim() ? "opacity-50" : "hover:bg-[var(--color-accent-strong)]",
              )}
            >
              {carregando ? "Enviando..." : "Enviar e vincular"}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={carregando}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro ? (
        <p className="text-xs text-rose-700">{erro}</p>
      ) : null}
    </div>
  );
}

function inferirTipoDocumento(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "Petição";
  if (["doc", "docx"].includes(ext)) return "Contrato";
  if (ext === "txt") return "Parecer";
  return "Comprovante";
}
