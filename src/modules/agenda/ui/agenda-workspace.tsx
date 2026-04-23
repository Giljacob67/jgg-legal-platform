"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { GoogleWorkspaceReadiness } from "@/modules/administracao/domain/google-workspace";
import type { GoogleAgendaConnectionStatus, AgendaEvent } from "@/modules/agenda/domain/google-calendar";
import type { AgendaViewMode } from "@/modules/agenda/domain/types";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { CalendarIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";
import { cn } from "@/lib/utils";

type OpcaoVinculo = { id: string; label: string };

type AgendaWorkspaceProps = {
  readiness: GoogleWorkspaceReadiness;
  calendarId: string;
  authMode: string;
  connection: GoogleAgendaConnectionStatus;
  eventos: AgendaEvent[];
  googleFeedback?: string | null;
  googleDetalhe?: string | null;
  calendarioSelecionado?: string | null;
  opcoesVinculo: {
    casos: OpcaoVinculo[];
    pedidos: OpcaoVinculo[];
    clientes: OpcaoVinculo[];
  };
  novoCompromissoInicial?: {
    titulo: string;
    descricao: string;
    inicio: string;
    fim: string;
    local: string;
    vinculoTipo: "caso" | "pedido" | "cliente";
    vinculoId: string;
  } | null;
};

const VIEW_OPTIONS: Array<{ id: AgendaViewMode; label: string }> = [
  { id: "mes", label: "Mês" },
  { id: "semana", label: "Semana" },
  { id: "dia", label: "Dia" },
];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function formatarHora(iso: string, diaInteiro: boolean) {
  if (diaInteiro) return "Dia inteiro";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function isoToLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function construirRascunhoEventoInicial(
  origem?: AgendaWorkspaceProps["novoCompromissoInicial"],
) {
  return {
    titulo: origem?.titulo ?? "",
    descricao: origem?.descricao ?? "",
    inicio: isoToLocalDateTime(origem?.inicio),
    fim: isoToLocalDateTime(origem?.fim),
    local: origem?.local ?? "",
    vinculoTipo: origem?.vinculoTipo ?? ("caso" as const),
    vinculoId: origem?.vinculoId ?? "",
  };
}

function obterOpcoesPorTipo(
  tipo: "caso" | "pedido" | "cliente",
  opcoes: AgendaWorkspaceProps["opcoesVinculo"],
) {
  if (tipo === "caso") return opcoes.casos;
  if (tipo === "pedido") return opcoes.pedidos;
  return opcoes.clientes;
}

function montarMapaEventosPorDia(eventos: AgendaEvent[]) {
  const mapa = new Map<number, AgendaEvent[]>();
  for (const evento of eventos) {
    const dia = new Date(evento.inicio).getDate();
    const lista = mapa.get(dia) ?? [];
    lista.push(evento);
    mapa.set(dia, lista);
  }
  return mapa;
}

export function AgendaWorkspace({
  readiness,
  calendarId,
  authMode,
  connection,
  eventos,
  googleFeedback,
  googleDetalhe,
  calendarioSelecionado,
  opcoesVinculo,
  novoCompromissoInicial,
}: AgendaWorkspaceProps) {
  const [view, setView] = useState<AgendaViewMode>("semana");
  const [desconectando, startDisconnect] = useTransition();
  const [sincronizandoCalendario, startCalendarSync] = useTransition();
  const [criandoEvento, startCreateEvent] = useTransition();
  const [salvandoEdicao, startSaveEdit] = useTransition();
  const [excluindoEvento, startDeleteEvent] = useTransition();
  const [mensagemEvento, setMensagemEvento] = useState<string | null>(null);
  const [erroEvento, setErroEvento] = useState<string | null>(null);
  const [eventoEmEdicaoId, setEventoEmEdicaoId] = useState<string | null>(null);
  const [novoEvento, setNovoEvento] = useState(() => construirRascunhoEventoInicial(novoCompromissoInicial));
  const router = useRouter();

  const eventosPorDia = useMemo(() => montarMapaEventosPorDia(eventos), [eventos]);
  const eventosOrdenados = useMemo(
    () =>
      [...eventos].sort(
        (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
      ),
    [eventos],
  );

  function desconectarConta() {
    startDisconnect(async () => {
      await fetch("/api/integracoes/google/connection", { method: "DELETE" });
      router.refresh();
    });
  }

  function selecionarCalendario(calendarId: string) {
    startCalendarSync(async () => {
      await fetch("/api/integracoes/google/connection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCalendarId: calendarId }),
      });
      router.refresh();
    });
  }

  function atualizarNovoEvento(chave: keyof typeof novoEvento, valor: string) {
    setNovoEvento((atual) => ({ ...atual, [chave]: valor }));
  }

  function limparFormulario() {
    setEventoEmEdicaoId(null);
    setNovoEvento(construirRascunhoEventoInicial());
  }

  function editarEvento(evento: AgendaEvent) {
    setMensagemEvento(null);
    setErroEvento(null);
    setEventoEmEdicaoId(evento.id);
    setNovoEvento({
      titulo: evento.titulo,
      descricao: evento.descricao ?? "",
      inicio: isoToLocalDateTime(evento.inicio),
      fim: isoToLocalDateTime(evento.fim),
      local: evento.local ?? "",
      vinculoTipo: evento.vinculoTipo ?? "caso",
      vinculoId: evento.vinculoId ?? "",
    });
  }

  function resolverLabelVinculo() {
    const tipo = novoEvento.vinculoTipo;
    const lista = obterOpcoesPorTipo(tipo, opcoesVinculo);
    return lista.find((item) => item.id === novoEvento.vinculoId)?.label;
  }

  function criarEvento() {
    setMensagemEvento(null);
    setErroEvento(null);
    startCreateEvent(async () => {
      const res = await fetch("/api/agenda/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: novoEvento.titulo,
          descricao: novoEvento.descricao,
          inicio: localDateTimeToIso(novoEvento.inicio),
          fim: novoEvento.fim ? localDateTimeToIso(novoEvento.fim) : undefined,
          local: novoEvento.local || undefined,
          calendarioId: calendarioSelecionado || connection.selectedCalendarId || calendarId,
          vinculoTipo: novoEvento.vinculoId ? novoEvento.vinculoTipo : undefined,
          vinculoId: novoEvento.vinculoId || undefined,
          vinculoLabel: novoEvento.vinculoId ? resolverLabelVinculo() : undefined,
        }),
      });

      const payload = (await res.json()) as { error?: string; evento?: AgendaEvent };
      if (!res.ok) {
        setErroEvento(payload.error ?? "Falha ao criar compromisso.");
        return;
      }

      setMensagemEvento("Compromisso criado com sucesso no Google Calendar.");
      limparFormulario();
      router.refresh();
    });
  }

  function salvarEdicao() {
    if (!eventoEmEdicaoId) return;

    setMensagemEvento(null);
    setErroEvento(null);
    startSaveEdit(async () => {
      const res = await fetch(`/api/agenda/eventos/${eventoEmEdicaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: novoEvento.titulo,
          descricao: novoEvento.descricao,
          inicio: localDateTimeToIso(novoEvento.inicio),
          fim: novoEvento.fim ? localDateTimeToIso(novoEvento.fim) : undefined,
          local: novoEvento.local || undefined,
          calendarioId: calendarioSelecionado || connection.selectedCalendarId || calendarId,
          vinculoTipo: novoEvento.vinculoId ? novoEvento.vinculoTipo : undefined,
          vinculoId: novoEvento.vinculoId || undefined,
          vinculoLabel: novoEvento.vinculoId ? resolverLabelVinculo() : undefined,
        }),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErroEvento(payload.error ?? "Falha ao atualizar compromisso.");
        return;
      }

      setMensagemEvento("Compromisso atualizado com sucesso.");
      limparFormulario();
      router.refresh();
    });
  }

  function excluirEvento(eventId: string) {
    setMensagemEvento(null);
    setErroEvento(null);
    startDeleteEvent(async () => {
      const search = new URLSearchParams();
      search.set("calendarId", calendarioSelecionado || connection.selectedCalendarId || calendarId);
      const res = await fetch(`/api/agenda/eventos/${eventId}?${search.toString()}`, {
        method: "DELETE",
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErroEvento(payload.error ?? "Falha ao excluir compromisso.");
        return;
      }
      setMensagemEvento("Compromisso excluído com sucesso.");
      if (eventoEmEdicaoId === eventId) {
        limparFormulario();
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {googleFeedback === "conectado" ? (
        <InlineAlert title="Conta Google conectada" variant="success">
          Sua Agenda já pode ler calendários e eventos reais do Google Calendar.
        </InlineAlert>
      ) : null}
      {googleFeedback === "erro" ? (
        <InlineAlert title="Falha na conexão Google" variant="warning">
          {googleDetalhe || "Não foi possível concluir a autenticação com o Google."}
        </InlineAlert>
      ) : null}
      {novoCompromissoInicial ? (
        <InlineAlert title="Compromisso pré-preenchido" variant="info">
          A Agenda recebeu contexto operacional de outro módulo. Revise os dados, ajuste o horário e confirme o registro no Google Calendar.
        </InlineAlert>
      ) : null}

      {!readiness.agendaOk ? (
        <InlineAlert title="Agenda ainda não conectável" variant="warning">
          A base visual já existe, mas a Agenda profissional depende de OAuth por usuário e calendar ID válido.
        </InlineAlert>
      ) : connection.conectada ? (
        <InlineAlert title="Agenda conectada ao Google Calendar" variant="success">
          Eventos reais do Google Calendar já estão sendo lidos para esta conta.
        </InlineAlert>
      ) : (
        <InlineAlert title="Conexão Google pendente" variant="info">
          A fundação está pronta. Agora falta conectar a conta do usuário para carregar calendários reais.
        </InlineAlert>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr,0.95fr]">
        <Card
          title="Workspace da Agenda"
          subtitle="Calendário jurídico com leitura real do Google Calendar quando conectado."
          eyebrow="Calendário"
          headerActions={
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    view === option.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card-strong)] p-4">
            <div className="grid grid-cols-7 gap-2">
              {DIAS.map((dia) => (
                <div
                  key={dia}
                  className="rounded-2xl px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-strong)]"
                >
                  {dia}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, index) => {
                const dia = index + 1;
                const eventosDia = eventosPorDia.get(dia) ?? [];
                const destaque = eventosDia.length > 0;
                return (
                  <div
                    key={dia}
                    className={cn(
                      "min-h-[108px] rounded-[1.25rem] border p-3",
                      destaque
                        ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_9%,white)]"
                        : "border-[var(--color-border)] bg-[var(--color-card)]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{dia}</p>
                      {destaque ? <StatusBadge label={`${eventosDia.length} evento${eventosDia.length > 1 ? "s" : ""}`} variant="implantacao" /> : null}
                    </div>
                    {destaque ? (
                      <div className="mt-3 space-y-2">
                        {eventosDia.slice(0, 2).map((evento) => (
                          <div
                            key={evento.id}
                            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2"
                          >
                            <p className="text-[11px] font-semibold text-[var(--color-accent)]">
                              {formatarHora(evento.inicio, evento.diaInteiro)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-[var(--color-ink)]">
                              {evento.titulo}
                            </p>
                          </div>
                        ))}
                        {eventosDia.length > 2 ? (
                          <p className="text-[11px] text-[var(--color-muted)]">
                            +{eventosDia.length - 2} itens no dia
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-6 text-[11px] text-[var(--color-muted)]">
                        {connection.conectada
                          ? "Sem eventos nesse dia."
                          : "Conecte sua conta Google para ver eventos reais."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Conexão Google" subtitle="Conta, calendário ativo e status da integração." eyebrow="Integração">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
                <span className="text-sm text-[var(--color-muted)]">Modo Google</span>
                <StatusBadge label={authMode.replace(/_/g, " ")} variant="neutro" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
                <span className="text-sm text-[var(--color-muted)]">Calendar ID</span>
                <span className="font-mono text-xs text-[var(--color-ink)]">
                  {calendarioSelecionado || connection.selectedCalendarId || calendarId || "não definido"}
                </span>
              </div>
              {connection.emailGoogle ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
                  <span className="text-sm text-[var(--color-muted)]">Conta conectada</span>
                  <span className="text-xs font-semibold text-[var(--color-ink)]">{connection.emailGoogle}</span>
                </div>
              ) : null}

              {connection.conectada ? (
                <button
                  type="button"
                  onClick={desconectarConta}
                  disabled={desconectando}
                  className="w-full rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {desconectando ? "Desconectando..." : "Desconectar conta Google"}
                </button>
              ) : (
                <Link
                  href="/api/integracoes/google/authorize?redirectTo=/agenda"
                  className="block w-full rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
                >
                  Conectar Google Calendar
                </Link>
              )}
            </div>
          </Card>

          <Card title="Calendários acessíveis" subtitle="Selecione qual calendário visualizar nesta fase." eyebrow="Calendários">
            {connection.calendarios.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum calendário carregado ainda. Conecte o Google Calendar para listar agendas reais.
              </p>
            ) : (
              <div className="space-y-3">
                {connection.calendarios.map((calendario) => (
                  <button
                    key={calendario.id}
                    type="button"
                    onClick={() => selecionarCalendario(calendario.id)}
                    disabled={sincronizandoCalendario}
                    className={cn(
                      "block w-full rounded-[1.2rem] border px-4 py-3 text-left transition",
                      calendario.id === (calendarioSelecionado || connection.selectedCalendarId || "primary")
                        ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,white)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-accent)]",
                      sincronizandoCalendario ? "cursor-wait opacity-80" : "",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">{calendario.resumo}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)] font-mono">{calendario.id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {calendario.primaria ? <StatusBadge label="primário" variant="neutro" /> : null}
                        {calendario.id === (calendarioSelecionado || connection.selectedCalendarId || "primary") ? (
                          <StatusBadge label="ativo" variant="sucesso" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="Novo compromisso" subtitle="Criação rápida de evento no calendário ativo." eyebrow="Operação">
            {!connection.conectada ? (
              <p className="text-sm text-[var(--color-muted)]">
                Conecte sua conta Google para criar compromissos diretamente nesta agenda.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {eventoEmEdicaoId ? "Editar compromisso" : "Novo compromisso"}
                  </p>
                  {eventoEmEdicaoId ? (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      className="text-xs font-semibold text-[var(--color-accent)]"
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>
                <TextInput
                  label="Título"
                  value={novoEvento.titulo}
                  onChange={(event) => atualizarNovoEvento("titulo", event.target.value)}
                  placeholder="Ex.: Audiência de conciliação • Fazenda Atlas"
                  requiredMark
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectInput
                    label="Vincular a"
                    value={novoEvento.vinculoTipo}
                    onChange={(event) => {
                      const tipo = event.target.value as "caso" | "pedido" | "cliente";
                      setNovoEvento((atual) => ({
                        ...atual,
                        vinculoTipo: tipo,
                        vinculoId: "",
                      }));
                    }}
                    options={[
                      { value: "caso", label: "Caso" },
                      { value: "pedido", label: "Pedido" },
                      { value: "cliente", label: "Cliente" },
                    ]}
                    helperText="Opcional, mas importante para integrar a Agenda ao fluxo jurídico."
                  />
                  <SelectInput
                    label="Registro vinculado"
                    value={novoEvento.vinculoId}
                    onChange={(event) => atualizarNovoEvento("vinculoId", event.target.value)}
                    options={[
                      { value: "", label: "Sem vínculo operacional" },
                      ...obterOpcoesPorTipo(novoEvento.vinculoTipo, opcoesVinculo).map((item) => ({
                        value: item.id,
                        label: item.label,
                      })),
                    ]}
                    helperText="O vínculo aparecerá no evento e facilita navegação futura entre módulos."
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    label="Início"
                    type="datetime-local"
                    value={novoEvento.inicio}
                    onChange={(event) => atualizarNovoEvento("inicio", event.target.value)}
                    requiredMark
                  />
                  <TextInput
                    label="Fim"
                    type="datetime-local"
                    value={novoEvento.fim}
                    onChange={(event) => atualizarNovoEvento("fim", event.target.value)}
                  />
                </div>
                <TextInput
                  label="Local"
                  value={novoEvento.local}
                  onChange={(event) => atualizarNovoEvento("local", event.target.value)}
                  placeholder="Fórum, escritório, link de videoconferência..."
                />
                <TextareaInput
                  label="Descrição"
                  value={novoEvento.descricao}
                  onChange={(event) => atualizarNovoEvento("descricao", event.target.value)}
                  placeholder="Contexto, participantes, processo, observações internas."
                  rows={4}
                />
                {mensagemEvento ? (
                  <InlineAlert title="Compromisso registrado" variant="success">
                    {mensagemEvento}
                  </InlineAlert>
                ) : null}
                {erroEvento ? (
                  <InlineAlert title="Falha ao criar compromisso" variant="warning">
                    {erroEvento}
                  </InlineAlert>
                ) : null}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={eventoEmEdicaoId ? salvarEdicao : criarEvento}
                    disabled={(criandoEvento || salvandoEdicao) || !novoEvento.titulo.trim() || !novoEvento.inicio}
                    className="flex-1 rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {eventoEmEdicaoId
                      ? salvandoEdicao
                        ? "Salvando..."
                        : "Salvar alterações"
                      : criandoEvento
                        ? "Criando..."
                        : "Criar compromisso"}
                  </button>
                  {eventoEmEdicaoId ? (
                    <button
                      type="button"
                      onClick={() => excluirEvento(eventoEmEdicaoId)}
                      disabled={excluindoEvento}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {excluindoEvento ? "Excluindo..." : "Excluir"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </Card>

          <Card title="Próximos eventos" subtitle="Painel lateral com os compromissos reais do calendário selecionado." eyebrow="Agenda lateral">
            {eventosOrdenados.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                {connection.conectada
                  ? "Nenhum evento encontrado no intervalo atual."
                  : "Conecte sua conta Google para carregar compromissos reais."}
              </p>
            ) : (
              <div className="space-y-3">
                {eventosOrdenados.slice(0, 8).map((evento) => (
                  <div key={evento.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-accent)]">
                          <CalendarIcon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">{evento.titulo}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            {formatarDataCurta(evento.inicio)} · {formatarHora(evento.inicio, evento.diaInteiro)}
                          </p>
                          {evento.local ? (
                            <p className="mt-1 text-xs text-[var(--color-muted)]">{evento.local}</p>
                          ) : null}
                          {evento.vinculoLabel ? (
                            <p className="mt-1 text-xs font-medium text-[var(--color-accent)]">
                              {evento.vinculoLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarEvento(evento)}
                          className="text-xs font-semibold text-[var(--color-accent)]"
                        >
                          Editar
                        </button>
                        {evento.linkExterno ? (
                          <a
                            href={evento.linkExterno}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[var(--color-accent)]"
                          >
                            Abrir
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Próxima entrega" subtitle="O que ainda falta para a Agenda virar módulo operacional completo." eyebrow="Roadmap">
            <div className="space-y-2">
              {[
                "Criar eventos automaticamente a partir de prazos do caso.",
                "Disparar agenda diretamente do fluxo de petições e clientes.",
                "Sincronizar audiências e prazos com o módulo de casos.",
                "Adicionar timeline operacional e lembretes jurídicos.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <ChevronRightIcon size={15} className="text-[var(--color-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
