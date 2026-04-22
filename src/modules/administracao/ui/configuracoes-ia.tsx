"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfiguracaoSistema } from "../domain/types";
import type { ModeloCatalogo, ProvedorIA } from "@/lib/ai/provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MoonIcon, SettingsIcon, SparkIcon, SunIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";

type ConfiguracoesIAProps = {
  configuracoes: ConfiguracaoSistema[];
  modelosDisponiveis?: ModeloCatalogo[];
};

type TipoMensagem = "success" | "error" | "warning";

type MensagemUI = {
  tipo: TipoMensagem;
  texto: string;
};

type ModeloAPI = {
  id: string;
  label: string;
  provedor: ProvedorIA;
  provedorLabel: string;
  descricao?: string;
  custo?: ModeloCatalogo["custo"];
  gratuito?: boolean;
  suportaVisao?: boolean;
};

type CampoConexao = {
  chave: string;
  label: string;
  placeholder: string;
  helperText: string;
  obrigatorio?: boolean;
  tipo?: "text" | "password";
};

type PerfilRapido = {
  id: string;
  titulo: string;
  descricao: string;
  provedor: ProvedorIA;
  modelo: string;
  preset: Partial<Record<string, string>>;
};

const LABEL_PROVEDOR: Record<ProvedorIA, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  kilocode: "KiloCode",
  anthropic: "Anthropic",
  google: "Google AI",
  groq: "Groq",
  xai: "xAI",
  mistral: "Mistral AI",
  ollama: "Ollama",
  custom: "Custom",
};

const PROVEDORES_POR_GRUPO: Array<{ titulo: string; provedores: ProvedorIA[] }> = [
  { titulo: "APIs comerciais", provedores: ["openai", "anthropic", "google", "groq", "xai", "mistral"] },
  { titulo: "Gateways multi-modelo", provedores: ["openrouter", "kilocode"] },
  { titulo: "Local e remoto", provedores: ["ollama", "custom"] },
];

const PROVEDORES: ProvedorIA[] = [
  "openai",
  "anthropic",
  "google",
  "groq",
  "xai",
  "mistral",
  "openrouter",
  "kilocode",
  "ollama",
  "custom",
];

const MODELO_PADRAO: Record<ProvedorIA, string> = {
  openai: "gpt-4o-mini",
  openrouter: "anthropic/claude-sonnet-4-5",
  kilocode: "anthropic/claude-sonnet-4-5",
  anthropic: "claude-sonnet-4-5",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  xai: "grok-3-mini",
  mistral: "mistral-large-latest",
  ollama: "kimi-k2.6:cloud",
  custom: "",
};

