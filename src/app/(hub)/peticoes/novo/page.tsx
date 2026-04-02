import { PageHeader } from "@/components/ui/page-header";
import { listarTiposPeca } from "@/modules/peticoes/application/listarTiposPeca";
import { NovoPedidoForm } from "@/modules/peticoes/ui/novo-pedido-form";

export default function NovoPedidoPage() {
  const tiposPeca = listarTiposPeca();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Pedido de Peça"
        description="Abertura de demanda para o centro de produção jurídica."
      />
      <NovoPedidoForm tiposPeca={tiposPeca} casoIdPadrao="CAS-2026-001" />
    </div>
  );
}
