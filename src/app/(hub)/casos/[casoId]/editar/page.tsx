import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { obterCasoPorId } from "@/modules/casos/application/obterCasoPorId";
import { FormEditarCaso } from "@/modules/casos/ui/form-editar-caso";

type EditarCasoPageProps = {
  params: Promise<{ casoId: string }>;
};

export default async function EditarCasoPage({ params }: EditarCasoPageProps) {
  const { casoId } = await params;
  const caso = await obterCasoPorId(casoId);

  if (!caso) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar caso"
        description={`Editando ${caso.id} — ${caso.titulo}`}
      />
      <FormEditarCaso caso={caso} />
    </div>
  );
}