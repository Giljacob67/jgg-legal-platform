import type { ModuloNavegacao } from "@/modules/hub/domain/types";

export interface ModulesRepository {
  listarModulos(): ModuloNavegacao[];
}

export class MockModulesRepository implements ModulesRepository {
  private readonly modulos: ModuloNavegacao[] = [
    {
      id: "dashboard",
      nome: "Dashboard",
      rota: "/dashboard",
      status: "ativo",
      resumo: "Visão executiva da operação jurídica.",
    },
    {
      id: "peticoes",
      nome: "Petições",
      rota: "/peticoes",
      status: "ativo",
      resumo: "Centro de produção jurídica com pipeline por etapas.",
    },
    {
      id: "casos",
      nome: "Casos",
      rota: "/casos",
      status: "ativo",
      resumo: "Gestão de casos, prazos, partes e eventos.",
    },
    {
      id: "documentos",
      nome: "Documentos",
      rota: "/documentos",
      status: "ativo",
      resumo: "Acervo documental com leitura e rastreio.",
    },
    {
      id: "biblioteca-juridica",
      nome: "Biblioteca Jurídica",
      rota: "/biblioteca-juridica",
      status: "ativo",
      resumo: "Templates, teses e checklists institucionais.",
    },
    {
      id: "contratos",
      nome: "Contratos",
      rota: "/contratos",
      status: "em implantação",
      resumo: "Fluxo de contratos e cláusulas padrão.",
    },
    {
      id: "jurisprudencia",
      nome: "Jurisprudência",
      rota: "/jurisprudencia",
      status: "planejado",
      resumo: "Pesquisa jurisprudencial assistida.",
    },
    {
      id: "gestao",
      nome: "Gestão",
      rota: "/gestao",
      status: "planejado",
      resumo: "Indicadores operacionais e produtividade.",
    },
    {
      id: "clientes",
      nome: "Clientes",
      rota: "/clientes",
      status: "planejado",
      resumo: "Relacionamento e atendimento consultivo.",
    },
    {
      id: "bi",
      nome: "BI",
      rota: "/bi",
      status: "planejado",
      resumo: "Métricas estratégicas e inteligência de dados.",
    },
    {
      id: "administracao",
      nome: "Administração",
      rota: "/administracao",
      status: "planejado",
      resumo: "Perfis, permissões e configuração da plataforma.",
    },
  ];

  listarModulos(): ModuloNavegacao[] {
    return this.modulos;
  }
}
