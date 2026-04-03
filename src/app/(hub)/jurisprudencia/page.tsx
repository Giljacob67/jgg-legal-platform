import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { BuscadorJurisprudencia } from "@/modules/jurisprudencia/ui/buscador-jurisprudencia";
import { listarJurisprudencias } from "@/modules/jurisprudencia/application";
import Link from "next/link";

export default async function JurisprudenciaPage() {
  const jurisprudencias = await listarJurisprudencias();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title="Jurisprudência"
          description={`${jurisprudencias.length} decisões · Pesquisa assistida em base de precedentes curada.`}
        />
        <Link href="/jurisprudencia/nova" className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]">
          + Adicionar decisão
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "STJ", count: jurisprudencias.filter((j) => j.tribunal === "STJ").length },
          { label: "STF", count: jurisprudencias.filter((j) => j.tribunal === "STF").length },
          { label: "Outros tribunais", count: jurisprudencias.filter((j) => !["STJ","STF"].includes(j.tribunal)).length },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-ink)]">{item.count}</p>
            <p className="text-xs font-medium text-[var(--color-muted)]">{item.label}</p>
          </div>
        ))}
      </div>

      <Card title="Pesquisa jurisprudencial" subtitle="Busca em tempo real por tese, matéria, tribunal ou número do acórdão.">
        <BuscadorJurisprudencia resultadosIniciais={jurisprudencias} />
      </Card>
    </div>
  );
}
