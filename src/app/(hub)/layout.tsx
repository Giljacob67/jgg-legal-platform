import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { listarModulosNavegacao } from "@/modules/hub/application/listarModulosNavegacao";
import type { Sessao } from "@/modules/auth/domain/types";
import { LABEL_PERFIL, resolverPerfilUsuario } from "@/modules/administracao/domain/types";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const perfilKey = resolverPerfilUsuario(session.user.role as string);
  const sessao: Sessao = {
    usuarioId: session.user.id,
    nome: session.user.name ?? "Usuário",
    email: session.user.email ?? "",
    iniciais: session.user.initials ?? "??",
    perfil: LABEL_PERFIL[perfilKey] ?? session.user.role ?? "Advogado",
    ativo: true,
  };

  const modulos = listarModulosNavegacao();

  return (
    <AppShell modulos={modulos} sessao={sessao}>
      {children}
    </AppShell>
  );
}

