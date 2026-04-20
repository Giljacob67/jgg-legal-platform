"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuloNavegacao, GrupoModulo } from "@/modules/hub/domain/types";
import { LABEL_GRUPO } from "@/modules/hub/domain/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronRightIcon, ModuleIcon, SparkIcon } from "@/components/ui/icons";
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
    <aside className="hidden w-[312px] shrink-0 border-r border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,var(--color-shell)_0%,var(--color-shell-strong)_100%)] p-4 text-white lg:flex lg:flex-col">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[var(--shadow-shell)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-shell-muted)]">JGG Advocacia</p>
            <h2 className="mt-2 font-serif text-[1.45rem] leading-tight text-white">Plataforma Jurídica</h2>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/8 text-[#d8e6f2]">
            <SparkIcon size={18} />
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--color-shell-muted)]">
          Ambiente unificado para produção jurídica, governança operacional e inteligência aplicada.
        </p>
      </div>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
        {ORDEM_GRUPOS.map((grupo) => {
          const items = modulosPorGrupo[grupo];
          if (items.length === 0) return null;

          return (
            <div key={grupo}>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-shell-muted)]">
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
                        "group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition",
                        ativo
                          ? "border-white/12 bg-white text-white shadow-[var(--shadow-card)]"
                          : "border-transparent bg-transparent text-white/90 hover:border-white/10 hover:bg-white/6",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition",
                          ativo
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                            : "border-white/10 bg-white/6 text-[#d6e1eb] group-hover:border-white/20",
                        )}
                      >
                        <ModuleIcon moduloId={modulo.id} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "truncate text-sm font-semibold",
                            ativo ? "text-[var(--color-shell)]" : "text-white",
                          )}>
                            {modulo.nome}
                          </p>
                          {naoAtivo && (
                            <StatusBadge
                              label={modulo.status}
                              variant={modulo.status === "em implantação" ? "implantacao" : "planejado"}
                            />
                          )}
                        </div>
                        <p className={cn("mt-1 truncate text-[11px] leading-tight", ativo ? "text-[var(--color-muted)]" : "text-[var(--color-shell-muted)]")}>
                          {modulo.resumo}
                        </p>
                      </div>
                      <ChevronRightIcon
                        size={16}
                        className={cn(ativo ? "text-[var(--color-muted)]" : "text-[var(--color-shell-muted)]")}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-shell-muted)]">Padrão Operacional</p>
        <p className="mt-2 text-sm leading-6 text-[#dce6ef]">
          Shell visual consolidado para filas, documentos, revisão técnica e governança jurídica.
        </p>
      </div>
    </aside>
  );
}
