import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ConfiguracoesIA } from "@/modules/administracao/ui/configuracoes-ia";
import { ConfiguracoesGoogle } from "@/modules/administracao/ui/configuracoes-google";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { MODELOS_CATALOGADOS } from "@/lib/ai/provider";
import { auth } from "@/lib/auth";
import { resolverPerfilUsuario } from "@/modules/administracao/domain/types";

const PERFIS_ADMIN = ["administrador_sistema", "socio_direcao"];

export default async function ConfiguracoesPage() {
  const [configuracoes, session] = await Promise.all([obterConfiguracoes(), auth()]);
  const perfil = resolverPerfilUsuario(session?.user?.role as string | undefined);
  if (!PERFIS_ADMIN.includes(perfil)) redirect("/sem-permissao");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Preferências da plataforma, provedor de IA e configurações técnicas."
      />

      <Card
        title="Configurações do sistema"
        subtitle="Alterações aplicadas imediatamente sem necessidade de redeploy."
      >
        <ConfiguracoesIA
          configuracoes={configuracoes}
          modelosDisponiveis={MODELOS_CATALOGADOS}
        />
      </Card>

      <Card
        title="Integrações Google"
        subtitle="Base institucional para Agenda jurídica, Google Calendar e Drive Explorer."
      >
        <ConfiguracoesGoogle configuracoes={configuracoes} />
      </Card>

      <Card title="Infraestrutura" subtitle="Configurações sensíveis e operação em produção.">
        <div className="space-y-2 text-sm text-[var(--color-muted)]">
          <p>
            As credenciais de IA (API Keys e Base URLs) podem ser gerenciadas diretamente nesta página e entram
            em vigor imediatamente.
          </p>
          <p>
            A integração Google agora possui base própria para diferenciar OAuth por usuário, service account
            institucional, Agenda e acesso operacional ao Drive.
          </p>
          <p>
            Variáveis de infraestrutura como <span className="font-mono">DATABASE_URL</span> e tokens de storage
            continuam sendo administradas no ambiente de deploy.
          </p>
        </div>
      </Card>
    </div>
  );
}
