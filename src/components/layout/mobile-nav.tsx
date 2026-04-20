"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";
import { ModuleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function MobileNav({ modulos }: { modulos: ModuloNavegacao[] }) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-card)] px-4 py-3">
        {modulos.map((modulo) => {
          const ativo = pathname === modulo.rota || pathname.startsWith(`${modulo.rota}/`);
          return (
            <Link
              key={modulo.id}
              href={modulo.rota}
              className={cn(
                "inline-flex whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold",
                ativo
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-card-strong)] text-[var(--color-ink)]",
              )}
            >
              <span className="mr-1.5"><ModuleIcon moduloId={modulo.id} size={14} /></span>
              {modulo.nome}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
