import { services } from "@/services/container";

export const excluirContrato = (id: string) =>
  services.contratosRepository.excluirContrato(id);