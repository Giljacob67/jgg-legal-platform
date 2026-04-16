"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PrioridadePedido, TipoPeca, IntencaoProcessual } from "@/modules/peticoes/domain/types";
import type { Caso } from "@/modules/casos/domain/types";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import {
  INTENCOES_POR_DOCUMENTO,
  LABEL_INTENCAO,
  GRUPO_TIPO_PECA,
  SKILL_VINCULADA_POR_TIPO,
  LABEL_SKILL,
} from "@/modules/peticoes/domain/types";
// simularCriacaoPedido moved to server-side API route /api/peticoes
import { Card } from "@/components/ui/card";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatarDataHora } from "@/lib/utils";

type NovoPedidoFormProps = {
  tiposPeca: TipoPeca[];
  casos: Caso[];
};

export function NovoPedidoForm({ tiposPeca, casos }: NovoPedidoFormProps) {
  const primeiroCaso = casos[0];
  const [casoId, setCasoId] = useState(primeiroCaso?.id ?? "");
  const casoSelecionado = casos.find((c) => c.id === casoId) ?? null;
  const [polo, setPolo] = useState<"ativo" | "passivo" | "indefinido">(
    casoSelecionado ? detectarPoloRepresentado(casoSelecionado) : "indefinido"
  );
  const [titulo, setTitulo] = useState("");
  const [tipoPeca, setTipoPeca] = useState<TipoPeca>(tiposPeca[0]);
  const [prioridade, setPrioridade] = useState<PrioridadePedido>("média");
  const [prazoFinal, setPrazoFinal] = useState("");
  const [contexto, setContexto] = useState("");
  const [intencaoProcessual, setIntencaoProcessual] = useState<IntencaoProcessual | "">("");
  const [intencaoCustom, setIntencaoCustom] = useState(""); // campo livre quando intencao = 'outro'
  const [usarAgentTriagem, setUsarAgentTriagem] = useState(true);
  const [arquivos, setArquivos] = useState<File[]>([]);

  const [pedidoGerado, setPedidoGerado] = useState<import("@/modules/peticoes/domain/types").PedidoDePeca | null>(null);
  const [resultadoTriagem, setResultadoTriagem] = useState<Record<string, unknown> | null>(null);
  const [loadingTriagem, setLoadingTriagem] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [erro, setErro] = useState("");

  // Build grouped options for the tipo de peça select
  const gruposTipos = useMemo(() => {
    const mapa: Record<string, TipoPeca[]> = {};
    for (const tipo of tiposPeca) {
      const grupo = GRUPO_TIPO_PECA[tipo] ?? "Outros";
      if (!mapa[grupo]) mapa[grupo] = [];
      mapa[grupo].push(tipo);
    }
    return Object.entries(mapa).map(([label, tipos]) => ({
      label,
      options: tipos.map((tipo) => ({ value: tipo, label: tipo })),
    }));
  }, [tiposPeca]);

  // Skills vinculadas ao tipo selecionado
  const skillsVinculadas = SKILL_VINCULADA_POR_TIPO[tipoPeca] ?? null;

  // Sugere intenções relevantes com base no tipo de peça selecionado
  const intencoesSugeridas: IntencaoProcessual[] = useMemo(() => {
    const sugestoes = INTENCOES_POR_DOCUMENTO[tipoPeca] ?? INTENCOES_POR_DOCUMENTO["default"] ?? [];
    // Filtra por polo: polo passivo prioriza defesa, polo ativo prioriza ataque
    if (polo === "passivo") {
      const defensivas: IntencaoProcessual[] = [
        "redigir_contestacao", "redigir_impugnacao", "redigir_embargos",
        "redigir_excecao_executividade", "analisar_documento_adverso", "avaliar_riscos",
      ];
      return [...sugestoes.filter((i) => defensivas.includes(i)), ...sugestoes.filter((i) => !defensivas.includes(i))];
    }
    if (polo === "ativo") {
      const ofensivas: IntencaoProcessual[] = [
        "redigir_peticao_inicial", "redigir_recurso", "redigir_agravo",
        "redigir_mandado_seguranca", "redigir_replica", "extrair_fatos",
      ];
      return [...sugestoes.filter((i) => ofensivas.includes(i)), ...sugestoes.filter((i) => !ofensivas.includes(i))];
    }
    return sugestoes;
  }, [tipoPeca, polo]);

  const poloBadgeColor = {
    ativo: "bg-blue-100 text-blue-800 border-blue-200",
    passivo: "bg-amber-100 text-amber-800 border-amber-200",
    indefinido: "bg-gray-100 text-gray-600 border-gray-200",
  }[polo];

  const poloLabel = {
    ativo: "⚔️ Polo Ativo — Representa o Autor",
    passivo: "🛡️ Polo Passivo — Representa o Réu",
    indefinido: "❓ Polo não identificado",
  }[polo];

  async function uploadArquivos(): Promise<string[]> {
    if (arquivos.length === 0) return [];
    setLoadingUpload(true);
    const nomes: string[] = [];
    try {
      for (const arquivo of arquivos) {
        const formData = new FormData();
        formData.set("file", arquivo);
        formData.set("titulo", arquivo.name.replace(/\.[^.]+$/, ""));
        formData.set("tipoDocumento", "Petição");
        formData.set("vinculos", JSON.stringify([{ tipoEntidade: "caso", entidadeId: casoId, papel: "apoio" }]));
        const res = await fetch("/api/documentos/upload", { method: "POST", body: formData });
        if (res.ok) nomes.push(arquivo.name);
      }
    } finally {
      setLoadingUpload(false);
    }
    return nomes;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setResultadoTriagem(null);

    if (!intencaoProcessual) {
      setErro("Selecione o objetivo processual (o que o agente deve fazer).");
      return;
    }

    if (intencaoProcessual === "outro" && !intencaoCustom.trim()) {
      setErro("Descreva o objetivo quando selecionar \u2018Outro\u2019.");
      return;
    }

    try {
      const documentosAnexados = await uploadArquivos();

      if (usarAgentTriagem) {
        // Usar Agente de Triagem com IA
        setLoadingTriagem(true);
        const res = await fetch("/api/agents/triagem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            casoId,
            descricaoProblema: intencaoProcessual === "outro"
              ? `[OBJETIVO LIVRE] ${intencaoCustom}\n\n${contexto}`.trim()
              : contexto || titulo,
            prazoInformadoCliente: prazoFinal || undefined,
            documentosAnexados: documentosAnexados.length > 0 ? documentosAnexados : undefined,
            intencaoExplicita: intencaoProcessual !== "outro" ? intencaoProcessual : undefined,
            intencaoCustom: intencaoProcessual === "outro" ? intencaoCustom : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro na triagem.");
        
        setResultadoTriagem(data);
        if (data.pedidoCriado) {
          setPedidoGerado({
            id: data.pedidoCriado,
            casoId,
            titulo: titulo || `${tipoPeca} — ${casoId}`,
            tipoPeca,
            prioridade: (data.triagem?.prioridade as PrioridadePedido) ?? prioridade,
            status: "em triagem",
            etapaAtual: "classificacao",
            responsavel: data.triagem?.responsavelSugerido ?? "",
            prazoFinal: data.triagem?.prazoSugerido ?? prazoFinal,
            criadoEm: new Date().toISOString(),
            intencaoProcessual,
          });
        }
      } else {
        // Criação direta sem IA — chama API server-side
        const res = await fetch("/api/peticoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            casoId,
            titulo: titulo || `${tipoPeca} — ${casoId}`,
            tipoPeca,
            prioridade,
            prazoFinal: prazoFinal || new Date().toISOString().split("T")[0],
            intencaoProcessual,
          }),
        });
        const data = await res.json() as { pedido?: import("@/modules/peticoes/domain/types").PedidoDePeca; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erro ao criar pedido.");
        if (data.pedido) setPedidoGerado(data.pedido);
      }
    } catch (error) {
      setPedidoGerado(null);
      setErro(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
    } finally {
      setLoadingTriagem(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
      <Card title="Novo pedido de peça" subtitle="Defina o objetivo processual para que o agente de IA saiba o que fazer.">

        {/* Seletor do polo representado */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
            Polo representado <span className="font-normal text-[var(--color-muted)]">(obrigatório)</span>
          </label>
          <div className="flex gap-2">
            {(["ativo", "passivo", "indefinido"] as const).map((opcao) => {
              const labels = {
                ativo: "⚔️ Polo Ativo — Autor",
                passivo: "🛡️ Polo Passivo — Réu",
                indefinido: "❓ Não identificado",
              };
              const colors = {
                ativo: "border-blue-400 bg-blue-50 text-blue-800 ring-blue-300",
                passivo: "border-amber-400 bg-amber-50 text-amber-800 ring-amber-300",
                indefinido: "border-gray-300 bg-gray-50 text-gray-600 ring-gray-200",
              };
              const inactive = "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]";
              return (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setPolo(opcao)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    polo === opcao ? `${colors[opcao]} ring-2` : inactive
                  }`}
                >
                  {labels[opcao]}
                </button>
              );
            })}
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectInput
              label="Caso"
              value={casoId}
              options={casos.map((c) => ({ value: c.id, label: `${c.id} — ${c.titulo}` }))}
              onChange={(e) => {
                const id = e.target.value;
                setCasoId(id);
                const caso = casos.find((c) => c.id === id);
                if (caso) setPolo(detectarPoloRepresentado(caso));
              }}
            />
            <TextInput
              label="Prazo final (opcional com triagem IA)"
              type="date"
              value={prazoFinal}
              onChange={(e) => setPrazoFinal(e.target.value)}
            />
          </div>
          {casoSelecionado && (
            <p className="text-xs text-[var(--color-muted)]">
              Cliente: <span className="font-medium">{casoSelecionado.cliente}</span>
              {" · "}{casoSelecionado.materia}
              {" · "}<span className={casoSelecionado.status === "novo" ? "text-blue-600" : ""}>{casoSelecionado.status}</span>
            </p>
          )}

          <TextInput
            label="Título do pedido (opcional com triagem IA)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Contestação ao pedido de rescisão contratual"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <SelectInput
                label="Tipo de peça"
                value={tipoPeca}
                groups={gruposTipos}
                onChange={(e) => setTipoPeca(e.target.value as TipoPeca)}
              />
              {skillsVinculadas && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
                  <p className="font-semibold text-emerald-800 mb-1">
                    ✨ Skills especializadas disponíveis
                  </p>
                  <ul className="space-y-0.5">
                    {skillsVinculadas.map((slug) => (
                      <li key={slug} className="flex items-center gap-1 text-emerald-700">
                        <code className="rounded bg-emerald-100 px-1 font-mono">
                          /{slug}
                        </code>
                        <span className="text-emerald-600">
                          — {LABEL_SKILL[slug] ?? slug}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-emerald-600 opacity-75">
                    Use no Claude Code para gerar esta peça com especialização máxima.
                  </p>
                </div>
              )}
            </div>
            <SelectInput
              label="Prioridade"
              value={prioridade}
              options={[
                { value: "baixa", label: "Baixa" },
                { value: "média", label: "Média" },
                { value: "alta", label: "Alta" },
              ]}
              onChange={(e) => setPrioridade(e.target.value as PrioridadePedido)}
            />
          </div>

          {/* ─── SELEÇÃO DE INTENÇÃO PROCESSUAL ─────────────────────── */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              🎯 Objetivo processual — O que o agente deve fazer?
              <span className="ml-1 font-normal text-rose-600">*</span>
            </label>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Selecione exatamente o que você quer que o agente faça com o documento.
              {polo !== "indefinido" && ` As sugestões estão ordenadas por relevância para o polo ${polo === "ativo" ? "ativo (autor)" : "passivo (réu)"}.`}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {intencoesSugeridas.map((intencao) => (
                <button
                  type="button"
                  key={intencao}
                  onClick={() => {
                    setIntencaoProcessual(intencao);
                    if (intencao !== "outro") setIntencaoCustom("");
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    intencaoProcessual === intencao
                      ? "border-violet-500 bg-violet-50 font-semibold text-violet-800 ring-2 ring-violet-300"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  {LABEL_INTENCAO[intencao]}
                </button>
              ))}

              {/* Botão Outro sempre presente no final */}
              {!intencoesSugeridas.includes("outro") && (
                <button
                  type="button"
                  onClick={() => setIntencaoProcessual("outro")}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    intencaoProcessual === "outro"
                      ? "border-violet-500 bg-violet-50 font-semibold text-violet-800 ring-2 ring-violet-300"
                      : "border-dashed border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  ✏️ Outro — descrever livremente
                </button>
              )}
            </div>

            {/* Campo livre expandido quando 'outro' está selecionado */}
            {intencaoProcessual === "outro" && (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <label className="text-xs font-semibold text-violet-800">
                  Descreva o que você quer que o agente faça: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  className="mt-2 w-full rounded-lg border border-violet-200 bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-violet-300"
                  rows={3}
                  placeholder='Ex: "Quero uma notificação extrajudicial antes de ajuizar" ou "Analise a viabilidade de ação coletiva"'
                  value={intencaoCustom}
                  onChange={(e) => setIntencaoCustom(e.target.value)}
                  autoFocus
                />
                <p className="mt-1 text-xs text-violet-600">
                  💡 O agente usará sua descrição para calibrar a análise. Seja específico e objetivo.
                </p>
              </div>
            )}

            {intencaoProcessual && intencaoProcessual !== "outro" && (
              <p className="mt-2 text-xs text-violet-700">
                ✅ Selecionado: <strong>{LABEL_INTENCAO[intencaoProcessual]}</strong>
              </p>
            )}
          </div>

          <TextareaInput
            label="Contexto para o agente (descreva o problema ou o que você enviou)"
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Ex: Recebi a contestação da parte adversa ontem. Ela alega que o contrato era verbal e que não existe prova documental do serviço prestado..."
          />

          {/* Upload de documentos */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              📎 Documentos para análise <span className="font-normal text-[var(--color-muted)]">(opcional)</span>
            </label>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Envie a petição adversa, contrato, cédula ou qualquer documento que o agente deve analisar. PDF, DOCX ou TXT · máx. 4 MB por arquivo.
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setArquivos(e.target.files ? Array.from(e.target.files) : [])}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-violet-700"
            />
            {arquivos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {arquivos.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <span className="text-violet-600">📄</span>
                    {f.name} <span className="opacity-60">({(f.size / 1024).toFixed(0)} KB)</span>
                  </li>
                ))}
              </ul>
            )}
            {loadingUpload && (
              <p className="mt-1 text-xs text-violet-600">⬆️ Enviando documentos...</p>
            )}
          </div>

          {/* Opção de usar triagem com IA */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={usarAgentTriagem}
              onChange={(e) => setUsarAgentTriagem(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-violet-600"
            />
            <span className="font-medium text-[var(--color-ink)]">Usar Agente de Triagem com IA</span>
            <span className="text-xs text-[var(--color-muted)]">(analisa o caso e enriquece a triagem automaticamente)</span>
          </label>

          <button
            type="submit"
            disabled={loadingTriagem || loadingUpload}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
          >
            {loadingUpload ? "⬆️ Enviando documentos..." : loadingTriagem ? "⏳ Agente analisando..." : usarAgentTriagem ? "🤖 Criar com Triagem IA" : "Criar pedido"}
          </button>
          {erro ? <p className="text-sm font-medium text-rose-700">{erro}</p> : null}
        </form>
      </Card>

      {/* Painel de resultado */}
      <div className="space-y-4">
        <Card title="Resultado da triagem" subtitle="Análise do agente orientada pelo polo representado.">
          {!pedidoGerado && !resultadoTriagem ? (
            <p className="text-sm text-[var(--color-muted)]">
              Preencha o formulário e defina o objetivo processual para criar um pedido.
            </p>
          ) : null}

          {resultadoTriagem && (
            <div className="space-y-3 text-sm">
              {/* Polo confirmado */}
              <div className={`rounded-lg border px-3 py-2 ${poloBadgeColor}`}>
                <p className="font-semibold">
                  Polo Confirmado: {(resultadoTriagem.triagem as Record<string, unknown>)?.poloDetectado as string}
                </p>
                <p className="text-xs opacity-75">
                  {(resultadoTriagem.triagem as Record<string, unknown>)?.justificativaPolo as string}
                </p>
              </div>

              {/* Intenção detectada */}
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                <p className="text-xs font-medium text-violet-600">Objetivo detectado:</p>
                <p className="font-semibold text-violet-800">
                  {LABEL_INTENCAO[(resultadoTriagem.triagem as Record<string, unknown>)?.intencaoDetectada as IntencaoProcessual]}
                </p>
              </div>

              {/* Resumo */}
              <p className="text-[var(--color-muted)]">
                {(resultadoTriagem.triagem as Record<string, unknown>)?.resumoJustificativa as string}
              </p>

              {/* Pontos vulneráveis do adversário */}
              {Array.isArray((resultadoTriagem.triagem as Record<string, unknown>)?.pontosVulneraveisAdverso) &&
                ((resultadoTriagem.triagem as Record<string, unknown>)?.pontosVulneraveisAdverso as string[]).length > 0 && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                    <p className="text-xs font-semibold text-rose-700 mb-1">⚠️ Pontos vulneráveis do adversário:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-800">
                      {((resultadoTriagem.triagem as Record<string, unknown>)?.pontosVulneraveisAdverso as string[]).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Alertas */}
              {Array.isArray((resultadoTriagem.triagem as Record<string, unknown>)?.alertas) &&
                ((resultadoTriagem.triagem as Record<string, unknown>)?.alertas as string[]).length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 mb-1">🔔 Alertas:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                      {((resultadoTriagem.triagem as Record<string, unknown>)?.alertas as string[]).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {pedidoGerado && (
            <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--color-ink)]">{pedidoGerado.id}</p>
                <StatusBadge label={pedidoGerado.status} variant="implantacao" />
              </div>
              <p className="text-sm text-[var(--color-muted)]">{pedidoGerado.titulo}</p>
              <p className="text-xs text-[var(--color-muted)]">Responsável: {pedidoGerado.responsavel}</p>
              <p className="text-xs text-[var(--color-muted)]">Criado em: {formatarDataHora(pedidoGerado.criadoEm)}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href={`/peticoes/pedidos/${pedidoGerado.id}`}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
                >
                  Abrir pedido
                </Link>
                <Link
                  href={`/peticoes/pipeline/${pedidoGerado.id}`}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
                >
                  Abrir pipeline
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
