"use client";

import { usePathname } from "next/navigation";
import type { SessaoMock } from "@/modules/auth/domain/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChevronRightIcon, DashboardIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/status-badge";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  peticoes: "Petições",
  casos: "Casos",
  documentos: "Documentos",
  "biblioteca-juridica": "Biblioteca Jurídica",
  contratos: "Contratos",
  jurisprudencia: "Jurisprudência",
  gestao: "Gestão",
  clientes: "Clientes",
  bi: "BI",
  administracao: "Administração",
  novo: "Novo Pedido",
  pipeline: "Pipeline",
  pedidos: "Pedido",
  minutas: "Minutas",
  editor: "Editor",
};

function formatarSegmento(segmento: string): string {
  if (
    segmento.startsWith("CAS-") ||
    segmento.startsWith("PED-") ||
    segmento.startsWith("MIN-") ||
    segmento.startsWith("CTR-") ||
    segmento.startsWith("JD-") ||
    segmento.startsWith("CLI-")
  ) {
    return segmento;
  }

  return labels[segmento] ?? segmento.replace(/-/g, " ");
}

export function TopBar({ sessao }: { sessao: SessaoMock }) {
  const pathname = usePathname();
  const breadcrumbs = pathname.split("/").filter(Boolean).map(formatarSegmento);
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-page)_88%,white)]/92 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-strong)]">
            <span>Hub jurídico</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
            <span>{hoje}</span>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="grid h-8 w-8 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-accent)]">
              <DashboardIcon size={15} />
            </span>
            {(breadcrumbs.length > 0 ? breadcrumbs : ["Dashboard"]).map((item, index, arr) => (
              <div key={`${item}-${index}`} className="flex items-center gap-2">
                <span className={index === arr.length - 1 ? "font-semibold text-[var(--color-ink)]" : ""}>{item}</span>
                {index < arr.length - 1 ? <ChevronRightIcon size={14} /> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label={sessao.perfil.replace(/_/g, " ")} variant="neutro" />
          <ThemeToggle />
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-[var(--shadow-card)]">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] text-xs font-bold text-white">
              {sessao.iniciais}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{sessao.nome}</p>
              <p className="text-xs text-[var(--color-muted)]">{sessao.perfil.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
