import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { obterJurisprudenciaPorId } from "@/modules/jurisprudencia/application";
import { LABEL_TIPO_DECISAO } from "@/modules/jurisprudencia/domain/types";
import Link from "next/link";

type Params = { params: Promise<{ jdId: string }> };

export default async function JurisprudenciaDetalhe({ params }: Params) {
  const { jdId } = await params;
  const j = await obterJurisprudenciaPorId(jdId);
  if (!j) notFound();

  const relevanciaStars = "★".repeat(j.relevancia) + "☆".repeat(5 - j.relevancia);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-800">{j.tribunal}</span>
            <span className="text-xs text-[var(--color-muted)]">{LABEL_TIPO_DECISAO[j.tipo]}</span>
            {j.dataJulgamento && <span className="text-xs text-[var(--color-muted)]">{new Date(j.dataJulgamento).toLocaleDateString("pt-BR")}</span>}
            <span className="text-amber-500 text-xs">{relevanciaStars}</span>
          </div>
          <PageHeader title={j.titulo} description={j.relator ? `Rel. ${j.relator}` : ""} />
        </div>
        <Link href="/jurisprudencia" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">← Voltar</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-6">
          {/* Tese */}
          {j.tese && (
            <Card title="Tese jurídica" subtitle="">
              <p className="text-sm text-[var(--color-ink)] leading-relaxed border-l-4 border-violet-400 pl-4">{j.tese}</p>
            </Card>
          )}

          {/* Ementa resumida */}
          {j.ementaResumida && (
            <Card title="Resumo (IA)" subtitle="Síntese gerada automaticamente">
              <p className="text-sm text-[var(--color-ink)] leading-relaxed">{j.ementaResumida}</p>
            </Card>
          )}

          {/* Ementa completa */}
          <Card title="Ementa completa" subtitle="">
            <p className="whitespace-pre-wrap text-sm text-[var(--color-muted)] leading-relaxed">{j.ementa}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Metadados" subtitle="">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Matérias</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {j.materias.map((m) => (
                    <span key={m} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs">{m}</span>
                  ))}
                </div>
              </div>
              {j.fundamentosLegais.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Fundamentos legais</p>
                  <ul className="mt-1 space-y-0.5">
                    {j.fundamentosLegais.map((f) => (
                      <li key={f} className="text-xs text-[var(--color-ink)]">• {f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {j.urlOrigem && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Fonte</p>
                  <a href={j.urlOrigem} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">Ver decisão original →</a>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Relevância</p>
                <p className="text-amber-500">{relevanciaStars} <span className="text-[var(--color-muted)] text-xs">({j.relevancia}/5)</span></p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
