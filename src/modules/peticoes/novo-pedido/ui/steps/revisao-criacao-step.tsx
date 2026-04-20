import { StatusBadge } from "@/components/ui/status-badge";
import type { ConfirmacaoCriacaoNovoPedido, PendenciaNovoPedido, RevisaoNovoPedido } from "@/modules/peticoes/novo-pedido/domain/types";

type RevisaoCriacaoStepProps = {
  revisao: RevisaoNovoPedido;
  pendencias: PendenciaNovoPedido[];
  confirmacao: ConfirmacaoCriacaoNovoPedido;
  criando: boolean;
  erroCriacao: string | null;
  onAlternarConfirmacao: (valor: boolean) => void;
  onAtualizarObservacoes: (valor: string) => void;
  onCriarPedido: () => void;
};

export function RevisaoCriacaoStep({
  revisao,
  pendencias,
  confirmacao,
  criando,
  erroCriacao,
  onAlternarConfirmacao,
  onAtualizarObservacoes,
  onCriarPedido,
}: RevisaoCriacaoStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">O que foi inferido</p>
            <StatusBadge label={`${revisao.inferido.length}`} variant="neutro" />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
            {revisao.inferido.map((item) => (
              <li key={item.id}>
                <strong className="text-[var(--color-ink)]">{item.label}:</strong> {item.valor}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">O que foi confirmado</p>
            <StatusBadge label={`${revisao.confirmado.length}`} variant="sucesso" />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
            {revisao.confirmado.map((item) => (
              <li key={item.id}>
                <strong className="text-[var(--color-ink)]">{item.label}:</strong> {item.valor}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">O que ainda falta</p>
            <StatusBadge label={`${revisao.faltando.length}`} variant="alerta" />
          </div>
          {revisao.faltando.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
              {revisao.faltando.map((item) => (
                <li key={item.id}>
                  <strong className="text-[var(--color-ink)]">{item.label}:</strong> {item.valor}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              O briefing está suficientemente claro para abertura controlada do pedido.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Pendências consolidadas</p>
        {pendencias.length > 0 ? (
          <div className="mt-4 space-y-3">
            {pendencias.map((pendencia) => (
              <div key={pendencia.codigo} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{pendencia.titulo}</p>
                  <StatusBadge label={pendencia.severidade} variant={pendencia.severidade === "alta" ? "alerta" : "neutro"} />
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{pendencia.descricao}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Sem pendências críticas no momento.</p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={confirmacao.confirmadoPeloUsuario}
            onChange={(event) => onAlternarConfirmacao(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--color-ink)]">
              Confirmação humana explícita
            </span>
            <span className="mt-1 block text-sm text-[var(--color-muted)]">
              Confirmo que revisei o briefing, concordo com a abertura do pedido e assumo a responsabilidade pela conferência inicial.
            </span>
          </span>
        </label>

        <label className="mt-4 block text-sm font-semibold text-[var(--color-ink)]">
          Observações finais da revisão
          <textarea
            value={confirmacao.observacoesFinais}
            onChange={(event) => onAtualizarObservacoes(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Ex.: pedido precisa ser distribuído hoje, cliente ainda enviará documento complementar, revisar prova de urgência antes da redação."
          />
        </label>

        {erroCriacao ? <p className="mt-4 text-sm text-rose-700">{erroCriacao}</p> : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCriarPedido}
            disabled={!confirmacao.confirmadoPeloUsuario || criando}
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {criando ? "Criando pedido..." : "Criar pedido de peça"}
          </button>
        </div>
      </div>
    </div>
  );
}
