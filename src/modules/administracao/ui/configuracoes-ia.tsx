"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfiguracaoSistema } from "../domain/types";
import type { ModeloCatalogo, ProvedorIA } from "@/lib/ai/provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MoonIcon, SettingsIcon, SunIcon } from "@/components/ui/icons";
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
      helperText: "Gateway multi-modelo para provedores como Anthropic, Google e Meta.",
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
      helperText: "Endpoint do Ollama local ou remoto (Ollama Pro).",
    },
    {
      chave: "ai_ollama_api_key",
      label: "API Key Ollama (opcional)",
      tipo: "password",
      placeholder: "tok_...",
      helperText: "Necessária quando o endpoint remoto exige autenticação.",
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

export function ConfiguracoesIA({ configuracoes, modelosDisponiveis = [] }: ConfiguracoesIAProps) {
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(configuracoes.map((config) => [config.chave, config.valor])),
  );

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

  const provedorAtual = (valores.ai_provider ?? "openai") as ProvedorIA;
  const modeloAtual = valores.ai_model ?? "";

  const modelosUnificados = useMemo(() => {
    const mapa = new Map<string, ModeloCatalogo>();
    for (const item of modelosDisponiveis) mapa.set(`${item.provedor}:${item.id}`, item);
    for (const item of modelosDinamicos) mapa.set(`${item.provedor}:${item.id}`, item);
    return Array.from(mapa.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [modelosDisponiveis, modelosDinamicos]);

  const modelosDoProvedor = modelosUnificados.filter((item) => item.provedor === provedorAtual);
  const camposConexao = CAMPOS_POR_PROVEDOR[provedorAtual];

  const carregarDiagnosticoIA = useCallback(async () => {
    setCarregandoModelos(true);
    setErroModelos(null);
    setStatusProvedorAtivo(false);
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
      }

      const payloadModelos = (await resModelos.json()) as { modelos?: ModeloAPI[]; error?: string };
      if (!resModelos.ok) {
        throw new Error(payloadModelos.error ?? "Não foi possível carregar modelos dinâmicos.");
      }

      setModelosDinamicos((payloadModelos.modelos ?? []).map(normalizarModeloDinamico));
    } catch (error) {
      setErroModelos(error instanceof Error ? error.message : "Falha ao carregar catálogo de modelos.");
    } finally {
      setCarregandoModelos(false);
    }
  }, [provedorAtual]);

  useEffect(() => {
    void carregarDiagnosticoIA();
  }, [carregarDiagnosticoIA]);

  async function salvarConexaoIA() {
    setMensagemConexao(null);
    setMensagemTeste(null);
    const faltantes = camposConexao
      .filter((campo) => campo.obrigatorio)
      .filter((campo) => !(valores[campo.chave] ?? "").trim());

    if (!modeloAtual.trim()) {
      setMensagemConexao({ tipo: "warning", texto: "Informe um modelo de IA antes de salvar a conexão." });
      return;
    }

    if (faltantes.length > 0) {
      setMensagemConexao({
        tipo: "warning",
        texto: `Campos obrigatórios pendentes: ${faltantes.map((item) => item.label).join(", ")}.`,
      });
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
      setMensagemConexao({
        tipo: "success",
        texto: "Conexão de IA salva. O runtime foi atualizado imediatamente.",
      });
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
    const faltantes = camposConexao
      .filter((campo) => campo.obrigatorio)
      .filter((campo) => !(valores[campo.chave] ?? "").trim());

    if (!modeloAtual.trim()) {
      setMensagemTeste({ tipo: "warning", texto: "Informe um modelo antes de testar a conexão." });
      return;
    }

    if (faltantes.length > 0) {
      setMensagemTeste({
        tipo: "warning",
        texto: `Campos obrigatórios pendentes: ${faltantes.map((item) => item.label).join(", ")}.`,
      });
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
      const payload = (await res.json()) as { error?: string; message?: string; modelCount?: number };
      const testedAt = new Date().toISOString();

      if (!res.ok) {
        setStatusProvedorAtivo(false);
        setMensagemTeste({
          tipo: "error",
          texto: payload.error ?? "Falha ao testar conexão com o provedor.",
        });
        await salvarConfiguracoes([
          { chave: "ai_last_tested_at", valor: testedAt },
          { chave: "ai_last_tested_provider", valor: provedorAtual },
          { chave: "ai_last_tested_model", valor: modeloAtual.trim() },
          { chave: "ai_last_test_status", valor: "error" },
          { chave: "ai_last_test_message", valor: (payload.error ?? "Falha na conexão").slice(0, 500) },
        ]);
        return;
      }

      setStatusProvedorAtivo(true);
      setMensagemTeste({
        tipo: "success",
        texto: payload.message ?? "Conexão validada com sucesso.",
      });
      await salvarConfiguracoes([
        { chave: "ai_last_tested_at", valor: testedAt },
        { chave: "ai_last_tested_provider", valor: provedorAtual },
        { chave: "ai_last_tested_model", valor: modeloAtual.trim() },
        { chave: "ai_last_test_status", valor: "success" },
        { chave: "ai_last_test_message", valor: (payload.message ?? "Conexão validada com sucesso.").slice(0, 500) },
      ]);
    } catch (error) {
      setStatusProvedorAtivo(false);
      setMensagemTeste({
        tipo: "error",
        texto: error instanceof Error ? error.message : "Falha inesperada no teste de conexão.",
      });
      try {
        await salvarConfiguracoes([
          { chave: "ai_last_tested_at", valor: new Date().toISOString() },
          { chave: "ai_last_tested_provider", valor: provedorAtual },
          { chave: "ai_last_tested_model", valor: modeloAtual.trim() },
          { chave: "ai_last_test_status", valor: "error" },
          {
            chave: "ai_last_test_message",
            valor: (error instanceof Error ? error.message : "Falha inesperada no teste de conexão.").slice(0, 500),
          },
        ]);
      } catch {
        // Não interrompe UX se falhar o registro de auditoria operacional.
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

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Conexão da IA</h3>
          <p className="text-xs text-[var(--color-muted)]">
            Escolha o provedor, informe credenciais e defina o modelo padrão.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROVEDORES.map((provedor) => (
            <button
              key={provedor}
              type="button"
              onClick={() =>
                setValores((prev) => ({
                  ...prev,
                  ai_provider: provedor,
                  ai_model: MODELO_PADRAO[provedor],
                }))
              }
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

        <TextInput
          label="Modelo padrão"
          value={modeloAtual}
          onChange={(event) =>
            setValores((prev) => ({
              ...prev,
              ai_model: event.target.value,
            }))
          }
          placeholder={MODELO_PADRAO[provedorAtual] || "id-do-modelo"}
          helperText="Use o ID exato do modelo que será utilizado pelos agentes."
          className="font-mono"
          requiredMark
        />

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Catálogo de modelos ({LABEL_PROVEDOR[provedorAtual]})
            </p>
            <button
              type="button"
              onClick={() => void carregarDiagnosticoIA()}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Atualizar
            </button>
          </div>

          {carregandoModelos ? <p className="text-xs text-[var(--color-muted)]">Atualizando modelos...</p> : null}
          {erroModelos ? (
            <InlineAlert title="Falha no catálogo" variant="warning">
              {erroModelos}
            </InlineAlert>
          ) : null}

          {!carregandoModelos && modelosDoProvedor.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">Nenhum modelo detectado para este provedor.</p>
          ) : null}

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {modelosDoProvedor.map((modelo) => (
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
        </div>

        {mensagemConexao ? (
          <InlineAlert
            title={mensagemConexao.tipo === "success" ? "Conexão atualizada" : "Atenção na conexão"}
            variant={mensagemConexao.tipo === "success" ? "success" : "warning"}
          >
            {mensagemConexao.texto}
          </InlineAlert>
        ) : null}

        {mensagemTeste ? (
          <InlineAlert
            title={mensagemTeste.tipo === "success" ? "Teste de conexão concluído" : "Teste de conexão"}
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
            ? "As credenciais do provedor ativo foram detectadas."
            : "Configure os campos obrigatórios e salve para habilitar chamadas de IA."}
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
            {salvandoConexao ? "Salvando conexão..." : "Salvar conexão de IA"}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Configurações gerais</h3>
          <p className="text-xs text-[var(--color-muted)]">
            Preferências visuais e operacionais da plataforma.
          </p>
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
