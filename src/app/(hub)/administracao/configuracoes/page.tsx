import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ConfiguracoesIA } from "@/modules/administracao/ui/configuracoes-ia";
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

      <Card title="Variáveis de ambiente" subtitle="Configurações que requerem redeploy na Vercel.">
        <div className="space-y-2 text-sm text-[var(--color-muted)]">
          <p>As variáveis abaixo são lidas diretamente do ambiente e não podem ser alteradas pela interface:</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {["DATABASE_URL", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "KILO_API_KEY", "AI_PROVIDER", "AI_MODEL", "DATA_MODE"].map((v) => (
              <li key={v} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                {v}
                <span className="text-emerald-600">{process.env[v] ? "✓ configurada" : "— não definida"}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
