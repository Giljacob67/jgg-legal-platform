import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { BuildingIcon, ChevronRightIcon, SettingsIcon, ShieldCheckIcon, UsersIcon } from "@/components/ui/icons";
import { listarUsuarios, listarAuditoria, obterConfiguracoes } from "@/modules/administracao/application";
import { LABEL_PERFIL, resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import { auth } from "@/lib/auth";
import Link from "next/link";

const PERFIS_ADMIN = ["administrador_sistema", "socio_direcao"];

export default async function AdministracaoPage() {
  const session = await auth();
  const perfil = resolverPerfilUsuario(session?.user?.role as string | undefined);
  if (!PERFIS_ADMIN.includes(perfil)) redirect("/sem-permissao");

  const [usuarios, auditoria, configuracoes] = await Promise.all([
    listarUsuarios(),
    listarAuditoria(5),
    obterConfiguracoes(),
  ]);

  const ativos = usuarios.filter((u) => u.ativo).length;
  const provedor = configuracoes.find((c) => c.chave === "ai_provider")?.valor ?? "openai";
  const modelo = configuracoes.find((c) => c.chave === "ai_model")?.valor ?? "gpt-4o-mini";

  const LABEL_PROVEDOR: Record<string, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    kilocode: "KiloCode",
    anthropic: "Anthropic",
    google: "Google AI",
    groq: "Groq",
    xai: "xAI",
    mistral: "Mistral AI",
    ollama: "Ollama",
    custom: "Custom",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        description="Configurações da plataforma, perfis de acesso e governança."
        meta={
          <>
            <StatusBadge label={`${ativos} usuários ativos`} variant="sucesso" />
            <StatusBadge label={LABEL_PROVEDOR[provedor] ?? provedor} variant="neutro" />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Usuários ativos" subtitle={`${ativos} de ${usuarios.length}`} eyebrow="Governança">
          <p className="font-serif text-4xl text-[var(--color-ink)]">{ativos}</p>
        </Card>
        <Card title="Provedor de IA" subtitle="Gateway configurado" eyebrow="Infraestrutura">
          <p className="text-lg font-bold text-[var(--color-accent)]">{LABEL_PROVEDOR[provedor] ?? provedor}</p>
          <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">{modelo}</p>
        </Card>
        <Card title="Perfis cadastrados" subtitle="Distribuição de acesso" eyebrow="Perfis">
          <div className="space-y-1">
            {Object.entries(
              usuarios.reduce<Record<string, number>>((acc, u) => {
                acc[u.perfil] = (acc[u.perfil] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([perfil, count]) => (
              <div key={perfil} className="flex justify-between text-xs">
                <span className="text-[var(--color-muted)]">{LABEL_PERFIL[perfil as keyof typeof LABEL_PERFIL]}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/administracao/usuarios", icon: UsersIcon, titulo: "Usuários", desc: "Gerenciar equipe e perfis de acesso" },
          { href: "/administracao/permissoes", icon: ShieldCheckIcon, titulo: "Permissões", desc: "Matriz de acesso por módulo" },
          { href: "/administracao/configuracoes", icon: SettingsIcon, titulo: "Configurações", desc: "Provedor de IA, tema e preferências" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 rounded-[1.45rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-accent)]">
              <item.icon size={18} />
            </span>
            <p className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">{item.titulo}</p>
            <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
            <ChevronRightIcon size={16} className="mt-auto text-[var(--color-muted)]" />
          </Link>
        ))}
      </div>

      <Card title="Auditoria recente" subtitle="Últimas ações administrativas" eyebrow="Rastreabilidade">
        {auditoria.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Nenhuma ação registrada.</p>
        ) : (
          <div className="space-y-2">
            {auditoria.map((reg) => (
              <div key={reg.id} className="flex items-start gap-3 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-accent)]">
                  <BuildingIcon size={16} />
                </span>
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{reg.userNome}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {reg.acao.replace(/_/g, " ")} —{" "}
                    {new Date(reg.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
