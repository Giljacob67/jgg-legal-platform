import { PageHeader } from "@/components/ui/page-header";
import { listarTiposPeca } from "@/modules/peticoes/application/listarTiposPeca";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { NovoPedidoForm } from "@/modules/peticoes/ui/novo-pedido-form";

export default async function NovoPedidoPage() {
  const [tiposPeca, casos] = await Promise.all([
    listarTiposPeca(),
    listarCasos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Pedido de Peça"
        description="Abra um pedido com fluxo guiado, validação progressiva e confirmação humana antes da criação final."
      />
      <NovoPedidoForm tiposPeca={tiposPeca} casos={casos} />
    </div>
  );
}
