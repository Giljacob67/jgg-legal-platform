import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listarItensPorTipo } from "@/modules/biblioteca/application/listarItensBiblioteca";
import { formatarData } from "@/lib/utils";

const secoes = [
  { tipo: "template" as const, titulo: "Templates" },
  { tipo: "tese" as const, titulo: "Teses" },
  { tipo: "checklist" as const, titulo: "Checklists" },
];

export default function BibliotecaJuridicaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca Jurídica"
        description="Acervo base do MVP com templates, teses e checklists mockados."
      />

      <section className="space-y-6">
        {secoes.map((secao) => {
          const itens = listarItensPorTipo(secao.tipo);

          return (
            <Card key={secao.tipo} title={secao.titulo}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {itens.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                    <p className="font-semibold text-[var(--color-ink)]">{item.titulo}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {item.materia} • atualizado em {formatarData(item.ultimaAtualizacao)}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{item.resumo}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
