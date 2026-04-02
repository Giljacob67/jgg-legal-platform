import { services } from "@/services/container";
import type { ItemBibliotecaJuridica, TipoItemBiblioteca } from "@/modules/biblioteca/domain/types";

export function listarItensBiblioteca(): ItemBibliotecaJuridica[] {
  return services.bibliotecaRepository.listarItens();
}

export function listarItensPorTipo(tipo: TipoItemBiblioteca): ItemBibliotecaJuridica[] {
  return services.bibliotecaRepository.listarItens().filter((item) => item.tipo === tipo);
}
