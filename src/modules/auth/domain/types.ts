export type PerfilUsuario =
  | "Sócio / Direção"
  | "Coordenador Jurídico"
  | "Advogado"
  | "Estagiário / Assistente"
  | "Operacional / Administrativo"
  | "Administrador do sistema";

export interface SessaoMock {
  usuarioId: string;
  nome: string;
  iniciais: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}
