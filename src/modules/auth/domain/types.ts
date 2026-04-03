export type PerfilUsuario =
  | "Sócio / Direção"
  | "Coordenador Jurídico"
  | "Advogado"
  | "Estagiário / Assistente"
  | "Operacional / Administrativo"
  | "Administrador do sistema";

/** @deprecated Use Sessao instead */
export interface SessaoMock {
  usuarioId: string;
  nome: string;
  iniciais: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface Sessao {
  usuarioId: string;
  nome: string;
  email: string;
  iniciais: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

