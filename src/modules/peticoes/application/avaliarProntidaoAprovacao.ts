import type { ContextoJuridicoPedido, Minuta } from "@/modules/peticoes/domain/types";
import type { PainelInteligenciaJuridica } from "@/modules/peticoes/inteligencia-juridica/domain/types";

export type ItemProntidaoAprovacao = {
  id: string;
  label: string;
  status: "ok" | "atencao" | "bloqueado";
  detalhe: string;
  bloqueia: boolean;
};

export type ProntidaoAprovacao = {
  liberado: boolean;
  resumo: string;
  itens: ItemProntidaoAprovacao[];
  bloqueios: string[];
  alertas: string[];
};

export function avaliarProntidaoAprovacao(input: {
  contextoJuridico: ContextoJuridicoPedido | null;
  minuta: Minuta | null;
  inteligenciaJuridica?: PainelInteligenciaJuridica | null;
}): ProntidaoAprovacao {
  const contexto = input.contextoJuridico;
  const minuta = input.minuta;
  const inteligencia = input.inteligenciaJuridica ?? null;
  const estrutura = contexto?.dossieJuridico?.estruturaDaPeca;
  const estrategiaAprovada = contexto?.dossieJuridico?.estrategiaAprovada;
  const tesesConfirmadasFallback =
    contexto?.teses.filter((item) => item.statusValidacao === "aprovada" || item.statusValidacao === "ajustada")
      .length ?? 0;
  const tesesConfirmadas = estrategiaAprovada?.tesesConfirmadas.length ?? tesesConfirmadasFallback;
  const referencias = contexto?.referenciasDocumentais.length ?? 0;
  const totalSecoesEstruturadas = estrutura?.secoesSugeridas.length ?? 0;
  const tamanhoMinuta = minuta?.conteudoAtual.trim().length ?? 0;
  const estruturaLiberada =
    estrategiaAprovada?.liberadaParaEstruturacao ??
    Boolean(contexto && !contexto.validacaoHumanaTesesPendente && tesesConfirmadas > 0);
  const secoesInferidasDaMinuta = minuta
    ? [
        /cabecalho|ju[ií]zo/i.test(minuta.conteudoAtual),
        /qualifica[cç][aã]o|partes|cliente/i.test(minuta.conteudoAtual),
        /s[ií]ntese|fatos/i.test(minuta.conteudoAtual),
        /fundamentos|direito/i.test(minuta.conteudoAtual),
        /pedidos/i.test(minuta.conteudoAtual),
        /pede deferimento|termos em que/i.test(minuta.conteudoAtual),
      ].filter(Boolean).length
    : 0;
  const estruturaMinima = totalSecoesEstruturadas > 0 ? totalSecoesEstruturadas : secoesInferidasDaMinuta;
  const checklistObrigatorio = inteligencia
    ? Math.round(inteligencia.checklist.coberturaObrigatoria * 100)
    : null;
  const checklistRecomendavel = inteligencia
    ? Math.round(inteligencia.checklist.coberturaRecomendavel * 100)
    : null;
  const scoreTotal = inteligencia?.score.total ?? null;
  const alertasAltos = inteligencia?.alertas.filter((item) => item.severidade === "alta") ?? [];

  const itens: ItemProntidaoAprovacao[] = [
    {
      id: "contexto",
      label: "Contexto jurídico consolidado",
      status: contexto ? "ok" : "bloqueado",
      detalhe: contexto
        ? `Contexto v${contexto.versaoContexto} disponível para auditoria da minuta.`
        : "A aprovação não deve seguir sem contexto jurídico consolidado.",
      bloqueia: !contexto,
    },
    {
      id: "teses",
      label: "Estratégia aprovada e teses validadas",
      status: estruturaLiberada && tesesConfirmadas > 0 ? "ok" : "bloqueado",
      detalhe:
        estruturaLiberada && tesesConfirmadas > 0
          ? `${tesesConfirmadas} tese(s) validada(s) sustentam a redação final.`
          : "Ainda falta liberar a estratégia com tese validada humanamente.",
      bloqueia: !(estruturaLiberada && tesesConfirmadas > 0),
    },
    {
      id: "estrutura",
      label: "Estrutura da peça definida",
      status: estruturaMinima >= 4 ? "ok" : "bloqueado",
      detalhe:
        estruturaMinima >= 4
          ? `${estruturaMinima} seção(ões) identificadas guiam a peça.`
          : "A estrutura da peça ainda está insuficiente para uma aprovação segura.",
      bloqueia: estruturaMinima < 4,
    },
    {
      id: "minuta",
      label: "Minuta base disponível",
      status: minuta && tamanhoMinuta >= 500 ? "ok" : "bloqueado",
      detalhe:
        minuta && tamanhoMinuta >= 500
          ? `Minuta disponível com ${tamanhoMinuta} caracteres.`
          : "Ainda não há minuta robusta o suficiente para aprovação final.",
      bloqueia: !(minuta && tamanhoMinuta >= 500),
    },
    {
      id: "referencias",
      label: "Referências documentais mínimas",
      status: referencias > 0 ? "ok" : "bloqueado",
      detalhe:
        referencias > 0
          ? `${referencias} referência(s) documentais vinculadas ao contexto.`
          : "Faltam referências documentais mínimas para sustentar a peça aprovada.",
      bloqueia: referencias === 0,
    },
    {
      id: "checklist",
      label: "Checklist obrigatório da minuta",
      status:
        checklistObrigatorio === null
          ? "atencao"
          : checklistObrigatorio >= 60
            ? "ok"
            : "bloqueado",
      detalhe:
        checklistObrigatorio === null
          ? "Checklist automático indisponível nesta análise."
          : `Cobertura obrigatória de ${checklistObrigatorio}%.`,
      bloqueia: checklistObrigatorio !== null && checklistObrigatorio < 60,
    },
    {
      id: "alertas",
      label: "Alertas críticos de auditoria",
      status: alertasAltos.length === 0 ? "ok" : "bloqueado",
      detalhe:
        alertasAltos.length === 0
          ? "Sem alertas altos ativos no painel de inteligência jurídica."
          : `${alertasAltos.length} alerta(s) alto(s) ainda exigem correção antes da aprovação.`,
      bloqueia: alertasAltos.length > 0,
    },
    {
      id: "qualidade",
      label: "Score global de qualidade",
      status:
        scoreTotal === null
          ? "atencao"
          : scoreTotal >= 65
            ? "ok"
            : "atencao",
      detalhe:
        scoreTotal === null
          ? "Score automático indisponível nesta análise."
          : `Score atual ${scoreTotal}/100${
              checklistRecomendavel !== null ? ` • recomendáveis ${checklistRecomendavel}%` : ""
            }.`,
      bloqueia: false,
    },
  ];

  const bloqueios = itens.filter((item) => item.bloqueia).map((item) => item.label);
  const alertas = itens.filter((item) => item.status === "atencao").map((item) => item.label);

  return {
    liberado: bloqueios.length === 0,
    resumo:
      bloqueios.length === 0
        ? "A peça atende o mínimo jurídico-operacional para aprovação formal."
        : "A peça ainda depende de ajustes objetivos antes da aprovação final.",
    itens,
    bloqueios,
    alertas,
  };
}
