// ─────────────────────────────────────────────────────────────
// MÓDULO ADMINISTRAÇÃO — Domain Types
// ─────────────────────────────────────────────────────────────

/**
 * Perfis de usuário conforme AGENTS.md
 * Determina o nível de acesso a cada módulo da plataforma.
 */
export type PerfilUsuario =
  | "socio_direcao"          // Acesso total + BI + decisões estratégicas
  | "coordenador_juridico"   // Gestão de equipe, aprovação de peças, casos
  | "advogado"               // Casos, petições, contratos do seu portfólio
  | "estagiario_assistente"  // Apenas leitura + contribuição limitada
  | "operacional_admin"      // Clientes, documentos, financeiro sem jurídico
  | "administrador_sistema"; // Configurações técnicas + usuários

export const LABEL_PERFIL: Record<PerfilUsuario, string> = {
  socio_direcao: "Sócio / Direção",
  coordenador_juridico: "Coordenador Jurídico",
  advogado: "Advogado",
  estagiario_assistente: "Estagiário / Assistente",
  operacional_admin: "Operacional / Administrativo",
  administrador_sistema: "Administrador do Sistema",
};

export const ORDEM_PERFIL: Record<PerfilUsuario, number> = {
  socio_direcao: 1,
  coordenador_juridico: 2,
  advogado: 3,
  estagiario_assistente: 4,
  operacional_admin: 5,
  administrador_sistema: 6,
};

// ─── Módulos da plataforma ────────────────────────────────────

export type ModuloPlataforma =
  | "dashboard"
  | "peticoes"
  | "casos"
  | "documentos"
  | "biblioteca_juridica"
  | "contratos"
  | "jurisprudencia"
  | "gestao"
  | "clientes"
  | "bi"
  | "administracao";

// ─── Nível de acesso por permissão ───────────────────────────

export type NivelAcesso = "sem_acesso" | "leitura" | "edicao" | "total";

export type MatrizPermissoes = Record<PerfilUsuario, Record<ModuloPlataforma, NivelAcesso>>;

/**
 * Matriz padrão de permissões por perfil.
 * Pode ser sobrescrita via configurações do sistema.
 */
export const PERMISSOES_PADRAO: MatrizPermissoes = {
  socio_direcao: {
    dashboard: "total",
    peticoes: "total",
    casos: "total",
    documentos: "total",
    biblioteca_juridica: "total",
    contratos: "total",
    jurisprudencia: "total",
    gestao: "total",
    clientes: "total",
    bi: "total",
    administracao: "leitura",
  },
  coordenador_juridico: {
    dashboard: "total",
    peticoes: "total",
    casos: "total",
    documentos: "total",
    biblioteca_juridica: "total",
    contratos: "edicao",
    jurisprudencia: "total",
    gestao: "edicao",
    clientes: "edicao",
    bi: "leitura",
    administracao: "sem_acesso",
  },
  advogado: {
    dashboard: "leitura",
    peticoes: "total",
    casos: "edicao",
    documentos: "edicao",
    biblioteca_juridica: "edicao",
    contratos: "edicao",
    jurisprudencia: "edicao",
    gestao: "sem_acesso",
    clientes: "leitura",
    bi: "sem_acesso",
    administracao: "sem_acesso",
  },
  estagiario_assistente: {
    dashboard: "leitura",
    peticoes: "leitura",
    casos: "leitura",
    documentos: "edicao",
    biblioteca_juridica: "leitura",
    contratos: "leitura",
    jurisprudencia: "leitura",
    gestao: "sem_acesso",
    clientes: "sem_acesso",
    bi: "sem_acesso",
    administracao: "sem_acesso",
  },
  operacional_admin: {
    dashboard: "leitura",
    peticoes: "sem_acesso",
    casos: "leitura",
    documentos: "edicao",
    biblioteca_juridica: "sem_acesso",
    contratos: "leitura",
    jurisprudencia: "sem_acesso",
    gestao: "sem_acesso",
    clientes: "total",
    bi: "sem_acesso",
    administracao: "sem_acesso",
  },
  administrador_sistema: {
    dashboard: "total",
    peticoes: "leitura",
    casos: "leitura",
    documentos: "total",
    biblioteca_juridica: "total",
    contratos: "leitura",
    jurisprudencia: "leitura",
    gestao: "leitura",
    clientes: "leitura",
    bi: "leitura",
    administracao: "total",
  },
};

// ─── Entity: Usuário ─────────────────────────────────────────

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  iniciais: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  ultimoAcesso?: string; // ISO string
  criadoEm: string;
}

// ─── Convite de usuário ────────────────────────────────────────

export interface ConviteUsuario {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

// ─── Configuração do sistema ──────────────────────────────────

export interface ConfiguracaoSistema {
  chave: string;
  valor: string;
  descricao?: string;
}

export type ConfiguracaoChave =
  | "ai_provider"
  | "ai_model"
  | "data_mode"
  | "nome_escritorio"
  | "logo_url"
  | "tema"
  | "prazo_alerta_dias"; // Quantos dias antes do prazo emitir alerta

// ─── Auditoria ────────────────────────────────────────────────

export type AcaoAuditoria =
  | "convidar_usuario"
  | "alterar_perfil"
  | "ativar_usuario"
  | "desativar_usuario"
  | "alterar_configuracao"
  | "alterar_permissoes";

export interface RegistroAuditoria {
  id: string;
  userId: string;
  userNome: string;
  acao: AcaoAuditoria;
  entidade?: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
  criadoEm: string;
}
