import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { listarUsuarios, obterConfiguracoes } from "@/modules/administracao/application";
import { LABEL_PERFIL } from "@/modules/administracao/domain/types";
import { listAuditLog } from "@/lib/security/audit-log";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";

export default async function AdministracaoPage() {
  const [usuarios, auditoriaRecente, configuracoes] = await Promise.all([
    listarUsuarios(),
    listAuditLog({ limit: 5 }),
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        description="Configurações da plataforma, perfis de acesso e governança."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Usuários ativos" subtitle={`${ativos} de ${usuarios.length}`}>
          <p className="text-3xl font-bold text-[var(--color-ink)]">{ativos}</p>
        </Card>
        <Card title="Provedor de IA" subtitle="Gateway configurado">
          <p className="text-lg font-bold text-violet-700">{LABEL_PROVEDOR[provedor] ?? provedor}</p>
          <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">{modelo}</p>
        </Card>
        <Card title="Perfis cadastrados" subtitle="Distribuição de acesso">
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

      {/* Ações rápidas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/administracao/usuarios", emoji: "👥", titulo: "Usuários", desc: "Gerenciar equipe e perfis de acesso" },
          { href: "/administracao/permissoes", emoji: "🔐", titulo: "Permissões", desc: "Matriz de acesso por módulo" },
          { href: "/administracao/configuracoes", emoji: "⚙️", titulo: "Configurações", desc: "Provedor de IA, tema e preferências" },
          { href: "/administracao/auditoria", emoji: "🧾", titulo: "Auditoria", desc: "Trilha completa com filtros e inspeção de eventos" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition hover:border-[var(--color-accent)] hover:shadow-sm"
          >
            <span className="text-2xl">{item.emoji}</span>
            <p className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">{item.titulo}</p>
            <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Auditoria recente */}
      <Card title="Auditoria recente" subtitle="Últimos eventos do log de segurança operacional.">
        {auditoriaRecente.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Nenhum evento registrado.</p>
        ) : (
          <div className="space-y-3">
            {auditoriaRecente.map((reg) => (
              <div key={reg.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{reg.userEmail ?? reg.userId}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {reg.action} • {reg.resource}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {new Date(reg.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <StatusBadge
                  label={reg.result}
                  variant={reg.result === "success" ? "sucesso" : reg.result === "error" ? "alerta" : "neutro"}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link
            href="/administracao/auditoria"
            className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
          >
            Abrir trilha completa
          </Link>
        </div>
      </Card>
    </div>
  );
}
