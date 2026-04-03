import { MockAdministracaoRepository } from "../infrastructure/mockAdministracaoRepository";
import type { IAdministracaoRepository } from "../domain/IAdministracaoRepository";

let _repo: IAdministracaoRepository | null = null;

function getRepo(): IAdministracaoRepository {
  if (!_repo) {
    // Em produção, trocar por PostgresAdministracaoRepository
    _repo = new MockAdministracaoRepository();
  }
  return _repo;
}

export const listarUsuarios = () => getRepo().listarUsuarios();
export const obterUsuarioPorId = (id: string) => getRepo().obterUsuarioPorId(id);
export const convidarUsuario = (convite: Parameters<IAdministracaoRepository["convidarUsuario"]>[0]) => getRepo().convidarUsuario(convite);
export const atualizarPerfilUsuario = (id: string, perfil: Parameters<IAdministracaoRepository["atualizarPerfil"]>[1]) => getRepo().atualizarPerfil(id, perfil);
export const ativarDesativarUsuario = (id: string, ativo: boolean) => getRepo().ativarDesativar(id, ativo);
export const listarAuditoria = (limite?: number) => getRepo().listarAuditoria(limite);
export const obterConfiguracoes = () => getRepo().obterConfiguracoes();
export const atualizarConfiguracao = (chave: string, valor: string) => getRepo().atualizarConfiguracao(chave, valor);
