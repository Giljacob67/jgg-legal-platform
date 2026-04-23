import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { avaliarGoogleWorkspace, extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import { listarEventosAgendaGoogle, obterStatusAgendaGoogle } from "@/modules/agenda/application/google-calendar";
import { AgendaWorkspace } from "@/modules/agenda/ui/agenda-workspace";

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

  const eventos = session?.user?.id
    ? await listarEventosAgendaGoogle(session.user.id, calendarSelecionado, {
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      })
    : [];

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
      />
    </div>
  );
}
