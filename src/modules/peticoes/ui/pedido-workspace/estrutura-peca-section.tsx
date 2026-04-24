"use client";

import { EstruturaPecaPanel } from "@/modules/peticoes/ui/estrutura-peca-panel";
import type { PedidoWorkspaceData } from "./types";

type EstruturaPecaSectionProps = Pick<PedidoWorkspaceData, "contextoAtual">;

export function EstruturaPecaSection({ contextoAtual }: EstruturaPecaSectionProps) {
  return (
    <EstruturaPecaPanel
      contextoAtual={contextoAtual}
    />
  );
}
