"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upload as uploadBlobClient } from "@vercel/blob/client";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
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
  modoUpload?: "api" | "cliente_blob";
};

const tiposDocumento: TipoDocumento[] = ["Contrato", "Petição", "Comprovante", "Procuração", "Parecer"];
const LIMITE_UPLOAD_BYTES = 4 * 1024 * 1024;

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
  modoUpload = "api",
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

    if (modoUpload === "api" && arquivo.size > LIMITE_UPLOAD_BYTES) {
      setErro("Arquivo excede o limite de 4 MB para upload nesta versão.");
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
      if (modoUpload === "cliente_blob") {
        const pathname = `jgg/${Date.now()}-${arquivo.name}`;
        const blob = await uploadBlobClient(pathname, arquivo, {
          access: "private",
          handleUploadUrl: "/api/documentos/client-upload",
          clientPayload: JSON.stringify({
            filename: arquivo.name,
            sizeBytes: arquivo.size,
            titulo: tituloDocumento.trim(),
            tipoDocumento,
            vinculos,
          }),
          multipart: arquivo.size > 5 * 1024 * 1024,
        });

        setMensagem(`Documento enviado com sucesso (${blob.pathname}).`);
      } else {
        const formData = new FormData();
        formData.set("file", arquivo);
        formData.set("titulo", tituloDocumento);
        formData.set("tipoDocumento", tipoDocumento);
        formData.set("vinculos", JSON.stringify(vinculos));

        const response = await fetch("/api/documentos/upload", {
          method: "POST",
          body: formData,
        });

        const responseText = await response.text();
        let payload: { error?: string; documentoId?: string } = {};

        if (responseText) {
          try {
            payload = JSON.parse(responseText) as { error?: string; documentoId?: string };
          } catch {
            payload = { error: responseText };
          }
        }

        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("Arquivo muito grande para o upload atual. Reduza o arquivo e tente novamente.");
          }

          throw new Error(payload.error ?? "Não foi possível enviar o documento.");
        }

        setMensagem(`Documento ${payload.documentoId ?? ""} enviado com sucesso.`);
      }

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
    <Card title={titulo} subtitle={descricao} eyebrow="Entrada documental">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Título jurídico"
            value={tituloDocumento}
            onChange={(event) => setTituloDocumento(event.target.value)}
            placeholder="Ex.: Contrato social atualizado"
            helperText="Use um título objetivo para facilitar busca, triagem e reaproveitamento."
            requiredMark
            required
          />

          <SelectInput
            label="Tipo de documento"
            value={tipoDocumento}
            onChange={(event) => setTipoDocumento(event.target.value as TipoDocumento)}
            options={tiposDocumento.map((tipo) => ({ value: tipo, label: tipo }))}
            helperText="Essa classificação orienta indexação, leitura e vínculo com o pedido."
          />
        </div>

        {mostrarSeletores ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Caso vinculado"
              value={casoSelecionado}
              onChange={(event) => {
                setCasoSelecionado(event.target.value);
                setPedidoSelecionado("");
              }}
              options={[
                { value: "", label: "Selecione um caso" },
                ...casos.map((caso) => ({ value: caso.id, label: caso.label })),
              ]}
              helperText="O caso principal garante contexto e rastreabilidade do documento."
            />

            <SelectInput
              label="Pedido de peça"
              value={pedidoSelecionado}
              onChange={(event) => setPedidoSelecionado(event.target.value)}
              options={[
                { value: "", label: "Sem vínculo com pedido" },
                ...pedidosFiltrados.map((pedido) => ({ value: pedido.id, label: pedido.label })),
              ]}
              helperText="Opcional. Use quando o documento já tiver destinação operacional clara."
            />
          </div>
        ) : null}

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-sm font-semibold text-[var(--color-ink)]">Arquivo</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-strong)] px-4 py-3 text-sm text-[var(--color-ink)]"
            required
          />
          <span className="text-xs leading-5 text-[var(--color-muted)]">
            {modoUpload === "api"
              ? "Limite atual de upload via API: 4 MB por arquivo."
              : "Upload direto para Blob privado (suporta arquivos maiores)."}
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar documento"}
        </button>

        {mensagem ? <InlineAlert title="Upload concluído" variant="success">{mensagem}</InlineAlert> : null}
        {erro ? <InlineAlert title="Falha no upload" variant="warning">{erro}</InlineAlert> : null}
      </form>
    </Card>
  );
}
