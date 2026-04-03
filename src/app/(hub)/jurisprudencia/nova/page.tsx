import { PageHeader } from "@/components/ui/page-header";
import { FormNovaJurisprudencia } from "@/modules/jurisprudencia/ui/form-nova-jurisprudencia";

export default function NovaJurisprudenciaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nova Jurisprudência" description="Inclua uma decisão para fortalecer a base de precedentes e teses do escritório." />
      <FormNovaJurisprudencia />
    </div>
  );
}
