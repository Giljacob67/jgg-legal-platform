import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PainelPermissoes } from "@/modules/administracao/ui/painel-permissoes";

export default function PermissoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissões"
        description="Matriz de acesso por perfil e módulo da plataforma."
      />
      <Card
        title="Matriz de permissões"
        subtitle="Nível de acesso de cada perfil a cada módulo do HUB JGG."
      >
        <PainelPermissoes />
      </Card>
    </div>
  );
}
