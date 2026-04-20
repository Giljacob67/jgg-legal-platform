import type { ReactNode } from "react";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";
import type { Sessao, SessaoMock } from "@/modules/auth/domain/types";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

type AppShellProps = {
  modulos: ModuloNavegacao[];
  sessao: Sessao | SessaoMock;
  children: ReactNode;
};

export function AppShell({ modulos, sessao, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <SideNav modulos={modulos} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar sessao={sessao} />
        <MobileNav modulos={modulos} />
        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
