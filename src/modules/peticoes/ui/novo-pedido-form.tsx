import type { Caso } from "@/modules/casos/domain/types";
import type { TipoPeca } from "@/modules/peticoes/domain/types";
import { NovoPedidoWizard } from "@/modules/peticoes/novo-pedido/ui/novo-pedido-wizard";

type NovoPedidoFormProps = {
  tiposPeca: TipoPeca[];
  casos: Caso[];
};

export function NovoPedidoForm({ tiposPeca, casos }: NovoPedidoFormProps) {
  return <NovoPedidoWizard tiposPeca={tiposPeca} casos={casos} />;
}
