import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { AgenteRiscoContrato } from "@/modules/contratos/ui/agente-risco-contrato";
import { obterContratoPorId } from "@/modules/contratos/application";
import {
  LABEL_TIPO_CONTRATO,
  LABEL_STATUS_CONTRATO,
  STATUS_CONTRATO_COR,
} from "@/modules/contratos/domain/types";
import Link from "next/link";

type Params = { params: Promise<{ contratoId: string }> };

function formatarValor(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

export default async function ContratoDetalhe({ params }: Params) {
  const { contratoId } = await params;
  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CONTRATO_COR[contrato.status]}`}>
              {LABEL_STATUS_CONTRATO[contrato.status]}
            </span>
            <span className="text-xs text-[var(--color-muted)]">{contrato.id}</span>
            <span className="text-xs text-[var(--color-muted)]">·</span>
            <span className="text-xs text-[var(--color-muted)]">{LABEL_TIPO_CONTRATO[contrato.tipo]}</span>
          </div>
          <PageHeader title={contrato.titulo} description={contrato.objeto} />
        </div>
        <Link href="/contratos" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">
          ← Voltar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="space-y-6">
          {/* Informações gerais */}
          <Card title="Informações do contrato" subtitle="">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-1">Partes</p>
                {contrato.partes.map((p, i) => (
                  <div key={i} className="mb-1">
                    <span className="capitalize text-[var(--color-muted)]">{p.papel}: </span>
                    <span className="font-medium text-[var(--color-ink)]">{p.nome}</span>
                    {p.cpfCnpj && <span className="text-xs text-[var(--color-muted)]"> ({p.cpfCnpj})</span>}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {contrato.valorReais && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Valor</p>
                    <p className="font-semibold text-[var(--color-ink)]">{formatarValor(contrato.valorReais)}</p>
                  </div>
                )}
                {contrato.vigenciaInicio && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Vigência</p>
                    <p className="text-[var(--color-ink)]">
                      {new Date(contrato.vigenciaInicio).toLocaleDateString("pt-BR")}
                      {contrato.vigenciaFim && ` → ${new Date(contrato.vigenciaFim).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                )}
                {contrato.casoId && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Caso vinculado</p>
                    <Link href={`/casos/${contrato.casoId}`} className="text-[var(--color-accent)] hover:underline">
                      {contrato.casoId}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Cláusulas */}
          <Card title={`Cláusulas (${contrato.clausulas.length})`} subtitle="Estrutura contratual gerada automaticamente com base no tipo.">
            <div className="space-y-4">
              {contrato.clausulas.map((c) => (
                <div key={c.id} className="rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-[var(--color-ink)]">
                      {c.numero}. {c.titulo}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      c.tipo === "essencial" ? "bg-blue-50 text-blue-700 border-blue-200"
                      : c.tipo === "negociavel" ? "bg-amber-50 text-amber-700 border-amber-200"
                      : c.tipo === "opcional" ? "bg-gray-100 text-gray-500 border-gray-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {c.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{c.conteudo}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar: análise de risco */}
        <div className="space-y-6">
          <Card title="Análise de Risco" subtitle="Agente IA detecta lacunas e cláusulas problemáticas.">
            <AgenteRiscoContrato contratoId={contrato.id} analiseInicial={contrato.analiseRisco} />
          </Card>

          <Card title="Versões" subtitle="">
            {contrato.versoes.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhuma versão registrada.</p>
            ) : (
              <div className="space-y-2">
                {contrato.versoes.map((v) => (
                  <div key={v.id} className="text-sm">
                    <p className="font-medium text-[var(--color-ink)]">v{v.numero} — {v.autorNome}</p>
                    <p className="text-xs text-[var(--color-muted)]">{v.resumoMudancas}</p>
                    <p className="text-xs text-[var(--color-muted)]">{new Date(v.criadoEm).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
