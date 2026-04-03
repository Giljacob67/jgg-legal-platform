import type { Usuario, ConviteUsuario, PerfilUsuario, RegistroAuditoria, ConfiguracaoSistema } from "../domain/types";

export interface IAdministracaoRepository {
  listarUsuarios(): Promise<Usuario[]>;
  obterUsuarioPorId(id: string): Promise<Usuario | null>;
  convidarUsuario(convite: ConviteUsuario): Promise<Usuario>;
  atualizarPerfil(id: string, perfil: PerfilUsuario): Promise<Usuario>;
  ativarDesativar(id: string, ativo: boolean): Promise<Usuario>;
  listarAuditoria(limite?: number): Promise<RegistroAuditoria[]>;
  obterConfiguracoes(): Promise<ConfiguracaoSistema[]>;
  atualizarConfiguracao(chave: string, valor: string): Promise<void>;
}
