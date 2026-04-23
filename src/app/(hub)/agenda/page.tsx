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
  }>;
};

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const session = await auth();
  const params = await searchParams;
  const configuracoes = await obterConfiguracoes();
  const googleConfig = extrairGoogleWorkspaceConfig(configuracoes);
  const readiness = avaliarGoogleWorkspace(googleConfig);
  const calendarSelecionado = params.calendarId || googleConfig.calendarPrimaryId;

  const connection = session?.user?.id
    ? await obterStatusAgendaGoogle(session.user.id)
    : { conectada: false, calendarios: [], pendencia: "Sessão indisponível." };

  const [eventos, casos, pedidos, clientes] = session?.user?.id
    ? await Promise.all([
        listarEventosAgendaGoogle(session.user.id, calendarSelecionado, {
          inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        }),
        listarCasos(),
        listarPedidosDePeca(),
        listarClientes({ status: "ativo" }),
      ])
    : [[], [], [], []];

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
        readiness={readiness}
        calendarId={googleConfig.calendarPrimaryId}
        authMode={googleConfig.authMode}
        connection={connection}
        eventos={eventos}
        googleFeedback={params.google ?? null}
        googleDetalhe={params.detalhe ?? null}
        calendarioSelecionado={calendarSelecionado}
        opcoesVinculo={opcoesVinculo}
      />
    </div>
  );
}
