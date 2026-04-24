"use client";

import { MapaTesesPanel } from "@/modules/peticoes/ui/mapa-teses-panel";
import type { PedidoWorkspaceData } from "./types";

type TesesSectionProps = Pick<PedidoWorkspaceData, "pedido" | "contextoAtual">;

export function TesesSection({ pedido, contextoAtual }: TesesSectionProps) {
  return (
    <MapaTesesPanel
      pedidoId={pedido.id}
      contextoAtual={contextoAtual}
    />
  );
}
