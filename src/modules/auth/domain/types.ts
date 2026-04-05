// PerfilUsuario e Sessao consolidados em administracao/domain/types.ts
// Re-exportados aqui para compatibilidade com imports existentes.
export type { PerfilUsuario, Sessao } from "@/modules/administracao/domain/types";

/** @deprecated Use Sessao instead */
export interface SessaoMock {
  usuarioId: string;
  nome: string;
  iniciais: string;
  perfil: string;
  ativo: boolean;
}
