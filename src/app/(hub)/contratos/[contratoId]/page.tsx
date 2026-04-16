import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { AgenteRiscoContrato } from "@/modules/contratos/ui/agente-risco-contrato";
import { EditorClausulas } from "@/modules/contratos/ui/editor-clausulas";
import { AcoesContrato } from "@/modules/contratos/ui/acoes-contrato";
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
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/contratos" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">
            ← Voltar
          </Link>
          <AcoesContrato contratoId={contrato.id} />
        </div>
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

          {/* Editor de cláusulas */}
          <Card title={`Cláusulas (${contrato.clausulas.length})`} subtitle="Edite inline, adicione ou remova cláusulas. Use IA para gerar uma minuta completa.">
            <EditorClausulas
              contratoId={contrato.id}
              clausulasIniciais={contrato.clausulas}
              conteudoInicial={contrato.conteudoAtual}
            />
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
