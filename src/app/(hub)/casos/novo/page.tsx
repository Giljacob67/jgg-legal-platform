import { PageHeader } from "@/components/ui/page-header";
import { FormNovoCaso } from "@/modules/casos/ui/form-novo-caso";

export default function NovoCasoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Caso"
        description="Cadastre um caso para iniciar o fluxo de triagem, produção de peças e acompanhamento jurídico."
      />
      <FormNovoCaso />
    </div>
  );
}
