import type { ModuloNavegacao } from "@/modules/hub/domain/types";

export interface ModulesRepository {
  listarModulos(): ModuloNavegacao[];
}

export class MockModulesRepository implements ModulesRepository {
  private readonly modulos: ModuloNavegacao[] = [
    // ── Produção Jurídica ──────────────────────────────────────
    {
      id: "peticoes",
      nome: "Petições",
      rota: "/peticoes",
      status: "ativo",
      resumo: "Pipeline de produção jurídica por etapas.",
      icone: "⚖️",
      grupo: "producao",
    },
    {
      id: "casos",
      nome: "Casos",
      rota: "/casos",
      status: "ativo",
      resumo: "Gestão de casos, prazos, partes e eventos.",
      icone: "📁",
      grupo: "producao",
    },
    {
      id: "contratos",
      nome: "Contratos",
      rota: "/contratos",
      status: "ativo",
      resumo: "Minutas, cláusulas padrão e análise de risco.",
      icone: "📄",
      grupo: "producao",
    },
    {
      id: "documentos",
      nome: "Documentos",
      rota: "/documentos",
      status: "ativo",
      resumo: "Acervo documental com leitura e rastreio.",
      icone: "🗂️",
      grupo: "producao",
    },
    // ── Inteligência ───────────────────────────────────────────
    {
      id: "jurisprudencia",
      nome: "Jurisprudência",
      rota: "/jurisprudencia",
      status: "ativo",
      resumo: "Pesquisa jurisprudencial assistida por IA.",
      icone: "🔍",
      grupo: "inteligencia",
    },
    {
      id: "biblioteca-juridica",
      nome: "Biblioteca Jurídica",
      rota: "/biblioteca-juridica",
      status: "ativo",
      resumo: "Templates, teses, checklists e RAG vetorial.",
      icone: "📚",
      grupo: "inteligencia",
    },
    // ── Gestão ─────────────────────────────────────────────────
    {
      id: "dashboard",
      nome: "Dashboard",
      rota: "/dashboard",
      status: "ativo",
      resumo: "Painel executivo com prazos e produção.",
      icone: "🏠",
      grupo: "gestao",
    },
    {
      id: "agenda",
      nome: "Agenda",
      rota: "/agenda",
      status: "em implantação",
      resumo: "Calendário jurídico integrado a compromissos, prazos e audiências.",
      icone: "🗓️",
      grupo: "gestao",
    },
    {
      id: "gestao",
      nome: "Gestão",
      rota: "/gestao",
      status: "ativo",
      resumo: "Alçadas da equipe, alertas e produtividade.",
      icone: "📊",
      grupo: "gestao",
    },
    {
      id: "bi",
      nome: "BI",
      rota: "/bi",
      status: "ativo",
      resumo: "Métricas estratégicas e inteligência de dados.",
      icone: "📈",
      grupo: "gestao",
    },
    {
      id: "clientes",
      nome: "Clientes",
      rota: "/clientes",
      status: "ativo",
      resumo: "Relacionamento e atendimento consultivo.",
      icone: "👥",
      grupo: "gestao",
    },
    // ── Administração ──────────────────────────────────────────
    {
      id: "administracao",
      nome: "Administração",
      rota: "/administracao",
      status: "ativo",
      resumo: "Perfis, permissões e configuração da plataforma.",
      icone: "⚙️",
      grupo: "admin",
    },
  ];

  listarModulos(): ModuloNavegacao[] {
    return this.modulos;
  }
}