const CAMPOS_POR_PROVEDOR: Record<ProvedorIA, CampoConexao[]> = {
  openai: [
    {
      chave: "ai_openai_api_key",
      label: "API Key OpenAI",
      tipo: "password",
      obrigatorio: true,
      placeholder: "sk-...",
      helperText: "Chave usada para chamadas diretas da OpenAI.",
    },
  ],
  anthropic: [
    {
      chave: "ai_anthropic_api_key",
      label: "API Key Anthropic",
      tipo: "password",
      obrigatorio: true,
      placeholder: "sk-ant-...",
      helperText: "Chave oficial da Anthropic para modelos Claude.",
    },
  ],
  google: [
    {
      chave: "ai_google_api_key",
      label: "API Key Google AI",
      tipo: "password",
      obrigatorio: true,
      placeholder: "AIza...",
      helperText: "Chave do Google AI Studio / Gemini API.",
    },
  ],
  groq: [
    {
      chave: "ai_groq_api_key",
      label: "API Key Groq",
      tipo: "password",
      obrigatorio: true,
      placeholder: "gsk_...",
      helperText: "Chave da Groq Cloud para inferência acelerada.",
    },
  ],
  xai: [
    {
      chave: "ai_xai_api_key",
      label: "API Key xAI",
      tipo: "password",
      obrigatorio: true,
      placeholder: "xai-...",
      helperText: "Chave para uso de modelos Grok via API xAI.",
    },
  ],
  mistral: [
    {
      chave: "ai_mistral_api_key",
      label: "API Key Mistral",
      tipo: "password",
      obrigatorio: true,
      placeholder: "mistral-...",
      helperText: "Chave oficial da Mistral AI.",
    },
  ],
  openrouter: [
    {
      chave: "ai_openrouter_api_key",
      label: "API Key OpenRouter",
      tipo: "password",
      obrigatorio: true,
      placeholder: "sk-or-...",
      helperText: "Gateway multi-modelo para Anthropic, Google, Meta e outros.",
    },
  ],
  kilocode: [
    {
      chave: "ai_kilocode_api_key",
      label: "API Key KiloCode",
      tipo: "password",
      obrigatorio: true,
      placeholder: "kilo-...",
      helperText: "Gateway KiloCode para billing e roteamento unificado.",
    },
  ],
  ollama: [
    {
      chave: "ai_ollama_base_url",
      label: "Base URL Ollama",
      obrigatorio: true,
      placeholder: "http://localhost:11434",
      helperText: "Aceita endpoint nativo (http://host:11434) ou OpenAI-compatible com /v1.",
    },
    {
      chave: "ai_ollama_api_key",
      label: "API Key Ollama (opcional)",
      tipo: "password",
      placeholder: "tok_...",
      helperText: "Necessária quando a instância remota exige autenticação (ex.: Ollama Pro).",
    },
  ],
  custom: [
    {
      chave: "ai_custom_base_url",
      label: "Base URL custom",
      obrigatorio: true,
      placeholder: "https://seu-endpoint/v1",
      helperText: "Endpoint compatível com API OpenAI (LM Studio, LocalAI, vLLM, etc).",
    },
    {
      chave: "ai_custom_api_key",
      label: "API Key custom (opcional)",
      tipo: "password",
      placeholder: "token-ou-chave",
      helperText: "Se o endpoint exigir autenticação, informe a chave aqui.",
    },
  ],
};

const PERFIS_RAPIDOS: PerfilRapido[] = [
  {
    id: "ollama-pro-kimi",
    titulo: "Ollama Pro + Kimi K2.6",
    descricao: "Operação intensiva sem GPU local. Perfil recomendado para produção jurídica.",
    provedor: "ollama",
    modelo: "kimi-k2.6:cloud",
    preset: {
      ai_ollama_base_url: "https://ollama.com/api",
    },
  },
  {
    id: "openai-balanced",
    titulo: "OpenAI balanceado",
    descricao: "Setup rápido com GPT-4o Mini para custo/latência controlados.",
    provedor: "openai",
    modelo: "gpt-4o-mini",
    preset: {},
  },
  {
    id: "openrouter-fallback",
    titulo: "OpenRouter multi-modelo",
    descricao: "Um gateway para alternar provedores com uma única credencial.",
    provedor: "openrouter",
    modelo: "anthropic/claude-sonnet-4-5",
    preset: {},
  },
];

const CHAVES_CONEXAO_MONITORADAS = [
  "ai_provider",
  "ai_model",
  "ai_openai_api_key",
  "ai_openrouter_api_key",
  "ai_kilocode_api_key",
  "ai_anthropic_api_key",
  "ai_google_api_key",
  "ai_groq_api_key",
  "ai_xai_api_key",
  "ai_mistral_api_key",
  "ai_ollama_base_url",
  "ai_ollama_api_key",
  "ai_custom_base_url",
  "ai_custom_api_key",
] as const;

const CUSTO_LABEL: Record<ModeloCatalogo["custo"], string> = {
  gratuito: "Gratuito",
  local: "Local",
  baixo: "Baixo custo",
  medio: "Custo médio",
  alto: "Alto custo",
  desconhecido: "Sem custo definido",
};

