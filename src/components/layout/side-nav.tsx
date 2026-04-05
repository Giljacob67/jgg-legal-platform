"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuloNavegacao, GrupoModulo } from "@/modules/hub/domain/types";
import { LABEL_GRUPO } from "@/modules/hub/domain/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type SideNavProps = {
  modulos: ModuloNavegacao[];
};

const ORDEM_GRUPOS: GrupoModulo[] = ["producao", "inteligencia", "gestao", "admin"];

export function SideNav({ modulos }: SideNavProps) {
  const pathname = usePathname();

  const modulosPorGrupo = ORDEM_GRUPOS.reduce<Record<GrupoModulo, ModuloNavegacao[]>>(
    (acc, grupo) => {
      acc[grupo] = modulos.filter((m) => m.grupo === grupo);
      return acc;
    },
    { producao: [], inteligencia: [], gestao: [], admin: [] },
  );

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex lg:flex-col">
      {/* Logo / header */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">JGG Group</p>
        <h2 className="mt-1 font-serif text-lg text-[var(--color-ink)]">Plataforma Jurídica</h2>
      </div>

      {/* Navigation groups */}
      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto">
        {ORDEM_GRUPOS.map((grupo) => {
          const items = modulosPorGrupo[grupo];
          if (items.length === 0) return null;

          return (
            <div key={grupo}>
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {LABEL_GRUPO[grupo]}
              </p>
              <div className="space-y-1">
                {items.map((modulo) => {
                  const ativo = pathname === modulo.rota || pathname.startsWith(`${modulo.rota}/`);
                  const naoAtivo = modulo.status !== "ativo";

                  return (
                    <Link
                      key={modulo.id}
                      href={modulo.rota}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                        ativo
                          ? "border-[var(--color-accent)] bg-[var(--color-card)] shadow-sm"
                          : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-card)]",
                      )}
                    >
                      <span className="text-base leading-none">{modulo.icone}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-sm font-semibold truncate",
                            ativo ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]",
                          )}>
                            {modulo.nome}
                          </p>
                          {/* Só mostra badge para módulos não-ativos */}
                          {naoAtivo && (
                            <StatusBadge
                              label={modulo.status}
                              variant={modulo.status === "em implantação" ? "implantacao" : "planejado"}
                            />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-tight text-[var(--color-muted)] truncate">
                          {modulo.resumo}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
