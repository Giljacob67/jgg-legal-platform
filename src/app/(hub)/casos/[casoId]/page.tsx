import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterCasoPorId } from "@/modules/casos/application/obterCasoPorId";
import { listarDocumentosPorCaso } from "@/modules/documentos/application/listarDocumentosPorCaso";
import { formatarData, formatarDataHora } from "@/lib/utils";

type CasoDetalhePageProps = {
  params: Promise<{ casoId: string }>;
};

export default async function CasoDetalhePage({ params }: CasoDetalhePageProps) {
  const { casoId } = await params;
  const caso = await obterCasoPorId(casoId);

  if (!caso) {
    notFound();
  }

  const documentos = await listarDocumentosPorCaso(caso.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={caso.titulo}
        description={`Caso ${caso.id} • ${caso.materia} • ${caso.tribunal}`}
        actions={<StatusBadge label={caso.status} variant="implantacao" />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card title="Resumo do caso">
          <p className="text-sm text-[var(--color-muted)]">{caso.resumo}</p>
          <div className="grid gap-2 pt-2 text-sm text-[var(--color-ink)]">
            <p>
              <strong>Cliente:</strong> {caso.cliente}
            </p>
            <p>
              <strong>Prazo final:</strong> {formatarData(caso.prazoFinal)}
            </p>
          </div>
        </Card>

        <Card title="Partes envolvidas">
          {caso.partes.map((parte) => (
            <article key={`${parte.nome}-${parte.papel}`} className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="font-semibold text-[var(--color-ink)]">{parte.nome}</p>
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{parte.papel}</p>
            </article>
          ))}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card title="Documentos relacionados">
          {documentos.map((documento) => (
            <article key={documento.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="font-semibold text-[var(--color-ink)]">{documento.titulo}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {documento.tipo} • {documento.status}
              </p>
            </article>
          ))}
        </Card>

        <Card title="Eventos e trilha">
          {caso.eventos.map((evento) => (
            <article key={evento.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="font-semibold text-[var(--color-ink)]">{evento.descricao}</p>
              <p className="text-xs text-[var(--color-muted)]">{formatarDataHora(evento.data)}</p>
            </article>
          ))}
        </Card>
      </section>

      <Card title="Ações rápidas">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/peticoes/novo"
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-alt)]"
          >
            Criar pedido de peça
          </Link>
          <Link
            href="/documentos"
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-alt)]"
          >
            Ver documentos
          </Link>
        </div>
      </Card>
    </div>
  );
}