function aplicarTema(valor: "claro" | "escuro" | "sistema") {
  if (valor === "escuro") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("jgg-theme", "dark");
    return;
  }
  if (valor === "claro") {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("jgg-theme", "light");
    return;
  }
  localStorage.removeItem("jgg-theme");
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function normalizarModeloDinamico(item: ModeloAPI): ModeloCatalogo {
  return {
    id: item.id,
    label: item.label ?? item.id,
    provedor: item.provedor,
    provedorLabel: item.provedorLabel ?? LABEL_PROVEDOR[item.provedor],
    descricao: item.descricao ?? "Modelo detectado dinamicamente no provedor configurado.",
    suportaVisao: Boolean(item.suportaVisao),
    suportaStructuredOutput: true,
    custo: item.custo ?? (item.gratuito ? "gratuito" : "desconhecido"),
    recomendado: item.id === "kimi-k2.6:cloud",
  };
}

async function salvarConfiguracoes(updates: Array<{ chave: string; valor: string }>) {
  const res = await fetch("/api/administracao/configuracoes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  const payload = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(payload.error ?? "Falha ao salvar configurações.");
  }
}

function toStatusVariant(ok: boolean): "sucesso" | "alerta" {
  return ok ? "sucesso" : "alerta";
}

export function ConfiguracoesIA({ configuracoes, modelosDisponiveis = [] }: ConfiguracoesIAProps) {
  const valoresIniciais = useMemo(
    () => Object.fromEntries(configuracoes.map((config) => [config.chave, config.valor])),
    [configuracoes],
  );

  const [valores, setValores] = useState<Record<string, string>>(valoresIniciais);
  const [baselineConexao, setBaselineConexao] = useState<Record<string, string>>(valoresIniciais);

  const [mensagemConexao, setMensagemConexao] = useState<MensagemUI | null>(null);
  const [mensagemTeste, setMensagemTeste] = useState<MensagemUI | null>(null);
  const [mensagemGeral, setMensagemGeral] = useState<MensagemUI | null>(null);

  const [salvandoConexao, setSalvandoConexao] = useState(false);
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState<string | null>(null);

  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [erroModelos, setErroModelos] = useState<string | null>(null);
  const [modelosDinamicos, setModelosDinamicos] = useState<ModeloCatalogo[]>([]);
  const [statusProvedorAtivo, setStatusProvedorAtivo] = useState<boolean>(false);

  const [etapaAtiva, setEtapaAtiva] = useState<1 | 2 | 3 | 4>(1);
  const [buscaModelo, setBuscaModelo] = useState("");
  const [mostrarTodosModelos, setMostrarTodosModelos] = useState(false);

  useEffect(() => {
    setValores(valoresIniciais);
    setBaselineConexao(valoresIniciais);
  }, [valoresIniciais]);

  const provedorAtual = (valores.ai_provider ?? "openai") as ProvedorIA;
  const modeloAtual = valores.ai_model ?? "";
  const camposConexao = CAMPOS_POR_PROVEDOR[provedorAtual];

  const camposObrigatoriosPendentes = camposConexao
    .filter((campo) => campo.obrigatorio)
    .filter((campo) => !(valores[campo.chave] ?? "").trim());

  const credenciaisOk = camposObrigatoriosPendentes.length === 0;
  const modeloOk = Boolean(modeloAtual.trim());

  const possuiAlteracoesPendentes = CHAVES_CONEXAO_MONITORADAS.some(
    (chave) => (valores[chave] ?? "").trim() !== (baselineConexao[chave] ?? "").trim(),
  );

  const modelosUnificados = useMemo(() => {
    const mapa = new Map<string, ModeloCatalogo>();
    for (const item of modelosDisponiveis) mapa.set(`${item.provedor}:${item.id}`, item);
    for (const item of modelosDinamicos) mapa.set(`${item.provedor}:${item.id}`, item);
    return Array.from(mapa.values()).sort((a, b) => {
      const recomendadoDiff = Number(b.recomendado) - Number(a.recomendado);
      if (recomendadoDiff !== 0) return recomendadoDiff;
      return a.label.localeCompare(b.label);
    });
  }, [modelosDisponiveis, modelosDinamicos]);

  const modelosDoProvedor = useMemo(
    () => modelosUnificados.filter((item) => item.provedor === provedorAtual),
    [modelosUnificados, provedorAtual],
  );

  const modelosFiltrados = useMemo(() => {
    if (!buscaModelo.trim()) return modelosDoProvedor;
    const termo = buscaModelo.toLowerCase();
    return modelosDoProvedor.filter((item) =>
      `${item.id} ${item.label} ${item.descricao}`.toLowerCase().includes(termo),
    );
  }, [buscaModelo, modelosDoProvedor]);

  const modelosVisiveis = mostrarTodosModelos ? modelosFiltrados : modelosFiltrados.slice(0, 8);
  const modelosRecomendados = modelosDoProvedor.filter((item) => item.recomendado).slice(0, 3);

  const carregarDiagnosticoIA = useCallback(async () => {
    setCarregandoModelos(true);
    setErroModelos(null);
    try {
      const [resConfig, resModelos] = await Promise.all([
        fetch("/api/ai/config", { cache: "no-store" }),
        fetch("/api/ai/models", { cache: "no-store" }),
      ]);

      const payloadConfig = (await resConfig.json()) as {
        modelos?: Array<{ provedor: string; disponivel: boolean }>;
      };

      if (resConfig.ok && Array.isArray(payloadConfig.modelos)) {
        const disponivelAtual = payloadConfig.modelos.some(
          (item) => item.provedor === provedorAtual && item.disponivel,
        );
        setStatusProvedorAtivo(disponivelAtual);
      } else {
        setStatusProvedorAtivo(false);
      }

      const payloadModelos = (await resModelos.json()) as { modelos?: ModeloAPI[]; error?: string };
      if (!resModelos.ok) {
        throw new Error(payloadModelos.error ?? "Não foi possível carregar modelos dinâmicos.");
      }
      setModelosDinamicos((payloadModelos.modelos ?? []).map(normalizarModeloDinamico));
    } catch (error) {
      setErroModelos(error instanceof Error ? error.message : "Falha ao carregar catálogo de modelos.");
      setStatusProvedorAtivo(false);
    } finally {
      setCarregandoModelos(false);
    }
  }, [provedorAtual]);

  useEffect(() => {
    void carregarDiagnosticoIA();
  }, [carregarDiagnosticoIA]);

  useEffect(() => {
    setBuscaModelo("");
    setMostrarTodosModelos(false);
  }, [provedorAtual]);

  const registrarResultadoTeste = useCallback(
    async (status: "success" | "error", mensagem: string) => {
      const updates = [
        { chave: "ai_last_tested_at", valor: new Date().toISOString() },
        { chave: "ai_last_tested_provider", valor: provedorAtual },
        { chave: "ai_last_tested_model", valor: modeloAtual.trim() },
        { chave: "ai_last_test_status", valor: status },
        { chave: "ai_last_test_message", valor: mensagem.slice(0, 500) },
      ];
      await salvarConfiguracoes(updates);
      setValores((prev) => ({
        ...prev,
        ai_last_tested_at: updates[0].valor,
        ai_last_tested_provider: updates[1].valor,
        ai_last_tested_model: updates[2].valor,
        ai_last_test_status: updates[3].valor,
        ai_last_test_message: updates[4].valor,
      }));
    },
    [modeloAtual, provedorAtual],
  );

  function selecionarProvedor(provedor: ProvedorIA) {
    setValores((prev) => ({
      ...prev,
      ai_provider: provedor,
      ai_model: MODELO_PADRAO[provedor],
    }));
    setMensagemConexao(null);
    setMensagemTeste(null);
    setEtapaAtiva(2);
    setStatusProvedorAtivo(false);
  }

  function aplicarPerfilRapido(perfil: PerfilRapido) {
    setValores((prev) => ({
      ...prev,
      ai_provider: perfil.provedor,
      ai_model: perfil.modelo,
      ...perfil.preset,
    }));
    setMensagemConexao({
      tipo: "success",
      texto: `Perfil "${perfil.titulo}" aplicado. Informe as credenciais pendentes e teste a conexão.`,
    });
    setMensagemTeste(null);
    setEtapaAtiva(2);
    setStatusProvedorAtivo(false);
  }

  async function salvarConexaoIA() {
    setMensagemConexao(null);
    setMensagemTeste(null);

    if (!modeloAtual.trim()) {
      setMensagemConexao({ tipo: "warning", texto: "Informe um modelo de IA antes de salvar a conexão." });
      setEtapaAtiva(3);
      return;
    }

    if (camposObrigatoriosPendentes.length > 0) {
      setMensagemConexao({
        tipo: "warning",
        texto: `Campos obrigatórios pendentes: ${camposObrigatoriosPendentes.map((item) => item.label).join(", ")}.`,
      });
      setEtapaAtiva(2);
      return;
    }

    setSalvandoConexao(true);
    try {
      const updates = [
        { chave: "ai_provider", valor: provedorAtual },
        { chave: "ai_model", valor: modeloAtual.trim() },
        ...camposConexao.map((campo) => ({
          chave: campo.chave,
          valor: (valores[campo.chave] ?? "").trim(),
        })),
      ];
      await salvarConfiguracoes(updates);

      const updatesObj = Object.fromEntries(updates.map((item) => [item.chave, item.valor]));
      setValores((prev) => ({ ...prev, ...updatesObj }));
      setBaselineConexao((prev) => ({ ...prev, ...updatesObj }));

      setMensagemConexao({
        tipo: "success",
        texto: "Provedor e credenciais salvos. O runtime da plataforma foi atualizado.",
      });
      setEtapaAtiva(4);
      await carregarDiagnosticoIA();
    } catch (error) {
      setMensagemConexao({
        tipo: "error",
        texto: error instanceof Error ? error.message : "Falha ao salvar conexão de IA.",
      });
    } finally {
      setSalvandoConexao(false);
    }
  }

  async function testarConexaoIA() {
    setMensagemTeste(null);

    if (!modeloAtual.trim()) {
      setMensagemTeste({ tipo: "warning", texto: "Informe um modelo antes de testar a conexão." });
      setEtapaAtiva(3);
      return;
    }

    if (camposObrigatoriosPendentes.length > 0) {
      setMensagemTeste({
        tipo: "warning",
        texto: `Campos obrigatórios pendentes: ${camposObrigatoriosPendentes.map((item) => item.label).join(", ")}.`,
      });
      setEtapaAtiva(2);
      return;
    }

    setTestandoConexao(true);
    try {
      const credenciais = Object.fromEntries(
        Object.entries(valores).filter(
          ([chave]) => chave.startsWith("ai_") && chave !== "ai_provider" && chave !== "ai_model",
        ),
      );

      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provedorAtual,
          modelId: modeloAtual.trim(),
          credentials: credenciais,
        }),
      });

      const payload = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        const msg = payload.error ?? "Falha ao testar conexão com o provedor.";
        setStatusProvedorAtivo(false);
        setMensagemTeste({ tipo: "error", texto: msg });
        await registrarResultadoTeste("error", msg);
        setEtapaAtiva(4);
        return;
      }

      const msg = payload.message ?? "Conexão validada com sucesso.";
      setStatusProvedorAtivo(true);
      setMensagemTeste({ tipo: "success", texto: msg });
      await registrarResultadoTeste("success", msg);
      setEtapaAtiva(4);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha inesperada no teste de conexão.";
      setStatusProvedorAtivo(false);
      setMensagemTeste({ tipo: "error", texto: msg });
      try {
        await registrarResultadoTeste("error", msg);
      } catch {
        // Não bloqueia o fluxo caso a auditoria operacional falhe.
      }
    } finally {
      setTestandoConexao(false);
    }
  }

  async function salvarCampoGeral(chave: "nome_escritorio" | "prazo_alerta_dias" | "tema") {
    setSalvandoCampo(chave);
    setMensagemGeral(null);
    try {
      await salvarConfiguracoes([{ chave, valor: (valores[chave] ?? "").trim() }]);
      setMensagemGeral({ tipo: "success", texto: "Configuração geral salva com sucesso." });
    } catch (error) {
      setMensagemGeral({
        tipo: "error",
        texto: error instanceof Error ? error.message : "Falha ao salvar configuração geral.",
      });
    } finally {
      setSalvandoCampo(null);
    }
  }

  const checklist = [
    { id: 1 as const, label: "Provedor definido", ok: PROVEDORES.includes(provedorAtual) },
    { id: 2 as const, label: "Credenciais completas", ok: credenciaisOk },
    { id: 3 as const, label: "Modelo selecionado", ok: modeloOk },
    { id: 4 as const, label: "Conexão testada", ok: statusProvedorAtivo },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Assistente de configuração da IA</h3>
            <StatusBadge
              label={possuiAlteracoesPendentes ? "Alterações pendentes" : "Configuração sincronizada"}
              variant={possuiAlteracoesPendentes ? "alerta" : "sucesso"}
            />
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Fluxo recomendado: escolha um provedor, preencha credenciais, selecione modelo e teste a conexão antes de
            ativar.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setEtapaAtiva(item.id)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                etapaAtiva === item.id
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-card-strong)]"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Etapa {item.id}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{item.label}</p>
              <div className="mt-2">
                <StatusBadge label={item.ok ? "Concluída" : "Pendente"} variant={toStatusVariant(item.ok)} />
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Perfis prontos</p>
            <span className="text-xs text-[var(--color-muted)]">Atalho para pré-configurar provedor e modelo</span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {PERFIS_RAPIDOS.map((perfil) => (
              <button
                key={perfil.id}
                type="button"
                onClick={() => aplicarPerfilRapido(perfil)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 text-left transition hover:border-[var(--color-accent)]/40"
              >
                <p className="text-sm font-semibold text-[var(--color-ink)]">{perfil.titulo}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{perfil.descricao}</p>
                <p className="mt-2 text-[11px] font-medium text-[var(--color-muted)]">
                  {LABEL_PROVEDOR[perfil.provedor]} · <span className="font-mono">{perfil.modelo}</span>
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">1. Provedor de IA</p>
            <p className="text-xs text-[var(--color-muted)]">
              Selecione o gateway que a plataforma usará como padrão para os agentes.
            </p>
          </div>

          {PROVEDORES_POR_GRUPO.map((grupo) => (
            <div key={grupo.titulo} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                {grupo.titulo}
              </p>
              <div className="flex flex-wrap gap-2">
                {grupo.provedores.map((provedor) => (
                  <button
                    key={provedor}
                    type="button"
                    onClick={() => selecionarProvedor(provedor)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                      provedorAtual === provedor
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                    }`}
                  >
                    {LABEL_PROVEDOR[provedor]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">2. Credenciais do provedor</p>
            <p className="text-xs text-[var(--color-muted)]">
              Provedor ativo: {LABEL_PROVEDOR[provedorAtual]}. Informe os campos obrigatórios para autenticação.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {camposConexao.map((campo) => (
              <TextInput
                key={campo.chave}
                label={campo.label}
                value={valores[campo.chave] ?? ""}
                onChange={(event) =>
                  setValores((prev) => ({
                    ...prev,
                    [campo.chave]: event.target.value,
                  }))
                }
                placeholder={campo.placeholder}
                helperText={campo.helperText}
                type={campo.tipo ?? "text"}
                requiredMark={campo.obrigatorio}
              />
            ))}
          </div>

          {provedorAtual === "ollama" ? (
            <InlineAlert title="Formato aceito de URL Ollama" variant="info">
              Use a URL base nativa (<span className="font-mono">http://localhost:11434</span> ou{" "}
              <span className="font-mono">https://ollama.com/api</span>) ou endpoint OpenAI-compatible finalizando em{" "}
              <span className="font-mono">/v1</span>.
            </InlineAlert>
          ) : null}

          {!credenciaisOk ? (
            <InlineAlert title="Campos obrigatórios pendentes" variant="warning">
              {camposObrigatoriosPendentes.map((item) => item.label).join(", ")}
            </InlineAlert>
          ) : (
            <InlineAlert title="Credenciais completas" variant="success">
              Todos os campos obrigatórios do provedor selecionado foram preenchidos.
            </InlineAlert>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">3. Modelo de IA</p>
            <p className="text-xs text-[var(--color-muted)]">
              Selecione um modelo sugerido ou informe manualmente o ID exato.
            </p>
          </div>

          <TextInput
            label="ID do modelo"
            value={modeloAtual}
            onChange={(event) =>
              setValores((prev) => ({
                ...prev,
                ai_model: event.target.value,
              }))
            }
            placeholder={MODELO_PADRAO[provedorAtual] || "id-do-modelo"}
            helperText="Exemplos: gpt-4o-mini, anthropic/claude-sonnet-4-5, kimi-k2.6:cloud."
            className="font-mono"
            requiredMark
          />

          {modelosRecomendados.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Sugestões recomendadas
              </p>
              <div className="flex flex-wrap gap-2">
                {modelosRecomendados.map((modelo) => (
                  <button
                    key={`recomendado:${modelo.provedor}:${modelo.id}`}
                    type="button"
                    onClick={() => setValores((prev) => ({ ...prev, ai_model: modelo.id }))}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)]/40"
                  >
                    <SparkIcon size={14} className="mr-1 inline-block" />
                    <span className="font-mono">{modelo.id}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Catálogo detectado ({LABEL_PROVEDOR[provedorAtual]})
              </p>
              <button
                type="button"
                onClick={() => void carregarDiagnosticoIA()}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                Atualizar lista
              </button>
            </div>

            <TextInput
              label="Buscar modelo"
              value={buscaModelo}
              onChange={(event) => setBuscaModelo(event.target.value)}
              placeholder="Filtrar por ID, nome ou descrição"
            />

            {carregandoModelos ? <p className="mt-3 text-xs text-[var(--color-muted)]">Atualizando modelos...</p> : null}
            {erroModelos ? (
              <InlineAlert className="mt-3" title="Falha no catálogo" variant="warning">
                {erroModelos}
              </InlineAlert>
            ) : null}

            {!carregandoModelos && modelosFiltrados.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--color-muted)]">Nenhum modelo detectado para este provedor.</p>
            ) : null}

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {modelosVisiveis.map((modelo) => (
                <button
                  key={`${modelo.provedor}:${modelo.id}`}
                  type="button"
                  onClick={() => setValores((prev) => ({ ...prev, ai_model: modelo.id }))}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    modeloAtual === modelo.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                      : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[var(--color-ink)]">{modelo.id}</span>
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
                      {CUSTO_LABEL[modelo.custo]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{modelo.label}</p>
                </button>
              ))}
            </div>

            {modelosFiltrados.length > 8 ? (
              <button
                type="button"
                onClick={() => setMostrarTodosModelos((prev) => !prev)}
                className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                {mostrarTodosModelos ? "Mostrar menos" : `Mostrar todos (${modelosFiltrados.length})`}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">4. Validação e ativação</p>
            <p className="text-xs text-[var(--color-muted)]">
              Teste a conexão com as credenciais preenchidas e salve para aplicar o provedor na operação.
            </p>
          </div>

          {mensagemConexao ? (
            <InlineAlert
              title={mensagemConexao.tipo === "success" ? "Configuração aplicada" : "Atenção na configuração"}
              variant={mensagemConexao.tipo === "success" ? "success" : "warning"}
            >
              {mensagemConexao.texto}
            </InlineAlert>
          ) : null}

          {mensagemTeste ? (
            <InlineAlert
              title={mensagemTeste.tipo === "success" ? "Teste concluído" : "Falha no teste"}
              variant={mensagemTeste.tipo === "success" ? "success" : "warning"}
            >
              {mensagemTeste.texto}
            </InlineAlert>
          ) : null}

          <InlineAlert
            title={statusProvedorAtivo ? "Provedor autenticado" : "Provedor sem credencial válida"}
            variant={statusProvedorAtivo ? "success" : "warning"}
          >
            {statusProvedorAtivo
              ? "A conexão com o provedor foi validada e está pronta para uso."
              : "Configure credenciais, teste a conexão e salve para ativar o provedor na operação."}
          </InlineAlert>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void testarConexaoIA()}
              disabled={testandoConexao || salvandoConexao}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
            >
              {testandoConexao ? "Testando conexão..." : "Testar conexão"}
            </button>
            <button
              type="button"
              onClick={() => void salvarConexaoIA()}
              disabled={salvandoConexao || testandoConexao}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {salvandoConexao ? "Salvando..." : "Salvar e ativar provedor"}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Configurações gerais</h3>
          <p className="text-xs text-[var(--color-muted)]">Preferências visuais e operacionais da plataforma.</p>
        </div>

        <TextInput
          label="Nome do escritório"
          value={valores.nome_escritorio ?? ""}
          onChange={(event) => setValores((prev) => ({ ...prev, nome_escritorio: event.target.value }))}
          helperText="Nome exibido em áreas institucionais e cabeçalho do hub."
        />
        <button
          type="button"
          onClick={() => void salvarCampoGeral("nome_escritorio")}
          disabled={salvandoCampo === "nome_escritorio"}
          className="w-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
        >
          {salvandoCampo === "nome_escritorio" ? "Salvando..." : "Salvar nome do escritório"}
        </button>

        <TextInput
          label="Alertas de prazo (dias)"
          type="number"
          min={0}
          value={valores.prazo_alerta_dias ?? "5"}
          onChange={(event) => setValores((prev) => ({ ...prev, prazo_alerta_dias: event.target.value }))}
          helperText="Quantidade de dias de antecedência para alertas de vencimento."
        />
        <button
          type="button"
          onClick={() => void salvarCampoGeral("prazo_alerta_dias")}
          disabled={salvandoCampo === "prazo_alerta_dias"}
          className="w-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
        >
          {salvandoCampo === "prazo_alerta_dias" ? "Salvando..." : "Salvar alerta de prazo"}
        </button>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Tema da interface</p>
          <div className="flex flex-wrap gap-2">
            {[
              { valor: "claro", label: "Claro", icon: SunIcon },
              { valor: "escuro", label: "Escuro", icon: MoonIcon },
              { valor: "sistema", label: "Sistema", icon: SettingsIcon },
            ].map((tema) => (
              <button
                key={tema.valor}
                type="button"
                onClick={() => {
                  setValores((prev) => ({ ...prev, tema: tema.valor }));
                  aplicarTema(tema.valor as "claro" | "escuro" | "sistema");
                }}
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                  (valores.tema ?? "sistema") === tema.valor
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <tema.icon size={14} />
                  {tema.label}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void salvarCampoGeral("tema")}
            disabled={salvandoCampo === "tema"}
            className="w-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
          >
            {salvandoCampo === "tema" ? "Salvando..." : "Salvar tema"}
          </button>
        </div>

        {mensagemGeral ? (
          <InlineAlert
            title={mensagemGeral.tipo === "success" ? "Configurações salvas" : "Falha ao salvar"}
            variant={mensagemGeral.tipo === "success" ? "success" : "warning"}
          >
            {mensagemGeral.texto}
          </InlineAlert>
        ) : null}
      </section>
    </div>
  );
}
