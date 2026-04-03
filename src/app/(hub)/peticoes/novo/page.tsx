import { PageHeader } from "@/components/ui/page-header";
import { listarTiposPeca } from "@/modules/peticoes/application/listarTiposPeca";
import { obterCasoPorId } from "@/modules/casos/application/obterCasoPorId";
import { detectarPoloRepresentado } from "@/modules/casos/domain/types";
import { NovoPedidoForm } from "@/modules/peticoes/ui/novo-pedido-form";

const CASO_ID_PADRAO = "CAS-2026-001";

export default async function NovoPedidoPage() {
  const [tiposPeca, caso] = await Promise.all([
    listarTiposPeca(),
    obterCasoPorId(CASO_ID_PADRAO).catch(() => null),
  ]);

  const poloRepresentado = caso ? detectarPoloRepresentado(caso) : "indefinido";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Pedido de Peça"
        description="Defina o objetivo processual para que o agente saiba o que fazer com o documento."
      />
      <NovoPedidoForm
        tiposPeca={tiposPeca}
        casoIdPadrao={CASO_ID_PADRAO}
        poloRepresentado={poloRepresentado}
        clienteNome={caso?.cliente}
      />
    </div>
  );
}

