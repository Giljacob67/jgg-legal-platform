import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listarResumoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";
import { AtivosJuridicosLista } from "@/modules/peticoes/base-juridica-viva/ui/ativos-juridicos-lista";

export default async function BaseJuridicaPage() {
  const { templates, teses, checklists } = await listarResumoBaseJuridica();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base Jurídica Viva"
        description="Gestão interna de templates, teses e checklists jurídicos versionados."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Templates">
          <p className="text-sm text-[var(--color-muted)]">{templates.length} versão(ões) registrada(s).</p>
        </Card>
        <Card title="Teses">
          <p className="text-sm text-[var(--color-muted)]">{teses.length} versão(ões) registrada(s).</p>
        </Card>
        <Card title="Checklists">
          <p className="text-sm text-[var(--color-muted)]">{checklists.length} versão(ões) registrada(s).</p>
        </Card>
      </section>

      <Card title="Templates jurídicos versionados" subtitle="Associados por tipo de peça, matéria, status e versão.">
        <AtivosJuridicosLista tipo="templates" itens={templates} />
      </Card>

      <Card title="Teses jurídicas versionadas" subtitle="Catálogo vivo para recomendação e aderência jurídica.">
        <AtivosJuridicosLista tipo="teses" itens={teses} />
      </Card>

      <Card title="Checklists jurídicos versionados" subtitle="Itens obrigatórios e recomendáveis para validação da minuta.">
        <AtivosJuridicosLista tipo="checklists" itens={checklists} />
      </Card>
    </div>
  );
}
