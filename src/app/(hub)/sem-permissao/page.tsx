import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import type { ModuloPlataforma } from "@/modules/administracao/domain/types";

const LABEL_MODULO: Record<ModuloPlataforma, string> = {
  dashboard: "Dashboard",
  agenda: "Agenda",
  peticoes: "Petições",
  casos: "Casos",
  documentos: "Documentos",
  biblioteca_juridica: "Biblioteca Jurídica",
  contratos: "Contratos",
  jurisprudencia: "Jurisprudência",
  gestao: "Gestão",
  clientes: "Clientes",
  bi: "Business Intelligence",
  administracao: "Administração",
};

type SemPermissaoPageProps = {
  searchParams: Promise<{ modulo?: string; de?: string }>;
};

export default async function SemPermissaoPage({ searchParams }: SemPermissaoPageProps) {
  const { modulo, de } = await searchParams;
  const labelModulo = modulo ? (LABEL_MODULO[modulo as ModuloPlataforma] ?? modulo) : "este módulo";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acesso não permitido"
        description="Seu perfil não tem permissão para acessar este módulo."
      />

      <Card title="Permissão insuficiente" subtitle="Entre em contato com o administrador para solicitar acesso.">
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">
              🔒 Acesso negado ao módulo <strong>{labelModulo}</strong>
            </p>
            {de && (
              <p className="mt-1 text-xs text-rose-600 font-mono">
                Rota solicitada: {de}
              </p>
            )}
          </div>

          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Seu perfil de acesso atual não inclui permissão para o módulo <strong>{labelModulo}</strong>.
            Se você acredita que deveria ter acesso, solicite ao administrador do sistema que atualize suas permissões.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
            >
              Ir para o Dashboard
            </Link>
            <Link
              href="/administracao/permissoes"
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-hover)]"
            >
              Ver matriz de permissões
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
