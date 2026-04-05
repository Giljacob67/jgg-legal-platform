import { services } from "@/services/container";
import type { PerfilUsuario } from "@/modules/administracao/domain/types";

export const listarUsuarios = () => services.administracaoRepository.listarUsuarios();
export const obterUsuarioPorId = (id: string) => services.administracaoRepository.obterUsuarioPorId(id);
export const convidarUsuario = (convite: Parameters<typeof services.administracaoRepository.convidarUsuario>[0]) =>
  services.administracaoRepository.convidarUsuario(convite);
export const atualizarPerfilUsuario = (id: string, perfil: PerfilUsuario) =>
  services.administracaoRepository.atualizarPerfil(id, perfil);
export const ativarDesativarUsuario = (id: string, ativo: boolean) =>
  services.administracaoRepository.ativarDesativar(id, ativo);
export const listarAuditoria = (limite?: number) =>
  services.administracaoRepository.listarAuditoria(limite);
export const obterConfiguracoes = () => services.administracaoRepository.obterConfiguracoes();
export const atualizarConfiguracao = (chave: string, valor: string) =>
  services.administracaoRepository.atualizarConfiguracao(chave, valor);
