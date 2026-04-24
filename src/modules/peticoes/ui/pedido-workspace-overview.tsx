import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ContextoJuridicoPedido, EtapaPipeline, StatusPedido } from "@/modules/peticoes/domain/types";

type PedidoWorkspaceOverviewProps = {
  pedidoId: string;
  pedidoStatus: StatusPedido;
  etapaAtual: EtapaPipeline;
  responsavel: string;
  responsavelDefinido: boolean;
  totalDocumentos: number;
  percentualConclusao: number;
  pendenciasCriticas: number;
  contextoAtual: ContextoJuridicoPedido | null;
  minutaId?: string;
};

type MacroEtapaId = "intake" | "estrategia" | "estrutura" | "redacao" | "revisao" | "aprovacao";

const MACROETAPAS: Array<{ id: MacroEtapaId; titulo: string; descricao: string }> = [
  {
    id: "intake",
    titulo: "Caso e triagem",
    descricao: "Documentos, objetivo processual e contexto mínimo do pedido.",
  },
  {
    id: "estrategia",
    titulo: "Mapa de teses",
    descricao: "Fatos, controvérsias e validação humana da estratégia.",
  },
  {
    id: "estrutura",
    titulo: "Estrutura da peça",
    descricao: "Ordem das seções, pedidos prioritários e provas que guiam a redação.",
  },
  {
    id: "redacao",
    titulo: "Produção da minuta",
    descricao: "Estruturação da peça com suporte documental e tese validada.",
  },
  {
    id: "revisao",
    titulo: "Revisão técnica",
    descricao: "Checagem jurídica, consistência e ajustes finais.",
  },
  {
    id: "aprovacao",
    titulo: "Fechamento",
    descricao: "Decisão humana final e preparação para protocolo.",
  },
];

function macroEtapaAtual(input: Pick<PedidoWorkspaceOverviewProps, "etapaAtual" | "contextoAtual" | "minutaId">): MacroEtapaId {
  const { etapaAtual, contextoAtual, minutaId } = input;
  if (etapaAtual === "classificacao" || etapaAtual === "leitura_documental") {
    return "intake";
  }
  if (
    etapaAtual === "extracao_de_fatos" ||
    etapaAtual === "analise_adversa" ||
    etapaAtual === "analise_documental_do_cliente" ||
    etapaAtual === "estrategia_juridica" ||
    etapaAtual === "pesquisa_de_apoio"
  ) {
    if (
      contextoAtual?.dossieJuridico?.estrategiaAprovada.liberadaParaEstruturacao &&
      !minutaId
    ) {
      return "estrutura";
    }
    return "estrategia";
  }
  if (etapaAtual === "redacao") {
    return "redacao";
  }
  if (etapaAtual === "revisao") {
    return "revisao";
  }
  return "aprovacao";
}

function definirProximaAcao(input: PedidoWorkspaceOverviewProps) {
  if (!input.responsavelDefinido) {
    return {
      titulo: "Definir responsável titular",
      descricao: "O fluxo operacional continua bloqueado até existir um responsável formal pelo pedido.",
      href: "#responsavel",
      label: "Atribuir responsável",
      variant: "primario" as const,
    };
  }

  if (!input.contextoAtual) {
    return {
      titulo: "Consolidar contexto jurídico",
      descricao: "Ainda faltam fatos, cronologia e estratégia base para iniciar uma redação confiável.",
      href: `/peticoes/pipeline/${input.pedidoId}`,
      label: "Abrir pipeline",
      variant: "primario" as const,
    };
  }

  if (input.contextoAtual.validacaoHumanaTesesPendente) {
    return {
      titulo: "Validar teses antes da peça final",
      descricao: "A IA sugeriu caminhos, mas a peça só deve avançar após aprovação, ajuste ou rejeição humana das teses.",
      href: "#mapa-teses",
      label: "Revisar teses",
      variant: "primario" as const,
    };
  }

  if (!input.minutaId) {
    return {
      titulo: "Conferir estrutura da peça",
      descricao: "A estratégia já foi validada. Antes da minuta, revise a ordem das seções, os pedidos e as provas prioritárias.",
      href: "#estrutura-peca",
      label: "Revisar estrutura",
      variant: "primario" as const,
    };
  }

  if (input.pedidoStatus !== "aprovado") {
    return {
      titulo: "Revisar e fechar a minuta",
      descricao: "A peça já entrou em produção. O foco agora é coerência técnica, pedidos e rastreabilidade.",
      href: `/peticoes/minutas/${input.minutaId}/editor`,
      label: "Abrir editor",
      variant: "primario" as const,
    };
  }

  return {
    titulo: "Pedido aprovado",
    descricao: "Fluxo principal encerrado. Use o editor e a timeline para registrar ajustes residuais e fechamento operacional.",
    href: `/peticoes/minutas/${input.minutaId}/editor`,
    label: "Revisar peça aprovada",
    variant: "secundario" as const,
  };
}

export function PedidoWorkspaceOverview(props: PedidoWorkspaceOverviewProps) {
  const macroAtual = macroEtapaAtual({
    etapaAtual: props.etapaAtual,
    contextoAtual: props.contextoAtual,
    minutaId: props.minutaId,
  });
  const macroIndex = MACROETAPAS.findIndex((item) => item.id === macroAtual);
  const proximaAcao = definirProximaAcao(props);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
      <Card
        title="Workspace do pedido"
        subtitle="Linha operacional principal para sair da triagem, validar teses, redigir e aprovar a peça sem trocar de contexto à toa."
        eyebrow="Jornada"
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="#controle"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Controle
          </Link>
          <Link
            href="#mapa-teses"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Teses
          </Link>
          <Link
            href="#dossie"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Dossiê
          </Link>
          <Link
            href="#estrutura-peca"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Estrutura
          </Link>
          <Link
            href="#timeline"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Timeline
          </Link>
          <Link
            href="#documentos"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-card-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
          >
            Documentos
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {MACROETAPAS.map((macro, index) => {
            const status =
              index < macroIndex || props.pedidoStatus === "aprovado"
                ? "concluída"
                : index === macroIndex
                  ? "em foco"
                  : "pendente";

            return (
              <article key={macro.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{macro.titulo}</p>
                  <StatusBadge
                    label={status}
                    variant={status === "concluída" ? "sucesso" : status === "em foco" ? "implantacao" : "neutro"}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{macro.descricao}</p>
              </article>
            );
          })}
        </div>
      </Card>

      <Card title="Próxima ação" subtitle="Recomendação operacional central para destravar o pedido." eyebrow="Foco">
        <div className="space-y-4">
          <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">{proximaAcao.titulo}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{proximaAcao.descricao}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-strong)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Responsável</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                {props.responsavelDefinido ? props.responsavel : "Atribuição pendente"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-strong)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Bloqueios críticos</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{props.pendenciasCriticas}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-strong)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Cobertura documental</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{props.totalDocumentos} documento(s)</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card-strong)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-strong)]">Conclusão do pipeline</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{props.percentualConclusao}%</p>
            </div>
          </div>

          <ButtonLink href={proximaAcao.href} label={proximaAcao.label} variant={proximaAcao.variant} />
        </div>
      </Card>
    </section>
  );
}
