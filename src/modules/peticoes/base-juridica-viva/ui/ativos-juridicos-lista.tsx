import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ChecklistJuridicoAtivoVersionado,
  TemplateJuridicoAtivoVersionado,
  TeseJuridicaAtivaVersionada,
} from "@/modules/peticoes/base-juridica-viva/domain/types";

type TipoLista = "templates" | "teses" | "checklists";

type ItemLista = TemplateJuridicoAtivoVersionado | TeseJuridicaAtivaVersionada | ChecklistJuridicoAtivoVersionado;

type AtivosJuridicosListaProps = {
  tipo: TipoLista;
  itens: ItemLista[];
};

function labelStatus(status: ItemLista["status"]): { label: string; variant: "sucesso" | "neutro" } {
  return status === "ativo" ? { label: "ativo", variant: "sucesso" } : { label: "inativo", variant: "neutro" };
}

function tituloItem(item: ItemLista): string {
  if ("nome" in item) {
    return item.nome;
  }

  if ("titulo" in item) {
    return item.titulo;
  }

  return item.descricao;
}

export function AtivosJuridicosLista({ tipo, itens }: AtivosJuridicosListaProps) {
  return (
    <div className="space-y-3">
      {itens.map((item) => {
        const status = labelStatus(item.status);
        return (
          <article key={item.id} className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{tituloItem(item)}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Código: {item.codigo} • Versão: v{item.versao}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Tipo de peça: {item.tiposPecaCanonica.join(", ")}
                </p>
                <p className="text-xs text-[var(--color-muted)]">Matéria: {item.materias.join(", ")}</p>
              </div>
              <StatusBadge label={status.label} variant={status.variant} />
            </div>

            <div className="mt-2">
              <Link
                href={`/peticoes/base-juridica/${tipo}/${item.id}`}
                className="text-sm font-semibold text-[var(--color-accent)]"
              >
                Ver detalhe
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
