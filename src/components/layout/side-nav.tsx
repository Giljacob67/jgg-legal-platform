"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type SideNavProps = {
  modulos: ModuloNavegacao[];
};

const statusToVariant: Record<ModuloNavegacao["status"], "ativo" | "implantacao" | "planejado"> = {
  ativo: "ativo",
  "em implantação": "implantacao",
  planejado: "planejado",
};

export function SideNav({ modulos }: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[310px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:block">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">HUB JGG Group</p>
        <h2 className="mt-2 font-serif text-xl text-[var(--color-ink)]">Plataforma Jurídica</h2>
      </div>

      <nav className="mt-4 space-y-2">
        {modulos.map((modulo) => {
          const ativo = pathname === modulo.rota || pathname.startsWith(`${modulo.rota}/`);

          return (
            <Link
              key={modulo.id}
              href={modulo.rota}
              className={cn(
                "block rounded-2xl border p-3 transition",
                ativo
                  ? "border-[var(--color-accent)] bg-white shadow-sm"
                  : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{modulo.nome}</p>
                <StatusBadge label={modulo.status} variant={statusToVariant[modulo.status]} />
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{modulo.resumo}</p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
