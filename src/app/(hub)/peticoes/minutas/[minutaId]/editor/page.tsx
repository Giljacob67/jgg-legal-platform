import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { obterMinutaPorId } from "@/modules/peticoes/application/obterMinutaPorId";
import { EditorMinuta } from "@/modules/peticoes/ui/editor-minuta";

type EditorMinutaPageProps = {
  params: Promise<{ minutaId: string }>;
};

export default async function EditorMinutaPage({ params }: EditorMinutaPageProps) {
  const { minutaId } = await params;
  const minuta = obterMinutaPorId(minutaId);

  if (!minuta) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor de Minuta"
        description={`${minuta.id} • ${minuta.titulo}`}
      />
      <EditorMinuta minuta={minuta} />
    </div>
  );
}
