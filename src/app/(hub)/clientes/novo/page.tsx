import { PageHeader } from "@/components/ui/page-header";
import { FormNovoCliente } from "@/modules/clientes/ui/form-novo-cliente";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo Cliente" description="Cadastre um cliente para centralizar relacionamento, contratos e casos vinculados." />
      <FormNovoCliente />
    </div>
  );
}
