import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { avaliarGoogleWorkspace, extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import { listarEventosAgendaGoogle, obterStatusAgendaGoogle } from "@/modules/agenda/application/google-calendar";
import { AgendaWorkspace } from "@/modules/agenda/ui/agenda-workspace";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { listarClientes } from "@/modules/clientes/application";
import type { AgendaEvent } from "@/modules/agenda/domain/google-calendar";
import type { Caso } from "@/modules/casos/domain/types";
import type { PedidoDePeca } from "@/modules/peticoes/domain/types";

type AgendaPageProps = {
  searchParams: Promise<{
    google?: string;
    detalhe?: string;
    calendarId?: string;
    novo?: string;
    vinculoTipo?: "caso" | "pedido" | "cliente";
    vinculoId?: string;
    titulo?: string;
    descricao?: string;
    inicio?: string;
    fim?: string;
    local?: string;
  }>;
};

type SugestaoAgenda = {
  id: string;
  categoria: "prazo_caso" | "revisao_pedido";
  titulo: string;
  descricao: string;
  prazoLabel: string;
  severidade: "alta" | "media";
  href: string;
};

function formatarDataOperacional(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function diferencaDias(dataIso: string) {
  const hoje = new Date();
  const alvo = new Date(dataIso);
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioAlvo = new Date(alvo.getFullYear(), alvo.getMonth(), alvo.getDate());
  return Math.round((inicioAlvo.getTime() - inicioHoje.getTime()) / 86400000);
}

function montarHrefAgenda(input: {
  vinculoTipo: "caso" | "pedido" | "cliente";
  vinculoId: string;
  titulo: string;
  descricao: string;
  inicio?: string;
  fim?: string;
  local?: string;
}) {
  const search = new URLSearchParams({
    novo: "1",
    vinculoTipo: input.vinculoTipo,
    vinculoId: input.vinculoId,
    titulo: input.titulo,
    descricao: input.descricao,
  });
  if (input.inicio) search.set("inicio", input.inicio);
  if (input.fim) search.set("fim", input.fim);
  if (input.local) search.set("local", input.local);
  return `/agenda?${search.toString()}`;
}

function existeEventoVinculadoProximo(
  eventos: AgendaEvent[],
  tipo: "caso" | "pedido" | "cliente",
  id: string,
) {
  const agora = Date.now();
  return eventos.some((evento) => {
    if (evento.vinculoTipo !== tipo || evento.vinculoId !== id) return false;
    return new Date(evento.inicio).getTime() >= agora - 86400000;
  });
}

function construirSugestoesAgenda(casos: Caso[], pedidos: PedidoDePeca[], eventos: AgendaEvent[]): SugestaoAgenda[] {
  const sugestoes: SugestaoAgenda[] = [];

  for (const caso of casos) {
    const diasPrazo = diferencaDias(caso.prazoFinal);
    if (diasPrazo < 0 || diasPrazo > 21) continue;
    if (existeEventoVinculadoProximo(eventos, "caso", caso.id)) continue;

    const inicio = new Date(`${caso.prazoFinal}T09:00:00`).toISOString();
    const fim = new Date(`${caso.prazoFinal}T10:00:00`).toISOString();
    sugestoes.push({
      id: `caso-${caso.id}`,
      categoria: "prazo_caso",
      titulo: `Agendar prazo do caso ${caso.id}`,
      descricao: `${caso.titulo} • ${caso.cliente}`,
      prazoLabel: `Prazo final em ${formatarDataOperacional(caso.prazoFinal)}`,
      severidade: diasPrazo <= 3 ? "alta" : "media",
      href: montarHrefAgenda({
        vinculoTipo: "caso",
        vinculoId: caso.id,
        titulo: `Prazo do caso ${caso.id} • ${caso.titulo}`,
        descricao: `Prazo processual vinculado ao caso ${caso.id} (${caso.titulo}). Cliente: ${caso.cliente}.`,
        inicio,
        fim,
      }),
    });
  }

  for (const pedido of pedidos) {
    if (pedido.status === "aprovado") continue;
    const diasPrazo = diferencaDias(pedido.prazoFinal);
    if (diasPrazo < 0 || diasPrazo > 10) continue;
    if (existeEventoVinculadoProximo(eventos, "pedido", pedido.id)) continue;

    const inicio = new Date(`${pedido.prazoFinal}T14:00:00`).toISOString();
    const fim = new Date(`${pedido.prazoFinal}T15:00:00`).toISOString();
    sugestoes.push({
      id: `pedido-${pedido.id}`,
      categoria: "revisao_pedido",
      titulo: `Reservar revisão do pedido ${pedido.id}`,
      descricao: `${pedido.tipoPeca} • caso ${pedido.casoId}`,
      prazoLabel: `Prazo final em ${formatarDataOperacional(pedido.prazoFinal)}`,
      severidade: diasPrazo <= 2 ? "alta" : "media",
      href: montarHrefAgenda({
        vinculoTipo: "pedido",
        vinculoId: pedido.id,
        titulo: `Revisão do pedido ${pedido.id} • ${pedido.tipoPeca}`,
        descricao: `Compromisso operacional vinculado ao pedido ${pedido.id}. Caso ${pedido.casoId}. Etapa atual: ${pedido.etapaAtual.replaceAll("_", " ")}.`,
        inicio,
        fim,
      }),
    });
  }

  return sugestoes
    .sort((a, b) => {
      if (a.severidade !== b.severidade) return a.severidade === "alta" ? -1 : 1;
      return a.prazoLabel.localeCompare(b.prazoLabel, "pt-BR");
    })
    .slice(0, 8);
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const session = await auth();
  const params = await searchParams;
  const configuracoes = await obterConfiguracoes();
  const googleConfig = extrairGoogleWorkspaceConfig(configuracoes);
  const readiness = avaliarGoogleWorkspace(googleConfig);
  const calendarSelecionado = params.calendarId || googleConfig.calendarPrimaryId;

  let connection:
    | Awaited<ReturnType<typeof obterStatusAgendaGoogle>>
    | { conectada: false; calendarios: []; pendencia: string } = { conectada: false, calendarios: [], pendencia: "Sessão indisponível." };
  let eventos: Awaited<ReturnType<typeof listarEventosAgendaGoogle>> = [];
  let casos: Awaited<ReturnType<typeof listarCasos>> = [];
  let pedidos: Awaited<ReturnType<typeof listarPedidosDePeca>> = [];
  let clientes: Awaited<ReturnType<typeof listarClientes>> = [];
  let detalheAgenda = params.detalhe ?? null;

  if (session?.user?.id) {
    try {
      connection = await obterStatusAgendaGoogle(session.user.id);
      [eventos, casos, pedidos, clientes] = await Promise.all([
        listarEventosAgendaGoogle(session.user.id, calendarSelecionado, {
          inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        }),
        listarCasos(),
        listarPedidosDePeca(),
        listarClientes({ status: "ativo" }),
      ]);
    } catch (error) {
      connection = {
        conectada: false,
        calendarios: [],
        pendencia: "A Agenda encontrou uma falha de infraestrutura e entrou em modo degradado.",
      };
      detalheAgenda = error instanceof Error ? error.message : "Falha ao carregar a Agenda.";
    }
  }

  const opcoesVinculo = {
    casos: casos.map((caso) => ({
      id: caso.id,
      label: `${caso.id} • ${caso.titulo}`,
    })),
    pedidos: pedidos.map((pedido) => ({
      id: pedido.id,
      label: `${pedido.id} • ${pedido.titulo}`,
    })),
    clientes: clientes.map((cliente) => ({
      id: cliente.id,
      label: `${cliente.id} • ${cliente.nome}`,
    })),
  };

  const novoCompromissoInicial = params.novo === "1"
    ? {
        titulo: params.titulo ?? "",
        descricao: params.descricao ?? "",
        inicio: params.inicio ?? "",
        fim: params.fim ?? "",
        local: params.local ?? "",
        vinculoTipo: params.vinculoTipo ?? "caso",
        vinculoId: params.vinculoId ?? "",
      }
    : null;
  const workspaceKey = JSON.stringify({
    calendarSelecionado,
    google: params.google ?? null,
    detalhe: detalheAgenda,
    novoCompromissoInicial,
  });
  const sugestoesOperacionais = construirSugestoesAgenda(casos, pedidos, eventos);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Agenda jurídica conectada ao Google Calendar para consolidar audiências, prazos, reuniões e compromissos operacionais."
        meta={
          <>
            <StatusBadge label={connection.conectada ? "google conectado" : readiness.agendaOk ? "integração apta" : "integração pendente"} variant={connection.conectada || readiness.agendaOk ? "sucesso" : "alerta"} />
            <StatusBadge label={googleConfig.authMode.replace(/_/g, " ")} variant="neutro" />
          </>
        }
      />

      <AgendaWorkspace
        key={workspaceKey}
        readiness={readiness}
        calendarId={googleConfig.calendarPrimaryId}
        authMode={googleConfig.authMode}
        connection={connection}
        eventos={eventos}
        googleFeedback={params.google ?? null}
        googleDetalhe={detalheAgenda}
        calendarioSelecionado={calendarSelecionado}
        opcoesVinculo={opcoesVinculo}
        novoCompromissoInicial={novoCompromissoInicial}
        sugestoesOperacionais={sugestoesOperacionais}
      />
    </div>
  );
}
