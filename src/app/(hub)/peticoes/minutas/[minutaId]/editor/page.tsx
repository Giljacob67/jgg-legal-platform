import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScaleIcon } from "@/components/ui/icons";
import { obterEditorMinutaOperacional } from "@/modules/peticoes/application/operacional/obterEditorMinutaOperacional";
import { EditorMinuta } from "@/modules/peticoes/ui/editor-minuta";

type EditorMinutaPageProps = {
  params: Promise<{ minutaId: string }>;
};

export default async function EditorMinutaPage({ params }: EditorMinutaPageProps) {
  const { minutaId } = await params;
  let editorData: Awaited<ReturnType<typeof obterEditorMinutaOperacional>> | null = null;
  let erroCarregamento: string | null = null;

  try {
    editorData = await obterEditorMinutaOperacional(minutaId);
  } catch (error) {
    erroCarregamento = error instanceof Error ? error.message : "Falha inesperada ao carregar editor.";
    if (process.env.NODE_ENV === "development") {
      console.error("[peticoes][editor-page] Falha ao carregar editor de minuta.", {
        minutaId,
        erro: error,
      });
    }
  }

  const minuta = editorData?.minuta;

  if (!minuta) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Editor de Minuta"
          description={`Minuta ${minutaId} não disponível no momento.`}
        />
        <Card title="Estado vazio do editor" subtitle="Não foi possível carregar os dados da minuta.">
          <p className="text-sm text-[var(--color-muted)]">
            Verifique se o pedido/minuta existe e se o contexto operacional está sincronizado.
          </p>
          {erroCarregamento ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Detalhe técnico: {erroCarregamento}
            </p>
          ) : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editor de Minuta"
        description={`${minuta.id} • ${minuta.titulo}`}
        meta={
          <>
            <StatusBadge label={`${minuta.versoes.length} versões`} variant="neutro" />
            <StatusBadge
              label={`contexto v${editorData?.versaoContextoAtual ?? "n/d"}`}
              variant={editorData?.versaoContextoAtual ? "sucesso" : "alerta"}
            />
          </>
        }
        actions={
          editorData?.pedidoId ? (
            <ButtonLink
              href={`/peticoes/pipeline/${editorData.pedidoId}`}
              label="Abrir pipeline"
              icon={<ScaleIcon size={16} />}
              variant="secundario"
            />
          ) : undefined
        }
      />
      <EditorMinuta
        minuta={minuta}
        pedidoId={editorData?.pedidoId}
        contextoJuridico={editorData?.contextoJuridico ?? null}
        versaoContextoAtual={editorData?.versaoContextoAtual}
        rastroGeracaoAtual={editorData?.rastroGeracaoAtual}
        inteligenciaJuridica={editorData?.inteligenciaJuridica ?? null}
      />
    </div>
  );
}
