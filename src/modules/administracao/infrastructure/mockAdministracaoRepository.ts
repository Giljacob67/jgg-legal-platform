import type { IAdministracaoRepository } from "../domain/IAdministracaoRepository";
import type {
  Usuario,
  ConviteUsuario,
  PerfilUsuario,
  RegistroAuditoria,
  ConfiguracaoSistema,
} from "../domain/types";

const USUARIOS_MOCK: Usuario[] = [
  {
    id: "usr-001",
    nome: "Gilberto Jacob",
    email: "gilberto@jgg.adv.br",
    iniciais: "GJ",
    perfil: "socio_direcao",
    ativo: true,
    ultimoAcesso: new Date().toISOString(),
    criadoEm: "2026-01-15T08:00:00Z",
  },
  {
    id: "usr-002",
    nome: "Ana Paula Mendes",
    email: "ana.paula@jgg.adv.br",
    iniciais: "AP",
    perfil: "coordenador_juridico",
    ativo: true,
    ultimoAcesso: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    criadoEm: "2026-02-01T08:00:00Z",
  },
  {
    id: "usr-003",
    nome: "Rafael Costa",
    email: "rafael.costa@jgg.adv.br",
    iniciais: "RC",
    perfil: "advogado",
    ativo: true,
    ultimoAcesso: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    criadoEm: "2026-02-10T08:00:00Z",
  },
  {
    id: "usr-004",
    nome: "Maria Luiza Faria",
    email: "maria.luiza@jgg.adv.br",
    iniciais: "ML",
    perfil: "estagiario_assistente",
    ativo: true,
    ultimoAcesso: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    criadoEm: "2026-03-01T08:00:00Z",
  },
  {
    id: "usr-005",
    nome: "Carlos Henrique",
    email: "carlos@jgg.adv.br",
    iniciais: "CH",
    perfil: "operacional_admin",
    ativo: false,
    criadoEm: "2026-01-20T08:00:00Z",
  },
];

