"use client";

import type { PerfilUsuario } from "@/modules/administracao/domain/types";

type PermissionGateProps = {
  /** Perfil atual do usuário (vindo da sessão). */
  perfil: PerfilUsuario | string | undefined | null;
  /** Perfis autorizados a ver o conteúdo. */
  allowedRoles: PerfilUsuario[];
  /** Conteúdo a renderizar se autorizado. */
  children: React.ReactNode;
  /** Conteúdo alternativo para usuários sem permissão. Opcional. */
  fallback?: React.ReactNode;
};

/**
 * Oculta o conteúdo para usuários sem o perfil necessário.
 * É um guard puramente visual — a autorização real ocorre no servidor (requireRole).
 *
 * Uso:
 *   <PermissionGate perfil={session.user.role} allowedRoles={["coordenador_juridico", "socio_direcao"]}>
 *     <BotaoAprovar />
 *   </PermissionGate>
 */
export function PermissionGate({
  perfil,
  allowedRoles,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (!perfil || !allowedRoles.includes(perfil as PerfilUsuario)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
