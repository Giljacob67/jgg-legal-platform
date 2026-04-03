import { PageHeader } from "@/components/ui/page-header";
import { FormNovoContrato } from "@/modules/contratos/ui/form-novo-contrato";

export default function NovoContratoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Novo Contrato" description="Crie um contrato com cláusulas padrão pré-preenchidas conforme o tipo selecionado." />
      <FormNovoContrato />
    </div>
  );
}
