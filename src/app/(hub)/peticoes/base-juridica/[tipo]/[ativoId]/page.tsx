import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { obterAtivoBaseJuridicaPorId, type TipoGestaoBaseJuridica } from "@/modules/peticoes/base-juridica-viva/application/useCases";

type BaseJuridicaDetalhePageProps = {
  params: Promise<{ tipo: string; ativoId: string }>;
};

function tipoValido(tipo: string): tipo is TipoGestaoBaseJuridica {
  return tipo === "templates" || tipo === "teses" || tipo === "checklists";
}

function statusBadge(status: "ativo" | "inativo"): { label: string; variant: "sucesso" | "neutro" } {
  return status === "ativo" ? { label: "ativo", variant: "sucesso" } : { label: "inativo", variant: "neutro" };
}

function tituloTipo(tipo: TipoGestaoBaseJuridica): string {
  if (tipo === "templates") {
    return "Template jurídico";
  }

  if (tipo === "teses") {
    return "Tese jurídica";
  }

  return "Checklist jurídico";
}

function tituloAtivo(ativo: Awaited<ReturnType<typeof obterAtivoBaseJuridicaPorId>>): string {
  if (!ativo) {
    return "";
  }

  if ("nome" in ativo) {
    return ativo.nome;
  }

  if ("titulo" in ativo) {
    return ativo.titulo;
  }

  return ativo.descricao;
}

export default async function BaseJuridicaDetalhePage({ params }: BaseJuridicaDetalhePageProps) {
  const { tipo, ativoId } = await params;
  if (!tipoValido(tipo)) {
    notFound();
  }

  const ativo = await obterAtivoBaseJuridicaPorId(tipo, ativoId);
  if (!ativo) {
    notFound();
  }

  const badge = statusBadge(ativo.status);
  const redirectTo = `/peticoes/base-juridica/${tipo}/${ativo.id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tituloAtivo(ativo)}
        description={`${tituloTipo(tipo)} • Código ${ativo.codigo} • Versão v${ativo.versao}`}
        actions={<StatusBadge label={badge.label} variant={badge.variant} />}
      />

      <Card title="Metadados do ativo">
        <div className="grid gap-2 text-sm text-[var(--color-ink)]">
          <p>
            <strong>Tipo de peça:</strong> {ativo.tiposPecaCanonica.join(", ")}
          </p>
          <p>
            <strong>Matéria:</strong> {ativo.materias.join(", ")}
          </p>
          <p>
            <strong>Status:</strong> {ativo.status}
          </p>
          <p>
            <strong>Versão:</strong> v{ativo.versao}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <form method="post" action={`/api/peticoes/base-juridica/${tipo}/${ativo.id}/status`}>
            <input type="hidden" name="status" value={ativo.status === "ativo" ? "inativo" : "ativo"} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)]"
            >
              {ativo.status === "ativo" ? "Desativar versão" : "Ativar versão"}
            </button>
          </form>

          <form method="post" action={`/api/peticoes/base-juridica/${tipo}/${ativo.id}/nova-versao`}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white"
            >
              Criar nova versão
            </button>
          </form>

          <Link
            href="/peticoes/base-juridica"
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)]"
          >
            Voltar para base jurídica
          </Link>
        </div>
      </Card>

      <Card title="Detalhe estruturado">
        <pre className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-muted)]">
          {JSON.stringify(ativo, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
