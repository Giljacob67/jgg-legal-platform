import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { avaliarGoogleWorkspace, extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import { AgendaWorkspace } from "@/modules/agenda/ui/agenda-workspace";

export default async function AgendaPage() {
  const configuracoes = await obterConfiguracoes();
  const googleConfig = extrairGoogleWorkspaceConfig(configuracoes);
  const readiness = avaliarGoogleWorkspace(googleConfig);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Tela-base da agenda jurídica unificada, preparada para integrar Google Calendar, audiências, prazos e compromissos internos."
        meta={
          <>
            <StatusBadge label={readiness.agendaOk ? "integração apta" : "integração pendente"} variant={readiness.agendaOk ? "sucesso" : "alerta"} />
            <StatusBadge label={googleConfig.authMode.replace(/_/g, " ")} variant="neutro" />
          </>
        }
      />

      <AgendaWorkspace
        readiness={readiness}
        calendarId={googleConfig.calendarPrimaryId}
        authMode={googleConfig.authMode}
      />
    </div>
  );
}
