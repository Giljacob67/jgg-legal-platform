// PerfilUsuario consolidado em administracao/domain/types.ts
// Re-exportado aqui para compatibilidade com imports existentes.
export type { PerfilUsuario } from "@/modules/administracao/domain/types";

import type { PerfilUsuario } from "@/modules/administracao/domain/types";

export interface Sessao {
  usuarioId: string;
  nome: string;
  email: string;
  iniciais: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

/** @deprecated Use Sessao instead */
export interface SessaoMock {
  usuarioId: string;
  nome: string;
  iniciais: string;
  perfil: string;
  ativo: boolean;
}
