"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";
import { cn } from "@/lib/utils";

export function MobileNav({ modulos }: { modulos: ModuloNavegacao[] }) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] bg-white px-4 py-2">
        {modulos.map((modulo) => {
          const ativo = pathname === modulo.rota || pathname.startsWith(`${modulo.rota}/`);
          return (
            <Link
              key={modulo.id}
              href={modulo.rota}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                ativo
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-ink)]",
              )}
            >
              <span className="mr-1">{modulo.icone}</span>{modulo.nome}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
