import { services } from "@/services/container";
import type { ModuloNavegacao } from "@/modules/hub/domain/types";

export function listarModulosNavegacao(): ModuloNavegacao[] {
  return services.modulesRepository.listarModulos();
}
