import { services } from "@/services/container";
import type { NovoContratoPayload, StatusContrato, Contrato } from "@/modules/contratos/domain/types";

export const listarContratos = (filtros?: { status?: StatusContrato; tipo?: Contrato["tipo"] }) =>
  services.contratosRepository.listar(filtros);

export const obterContratoPorId = (id: string) =>
  services.contratosRepository.obterPorId(id);

export const criarContrato = (payload: NovoContratoPayload) =>
  services.contratosRepository.criar(payload);

export const atualizarStatusContrato = (id: string, status: StatusContrato) =>
  services.contratosRepository.atualizarStatus(id, status);

export const salvarAnaliseRisco = (id: string, analise: Contrato["analiseRisco"]) =>
  services.contratosRepository.salvarAnaliseRisco(id, analise);

export const atualizarConteudoEClausulas = (
  id: string,
  clausulas: import("@/modules/contratos/domain/types").Clausula[],
  conteudoAtual: string,
) => services.contratosRepository.atualizarConteudoEClausulas(id, clausulas, conteudoAtual);
