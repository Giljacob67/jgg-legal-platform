import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { ModuloPlataforma, NivelAcesso, PerfilUsuario } from "@/modules/administracao/domain/types";
import { PERMISSOES_PADRAO, resolverPerfilUsuario } from "@/modules/administracao/domain/types";
import { apiError } from "@/lib/api-response";

export type PermissaoAcao = "read" | "write" | "execute" | "delete" | "admin";
export type EscopoRecurso = "global" | "portfolio" | "owner";

const ORDEM_NIVEL: Record<NivelAcesso, number> = {
  sem_acesso: 0,
  leitura: 1,
  edicao: 2,
  total: 3,
};

const NIVEL_MINIMO_POR_ACAO: Record<PermissaoAcao, NivelAcesso> = {
  read: "leitura",
  write: "edicao",
  execute: "edicao",
  delete: "total",
  admin: "total",
};

export function resolverPerfilDaSessao(session: Session): PerfilUsuario {
  return resolverPerfilUsuario(session.user.role as string | undefined | null);
}

export function isPerfilPrivilegiado(perfil: PerfilUsuario): boolean {
  return perfil === "socio_direcao" || perfil === "coordenador_juridico" || perfil === "administrador_sistema";
}

export function hasPermission(input: {
  perfil: PerfilUsuario;
  modulo: ModuloPlataforma;
  acao: PermissaoAcao;
}): boolean {
  const nivelAtual = PERMISSOES_PADRAO[input.perfil]?.[input.modulo] ?? "sem_acesso";
  const nivelNecessario = NIVEL_MINIMO_POR_ACAO[input.acao];

  return ORDEM_NIVEL[nivelAtual] >= ORDEM_NIVEL[nivelNecessario];
}

export function requirePermission(input: {
  session: Session;
  modulo: ModuloPlataforma;
  acao: PermissaoAcao;
}): NextResponse | null {
  const perfil = resolverPerfilDaSessao(input.session);

  if (!hasPermission({ perfil, modulo: input.modulo, acao: input.acao })) {
    return apiError(
      "FORBIDDEN",
      "Você não tem permissão para executar esta ação.",
      403,
      {
        modulo: input.modulo,
        acao: input.acao,
        perfil,
      },
    );
  }

  return null;
}

export function requireResourceScope(input: {
  session: Session;
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
}): NextResponse | null {
  const perfil = resolverPerfilDaSessao(input.session);
  if (isPerfilPrivilegiado(perfil)) {
    return null;
  }

  const sessionId = input.session.user.id;
  const sessionEmail = input.session.user.email ?? "";
  const sessionName = input.session.user.name ?? "";

  const canAccess =
    (input.ownerUserId && input.ownerUserId === sessionId) ||
    (input.ownerEmail && input.ownerEmail.toLowerCase() === sessionEmail.toLowerCase()) ||
    (input.ownerName && input.ownerName.toLowerCase() === sessionName.toLowerCase());

  if (canAccess) {
    return null;
  }

  return apiError("FORBIDDEN", "Você não tem escopo para acessar este recurso.", 403);
}

export function forbiddenResponse(): NextResponse {
  return apiError("FORBIDDEN", "Acesso negado.", 403);
}
