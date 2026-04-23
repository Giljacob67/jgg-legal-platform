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
      />
    </div>
  );
}