const AUDITORIA_MOCK: RegistroAuditoria[] = [
  {
    id: "aud-001",
    userId: "usr-001",
    userNome: "Gilberto Jacob",
    acao: "alterar_perfil",
    entidade: "usuario",
    entidadeId: "usr-002",
    detalhes: { perfilAnterior: "advogado", perfilNovo: "coordenador_juridico" },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "aud-002",
    userId: "usr-001",
    userNome: "Gilberto Jacob",
    acao: "convidar_usuario",
    entidade: "usuario",
    entidadeId: "usr-003",
    detalhes: { email: "rafael.costa@jgg.adv.br" },
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

const CONFIGURACOES_MOCK: ConfiguracaoSistema[] = [
  { chave: "nome_escritorio", valor: "JGG Group — Advocacia e Consultoria", descricao: "Nome do escritório exibido na plataforma" },
  { chave: "ai_provider", valor: process.env.AI_PROVIDER ?? "openai", descricao: "Provedor de IA ativo" },
  { chave: "ai_model", valor: process.env.AI_MODEL ?? "gpt-4o-mini", descricao: "Modelo de IA padrão" },
  { chave: "ai_last_tested_at", valor: "", descricao: "Último teste de conexão IA (ISO datetime)" },
  { chave: "ai_last_tested_provider", valor: "", descricao: "Provedor validado no último teste" },
  { chave: "ai_last_tested_model", valor: "", descricao: "Modelo validado no último teste" },
  { chave: "ai_last_test_status", valor: "", descricao: "Status do último teste (success/error)" },
  { chave: "ai_last_test_message", valor: "", descricao: "Mensagem do último teste de conexão IA" },
  { chave: "ai_openai_api_key", valor: process.env.OPENAI_API_KEY ?? "", descricao: "API Key OpenAI" },
  { chave: "ai_openrouter_api_key", valor: process.env.OPENROUTER_API_KEY ?? "", descricao: "API Key OpenRouter" },
  { chave: "ai_kilocode_api_key", valor: process.env.KILO_API_KEY ?? "", descricao: "API Key KiloCode" },
  { chave: "ai_anthropic_api_key", valor: process.env.ANTHROPIC_API_KEY ?? "", descricao: "API Key Anthropic" },
  { chave: "ai_google_api_key", valor: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "", descricao: "API Key Google AI" },
  { chave: "ai_groq_api_key", valor: process.env.GROQ_API_KEY ?? "", descricao: "API Key Groq" },
  { chave: "ai_xai_api_key", valor: process.env.XAI_API_KEY ?? "", descricao: "API Key xAI" },
  { chave: "ai_mistral_api_key", valor: process.env.MISTRAL_API_KEY ?? "", descricao: "API Key Mistral" },
  { chave: "ai_ollama_base_url", valor: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", descricao: "Base URL Ollama" },
  { chave: "ai_ollama_api_key", valor: process.env.OLLAMA_API_KEY ?? "", descricao: "Token Ollama (opcional)" },
  { chave: "ai_custom_base_url", valor: process.env.CUSTOM_BASE_URL ?? "", descricao: "Base URL custom OpenAI-compatible" },
  { chave: "ai_custom_api_key", valor: process.env.CUSTOM_API_KEY ?? "", descricao: "Token custom (opcional)" },
  { chave: "google_auth_mode", valor: "service_account", descricao: "Modo de autenticação Google Workspace" },
  { chave: "google_oauth_client_id", valor: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "", descricao: "OAuth Client ID Google" },
  { chave: "google_oauth_client_secret", valor: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "", descricao: "OAuth Client Secret Google" },
  { chave: "google_oauth_redirect_uri", valor: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "", descricao: "Redirect URI OAuth Google" },
  { chave: "google_service_account_key", valor: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "", descricao: "JSON da service account Google" },
  { chave: "google_drive_shared_folder_id", valor: process.env.GOOGLE_DRIVE_FOLDER_ID ?? "", descricao: "Pasta raiz compartilhada para Drive institucional" },
  { chave: "google_calendar_primary_id", valor: process.env.GOOGLE_CALENDAR_ID ?? "primary", descricao: "Calendar ID padrão da operação jurídica" },
  { chave: "google_calendar_sync_scope", valor: "operacao_juridica", descricao: "Escopo de sincronização do calendário" },
  { chave: "prazo_alerta_dias", valor: "5", descricao: "Dias de antecedência para emitir alertas de prazo" },
  { chave: "tema", valor: "sistema", descricao: "Tema da interface: 'claro', 'escuro' ou 'sistema'" },
];

const usuariosStore = [...USUARIOS_MOCK];
const configuracoesStore = [...CONFIGURACOES_MOCK];

export class MockAdministracaoRepository implements IAdministracaoRepository {
  async listarUsuarios(): Promise<Usuario[]> {
    return [...usuariosStore].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterUsuarioPorId(id: string): Promise<Usuario | null> {
    return usuariosStore.find((u) => u.id === id) ?? null;
  }

  async convidarUsuario(convite: ConviteUsuario): Promise<Usuario> {
    const novoId = `usr-${String(usuariosStore.length + 1).padStart(3, "0")}`;
    const iniciais = convite.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

    const novo: Usuario = {
      id: novoId,
      nome: convite.nome,
      email: convite.email,
      iniciais,
      perfil: convite.perfil,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    usuariosStore.push(novo);
    return novo;
  }

  async atualizarPerfil(id: string, perfil: PerfilUsuario): Promise<Usuario> {
    const idx = usuariosStore.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`Usuário ${id} não encontrado.`);
    usuariosStore[idx] = { ...usuariosStore[idx], perfil };
    return usuariosStore[idx];
  }

  async ativarDesativar(id: string, ativo: boolean): Promise<Usuario> {
    const idx = usuariosStore.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`Usuário ${id} não encontrado.`);
    usuariosStore[idx] = { ...usuariosStore[idx], ativo };
    return usuariosStore[idx];
  }

  async listarAuditoria(limite = 50): Promise<RegistroAuditoria[]> {
    return AUDITORIA_MOCK.slice(0, limite);
  }

  async obterConfiguracoes(): Promise<ConfiguracaoSistema[]> {
    return [...configuracoesStore];
  }

  async atualizarConfiguracao(chave: string, valor: string): Promise<void> {
    const idx = configuracoesStore.findIndex((c) => c.chave === chave);
    if (idx !== -1) {
      configuracoesStore[idx] = { ...configuracoesStore[idx], valor };
    } else {
      configuracoesStore.push({ chave, valor });
    }
  }
}
