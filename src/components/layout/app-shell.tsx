import type { ReactNode } from "react";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";
import type { SessaoMock } from "@/modules/auth/domain/types";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

type AppShellProps = {
  modulos: ModuloNavegacao[];
  sessao: SessaoMock;
  children: ReactNode;
};

export function AppShell({ modulos, sessao, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <SideNav modulos={modulos} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar sessao={sessao} />
        <MobileNav modulos={modulos} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
