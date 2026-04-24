"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ItemMatrizFatoProva } from "@/modules/peticoes/domain/fatos-provas";

type MatrizFatosProvasProps = {
  itens: ItemMatrizFatoProva[] | undefined | null;
};

const LABEL_CLASSIFICACAO: Record<ItemMatrizFatoProva["classificacao"], string> = {
  comprovado: "Fato comprovado",
  alegado_pelo_cliente: "Fato alegado pelo cliente",
  extraido_documento_adverso: "Fato extraído de documento adverso",
  controvertido: "Fato controvertido",
  lacuna_probatoria: "Lacuna probatória",
};

const VARIANT_CLASSIFICACAO: Record<
  ItemMatrizFatoProva["classificacao"],
  "sucesso" | "implantacao" | "alerta" | "neutro"
> = {
  comprovado: "sucesso",
  alegado_pelo_cliente: "implantacao",
  extraido_documento_adverso: "implantacao",
  controvertido: "alerta",
  lacuna_probatoria: "alerta",
};

const LABEL_FORCA: Record<ItemMatrizFatoProva["forcaProbativa"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const VARIANT_FORCA: Record<ItemMatrizFatoProva["forcaProbativa"], "sucesso" | "implantacao" | "alerta"> = {
  alta: "sucesso",
  media: "implantacao",
  baixa: "alerta",
};

const LABEL_RISCO: Record<ItemMatrizFatoProva["riscoAssociado"], string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

const VARIANT_RISCO: Record<ItemMatrizFatoProva["riscoAssociado"], "sucesso" | "implantacao" | "alerta"> = {
  baixo: "sucesso",
  medio: "implantacao",
  alto: "alerta",
};

const LABEL_RECOMENDACAO: Record<ItemMatrizFatoProva["recomendacaoUso"], string> = {
  usar: "Usar",
  usar_com_cautela: "Usar com cautela",
  nao_usar_ainda: "Não usar ainda",
  pedir_complemento: "Pedir complemento",
};

const VARIANT_RECOMENDACAO: Record<
  ItemMatrizFatoProva["recomendacaoUso"],
  "sucesso" | "implantacao" | "alerta" | "neutro"
> = {
  usar: "sucesso",
  usar_com_cautela: "implantacao",
  nao_usar_ainda: "alerta",
  pedir_complemento: "neutro",
};

export function MatrizFatosProvas({ itens }: MatrizFatosProvasProps) {
  const matriz = itens ?? [];

  return (
    <div className="space-y-6">
      {matriz.length === 0 ? (
        <EmptyState
          title="Matriz de fatos e provas vazia"
          message="Nenhum fato foi mapeado ainda. Execute o pipeline de extração de fatos ou adicione fatos manualmente para construir a base factual da peça."
          icon={<SearchIcon size={22} />}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)]">
            Cada linha representa um fato relevante com sua classificação jurídica, prova de suporte e recomendação de uso na peça. As teses futuras dependerão da qualidade desta matriz.
          </p>

          <div className="space-y-3">
            {matriz.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-[1.2rem] border bg-[var(--color-surface-alt)] p-4 transition",
                  item.riscoAssociado === "alto"
                    ? "border-rose-200"
                    : item.classificacao === "comprovado"
                      ? "border-emerald-200"
                      : "border-[var(--color-border)]",
                )}
              >
                {/* Cabeçalho: Fato + Classificação */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.fato}</p>
                  </div>
                  <StatusBadge
                    label={LABEL_CLASSIFICACAO[item.classificacao]}
                    variant={VARIANT_CLASSIFICACAO[item.classificacao]}
                  />
                </div>

                {/* Grid de atributos */}
                <div className="mt-4 grid gap-3 text-xs text-[var(--color-muted)] sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="font-semibold text-[var(--color-muted-strong)]">Fonte</p>
                    <p className="mt-0.5">{item.fonte}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-[var(--color-muted-strong)]">Documento relacionado</p>
                    <p className="mt-0.5">
                      {item.documentoRelacionado
                        ? `${item.documentoRelacionado.titulo} (${item.documentoRelacionado.tipoDocumento})`
                        : "Não vinculado"}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[var(--color-muted-strong)]">Força probatória</p>
                    <div className="mt-0.5">
                      <StatusBadge
                        label={LABEL_FORCA[item.forcaProbativa]}
                        variant={VARIANT_FORCA[item.forcaProbativa]}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-[var(--color-muted-strong)]">Risco</p>
                    <div className="mt-0.5">
                      <StatusBadge
                        label={LABEL_RISCO[item.riscoAssociado]}
                        variant={VARIANT_RISCO[item.riscoAssociado]}
                      />
                    </div>
                  </div>
                </div>

                {/* Recomendação e Observação */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[var(--color-muted-strong)]">Recomendação:</p>
                    <StatusBadge
                      label={LABEL_RECOMENDACAO[item.recomendacaoUso]}
                      variant={VARIANT_RECOMENDACAO[item.recomendacaoUso]}
                    />
                  </div>
                </div>

                {item.observacaoJuridica ? (
                  <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                    <p className="text-xs font-semibold text-[var(--color-muted-strong)]">Observação jurídica</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{item.observacaoJuridica}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <InlineAlert title="Conexão com teses" variant="info">
            A qualidade das teses jurídicas que serão propostas na próxima etapa depende diretamente da cobertura e da classificação desta matriz de fatos. Fatos comprovados com força alta sustentam teses principais; fatos controvertidos ou lacunas probatórias indicam necessidade de tese subsidiária ou de diligência complementar.
          </InlineAlert>
        </div>
      )}
    </div>
  );
}
