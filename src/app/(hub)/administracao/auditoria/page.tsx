import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TrilhaAuditoria } from "@/modules/administracao/ui/trilha-auditoria";

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Rastreabilidade de leitura, execução, download e aprovação em dados jurídicos sensíveis."
      />

      <Card
        title="Trilha de auditoria"
        subtitle="Filtros por usuário, recurso, ação e resultado com inspeção de detalhes por evento."
      >
        <TrilhaAuditoria />
      </Card>
    </div>
  );
}
