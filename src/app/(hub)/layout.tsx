import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { obterSessaoMock } from "@/modules/auth/application/obterSessaoMock";
import { listarModulosNavegacao } from "@/modules/hub/application/listarModulosNavegacao";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const sessao = obterSessaoMock();

  if (!sessao) {
    redirect("/acesso-negado");
  }

  const modulos = listarModulosNavegacao();

  return (
    <AppShell modulos={modulos} sessao={sessao}>
      {children}
    </AppShell>
  );
}
