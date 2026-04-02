import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { obterEditorMinutaOperacional } from "@/modules/peticoes/application/operacional/obterEditorMinutaOperacional";
import { EditorMinuta } from "@/modules/peticoes/ui/editor-minuta";

type EditorMinutaPageProps = {
  params: Promise<{ minutaId: string }>;
};

export default async function EditorMinutaPage({ params }: EditorMinutaPageProps) {
  const { minutaId } = await params;
  const editorData = await obterEditorMinutaOperacional(minutaId).catch(() => null);
  const minuta = editorData?.minuta;

  if (!minuta) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor de Minuta"
        description={`${minuta.id} • ${minuta.titulo}`}
      />
      <EditorMinuta
        minuta={minuta}
        contextoJuridico={editorData?.contextoJuridico ?? null}
        versaoContextoAtual={editorData?.versaoContextoAtual}
      />
    </div>
  );
}
