"use client";

import { cn } from "@/lib/utils";
import type { SecaoPedidoId } from "./types";

const SECOES: Array<{ id: SecaoPedidoId; titulo: string; abrev?: string }> = [
  { id: "resumo", titulo: "Resumo", abrev: "Resumo" },
  { id: "briefing", titulo: "Briefing", abrev: "Briefing" },
  { id: "documentos", titulo: "Documentos", abrev: "Docs" },
  { id: "fatos-provas", titulo: "Fatos e Provas", abrev: "Fatos" },
  { id: "analise-adversa", titulo: "Análise Adversa", abrev: "Adversa" },
  { id: "estrategia", titulo: "Estratégia", abrev: "Estratégia" },
  { id: "teses", titulo: "Teses", abrev: "Teses" },
  { id: "estrutura-peca", titulo: "Estrutura da Peça", abrev: "Estrutura" },
  { id: "minuta", titulo: "Minuta", abrev: "Minuta" },
  { id: "revisao-auditoria", titulo: "Revisão e Auditoria", abrev: "Revisão" },
];

type PedidoWorkspaceTabsProps = {
  secaoAtiva: SecaoPedidoId;
  onSelecionarSecao: (secao: SecaoPedidoId) => void;
  children: React.ReactNode;
};

export function PedidoWorkspaceTabs({ secaoAtiva, onSelecionarSecao, children }: PedidoWorkspaceTabsProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Navegação lateral em desktop, horizontal scroll em mobile */}
      <nav className="shrink-0 lg:w-[220px]">
        <div className="sticky top-6 space-y-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Mesa de construção
          </p>
          {SECOES.map((secao) => {
            const ativa = secao.id === secaoAtiva;
            return (
              <button
                key={secao.id}
                type="button"
                onClick={() => onSelecionarSecao(secao.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                  ativa
                    ? "border-[var(--color-accent)] bg-[var(--color-card)] text-[var(--color-accent)] shadow-sm"
                    : "border-transparent text-[var(--color-ink)] hover:border-[var(--color-border)] hover:bg-[var(--color-card)]",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    ativa ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-page)] text-[var(--color-muted)]",
                  )}
                >
                  {SECOES.indexOf(secao) + 1}
                </span>
                <span className="hidden lg:inline">{secao.titulo}</span>
                <span className="lg:hidden">{secao.abrev}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
