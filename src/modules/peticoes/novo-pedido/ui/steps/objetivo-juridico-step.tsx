import { cn } from "@/lib/utils";
import { TextareaInput } from "@/components/ui/textarea-input";
import { CATEGORIAS_OBJETIVO } from "@/modules/peticoes/novo-pedido/domain/catalogo";
import type { CategoriaObjetivoJuridico, ObjetivoJuridicoNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";
import type { ObjetivoJuridicoSugestao } from "@/modules/peticoes/novo-pedido/domain/catalogo";

type ObjetivoJuridicoStepProps = {
  objetivo: ObjetivoJuridicoNovoPedido;
  sugestoes: ObjetivoJuridicoSugestao[];
  onSelecionarCategoria: (categoria: CategoriaObjetivoJuridico) => void;
  onSelecionarObjetivo: (intencao: ObjetivoJuridicoNovoPedido["intencaoSelecionada"]) => void;
  onAtualizarIntencaoLivre: (valor: string) => void;
};

export function ObjetivoJuridicoStep({
  objetivo,
  sugestoes,
  onSelecionarCategoria,
  onSelecionarObjetivo,
  onAtualizarIntencaoLivre,
}: ObjetivoJuridicoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">Escolha a direção do trabalho jurídico</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Em vez de começar por uma lista extensa de peças, o wizard parte da intenção operacional do advogado.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {CATEGORIAS_OBJETIVO.map((categoria) => {
          const ativa = categoria.id === objetivo.categoria;
          return (
            <button
              key={categoria.id}
              type="button"
              onClick={() => onSelecionarCategoria(categoria.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                ativa
                  ? "border-[var(--color-accent)] bg-[var(--color-card)] shadow-sm"
                  : "border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-card)]",
              )}
            >
              <p className="text-sm font-semibold text-[var(--color-ink)]">{categoria.titulo}</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{categoria.descricao}</p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">{categoria.orientacao}</p>
            </button>
          );
        })}
      </div>

      {objetivo.categoria ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Objetivos sugeridos</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              O sistema sugere caminhos prováveis. A decisão final continua sendo do usuário.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {sugestoes.map((sugestao) => {
              const ativa = sugestao.intencao === objetivo.intencaoSelecionada;
              return (
                <button
                  key={sugestao.intencao}
                  type="button"
                  onClick={() => onSelecionarObjetivo(sugestao.intencao)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    ativa
                      ? "border-[var(--color-accent)] bg-[var(--color-card)] shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-card)]",
                  )}
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{sugestao.titulo}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{sugestao.descricao}</p>
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    Peças normalmente relacionadas: {sugestao.tiposPecaRelacionados.slice(0, 3).join(", ")}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {objetivo.intencaoSelecionada === "outro" ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <TextareaInput
            label="Descreva a orientação livre"
            value={objetivo.intencaoLivre}
            onChange={(event) => onAtualizarIntencaoLivre(event.target.value)}
            rows={4}
            placeholder="Ex.: preciso de uma petição avulsa para preservar prova, pedir intimação específica e preparar recurso posterior."
            helperText="Seja específico: objetivo, situação processual e resultado esperado."
            requiredMark
          />
        </div>
      ) : null}
    </div>
  );
}
