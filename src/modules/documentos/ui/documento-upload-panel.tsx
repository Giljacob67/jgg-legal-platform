"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { TipoDocumento } from "@/modules/documentos/domain/types";

type VinculoInput = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

type CasoOption = {
  id: string;
  label: string;
};

type PedidoOption = {
  id: string;
  label: string;
  casoId: string;
};

type DocumentoUploadPanelProps = {
  titulo?: string;
  descricao?: string;
  casos?: CasoOption[];
  pedidos?: PedidoOption[];
  fixedVinculos?: VinculoInput[];
  mostrarSeletores?: boolean;
};

const tiposDocumento: TipoDocumento[] = ["Contrato", "Petição", "Comprovante", "Procuração", "Parecer"];

function deduplicarVinculos(vinculos: VinculoInput[]): VinculoInput[] {
  const mapa = new Map<string, VinculoInput>();

  for (const vinculo of vinculos) {
    const chave = `${vinculo.tipoEntidade}:${vinculo.entidadeId}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, vinculo);
    }
  }

  return [...mapa.values()];
}

export function DocumentoUploadPanel({
  titulo = "Upload de documento",
  descricao = "Envie arquivos PDF, DOCX ou TXT e vincule ao caso/pedido correspondente.",
  casos = [],
  pedidos = [],
  fixedVinculos = [],
  mostrarSeletores = true,
}: DocumentoUploadPanelProps) {
  const router = useRouter();

  const [tituloDocumento, setTituloDocumento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("Contrato");
  const [casoSelecionado, setCasoSelecionado] = useState(casos[0]?.id ?? "");
  const [pedidoSelecionado, setPedidoSelecionado] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const pedidosFiltrados = useMemo(() => {
    if (!casoSelecionado) {
      return pedidos;
    }

    return pedidos.filter((pedido) => pedido.casoId === casoSelecionado);
  }, [pedidos, casoSelecionado]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!arquivo) {
      setErro("Selecione um arquivo para upload.");
      return;
    }

    if (!tituloDocumento.trim()) {
      setErro("Informe um título para o documento.");
      return;
    }

    const vinculosSelecionados: VinculoInput[] = [...fixedVinculos];

    if (mostrarSeletores && casoSelecionado) {
      vinculosSelecionados.push({ tipoEntidade: "caso", entidadeId: casoSelecionado, papel: "principal" });
    }

    if (mostrarSeletores && pedidoSelecionado) {
      vinculosSelecionados.push({ tipoEntidade: "pedido_peca", entidadeId: pedidoSelecionado, papel: "apoio" });
    }

    const vinculos = deduplicarVinculos(vinculosSelecionados);

    if (vinculos.length === 0) {
      setErro("Defina ao menos um vínculo de caso ou pedido.");
      return;
    }

    setErro(null);
    setMensagem(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("file", arquivo);
      formData.set("titulo", tituloDocumento);
      formData.set("tipoDocumento", tipoDocumento);
      formData.set("vinculos", JSON.stringify(vinculos));

      const response = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string; documentoId?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível enviar o documento.");
      }

      setMensagem(`Documento ${payload.documentoId ?? ""} enviado com sucesso.`);
      setTituloDocumento("");
      setPedidoSelecionado("");
      setArquivo(null);
      router.refresh();
    } catch (submitError) {
      setErro(submitError instanceof Error ? submitError.message : "Erro inesperado no upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title={titulo} subtitle={descricao}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--color-ink)]">Título jurídico</span>
            <input
              value={tituloDocumento}
              onChange={(event) => setTituloDocumento(event.target.value)}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2"
              placeholder="Ex.: Contrato social atualizado"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--color-ink)]">Tipo de documento</span>
            <select
              value={tipoDocumento}
              onChange={(event) => setTipoDocumento(event.target.value as TipoDocumento)}
              className="rounded-xl border border-[var(--color-border)] px-3 py-2"
            >
              {tiposDocumento.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mostrarSeletores ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--color-ink)]">Caso vinculado</span>
              <select
                value={casoSelecionado}
                onChange={(event) => {
                  setCasoSelecionado(event.target.value);
                  setPedidoSelecionado("");
                }}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <option value="">Selecione um caso</option>
                {casos.map((caso) => (
                  <option key={caso.id} value={caso.id}>
                    {caso.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--color-ink)]">Pedido de peça (opcional)</span>
              <select
                value={pedidoSelecionado}
                onChange={(event) => setPedidoSelecionado(event.target.value)}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <option value="">Sem vínculo com pedido</option>
                {pedidosFiltrados.map((pedido) => (
                  <option key={pedido.id} value={pedido.id}>
                    {pedido.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--color-ink)]">Arquivo</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
            className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar documento"}
        </button>

        {mensagem ? <p className="text-sm font-medium text-emerald-700">{mensagem}</p> : null}
        {erro ? <p className="text-sm font-medium text-rose-700">{erro}</p> : null}
      </form>
    </Card>
  );
}
