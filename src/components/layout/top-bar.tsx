"use client";

import { usePathname } from "next/navigation";
import type { SessaoMock } from "@/modules/auth/domain/types";

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

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-page)]/90 px-5 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Operação jurídica</p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">{breadcrumbs.join(" / ") || "Dashboard"}</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">
            {sessao.iniciais}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">{sessao.nome}</p>
            <p className="text-xs text-[var(--color-muted)]">{sessao.perfil}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
