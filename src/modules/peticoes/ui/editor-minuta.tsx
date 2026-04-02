"use client";

import { useMemo, useState } from "react";
import type { Minuta } from "@/modules/peticoes/domain/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type EditorMinutaProps = {
  minuta: Minuta;
};

export function EditorMinuta({ minuta }: EditorMinutaProps) {
  const [conteudo, setConteudo] = useState(minuta.conteudoAtual);
  const [versaoComparadaId, setVersaoComparadaId] = useState(minuta.versoes[minuta.versoes.length - 1]?.id ?? "");
  const [mensagemSalvar, setMensagemSalvar] = useState("");

  const versaoComparada = useMemo(
    () => minuta.versoes.find((versao) => versao.id === versaoComparadaId),
    [minuta.versoes, versaoComparadaId],
  );

  const comparacao = useMemo(() => {
    if (!versaoComparada) {
      return "Selecione uma versão para comparar.";
    }

    if (versaoComparada.conteudo === conteudo) {
      return "Sem diferenças relevantes entre a versão selecionada e o texto atual.";
    }

    return "Diferenças detectadas: o texto atual possui ajustes adicionais em relação à versão selecionada.";
  }, [conteudo, versaoComparada]);

  function salvarRascunho() {
    setMensagemSalvar(`Rascunho salvo localmente às ${new Date().toLocaleTimeString("pt-BR")}.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
      <Card title={minuta.titulo} subtitle="Editor de minuta com histórico mockado de versões.">
        <textarea
          value={conteudo}
          onChange={(event) => setConteudo(event.target.value)}
          className="min-h-[420px] w-full rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm leading-6 text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={salvarRascunho}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
          >
            Salvar rascunho
          </button>
          {mensagemSalvar ? <p className="text-xs text-[var(--color-muted)]">{mensagemSalvar}</p> : null}
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="Comparação entre versões" subtitle="Base inicial para evolução do diff jurídico.">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--color-ink)]">Versão de referência</span>
            <select
              className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2"
              value={versaoComparadaId}
              onChange={(event) => setVersaoComparadaId(event.target.value)}
            >
              {minuta.versoes.map((versao) => (
                <option key={versao.id} value={versao.id}>
                  Versão {versao.numero} - {formatarDataHora(versao.criadoEm)}
                </option>
              ))}
            </select>
          </label>

          <p className="text-sm text-[var(--color-muted)]">{comparacao}</p>
        </Card>

        <Card title="Histórico de versões" subtitle="Rastreabilidade de alterações do documento.">
          <div className="space-y-3">
            {minuta.versoes
              .slice()
              .reverse()
              .map((versao) => (
                <article key={versao.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--color-ink)]">Versão {versao.numero}</p>
                    <StatusBadge label="registrada" variant="sucesso" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {versao.autor} • {formatarDataHora(versao.criadoEm)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{versao.resumoMudancas}</p>
                </article>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
