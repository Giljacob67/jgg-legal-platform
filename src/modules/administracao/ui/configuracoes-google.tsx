"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConfiguracaoSistema } from "@/modules/administracao/domain/types";
import {
  avaliarGoogleWorkspace,
  extrairGoogleWorkspaceConfig,
  type GoogleAuthMode,
} from "@/modules/administracao/domain/google-workspace";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import { TextareaInput } from "@/components/ui/textarea-input";

type ConfiguracoesGoogleProps = {
  configuracoes: ConfiguracaoSistema[];
};

type TipoMensagem = "success" | "error";

type MensagemUI = {
  tipo: TipoMensagem;
  texto: string;
};

const AUTH_OPTIONS = [
  { value: "service_account", label: "Service Account institucional" },
  { value: "oauth_usuario", label: "OAuth por usuário" },
  { value: "hibrido", label: "Híbrido: OAuth + Service Account" },
];

const GOOGLE_KEYS = [
  "google_auth_mode",
  "google_oauth_client_id",
  "google_oauth_client_secret",
  "google_oauth_redirect_uri",
  "google_service_account_key",
  "google_drive_shared_folder_id",
  "google_calendar_primary_id",
  "google_calendar_sync_scope",
] as const;

export function ConfiguracoesGoogle({ configuracoes }: ConfiguracoesGoogleProps) {
  const valoresIniciais = useMemo(
    () => Object.fromEntries(configuracoes.map((item) => [item.chave, item.valor])),
    [configuracoes],
  );

  const [valores, setValores] = useState<Record<string, string>>(valoresIniciais);
  const [baseline, setBaseline] = useState<Record<string, string>>(valoresIniciais);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<MensagemUI | null>(null);

  useEffect(() => {
    setValores(valoresIniciais);
    setBaseline(valoresIniciais);
  }, [valoresIniciais]);

  const authMode = (valores.google_auth_mode || "service_account") as GoogleAuthMode;
  const readiness = avaliarGoogleWorkspace(
    extrairGoogleWorkspaceConfig(
      GOOGLE_KEYS.map((chave) => ({
        chave,
        valor: valores[chave] ?? "",
      })),
    ),
  );

  const possuiAlteracoes = GOOGLE_KEYS.some(
    (chave) => (valores[chave] ?? "") !== (baseline[chave] ?? ""),
  );

  const mostrarOAuth = authMode === "oauth_usuario" || authMode === "hibrido";
  const mostrarServiceAccount = authMode === "service_account" || authMode === "hibrido";

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    try {
      const updates = GOOGLE_KEYS.map((chave) => ({
        chave,
        valor: valores[chave] ?? "",
      }));

      const res = await fetch("/api/administracao/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Falha ao salvar configurações Google.");
      }

      setBaseline(valores);

      setMensagem({
        tipo: "success",
        texto: "Configuração Google atualizada. A fundação para Agenda e Drive Explorer já pode usar esses dados.",
      });
    } catch (error) {
      setMensagem({
        tipo: "error",
        texto: error instanceof Error ? error.message : "Falha ao salvar configurações Google.",
      });
    } finally {
      setSalvando(false);
    }
  }

  function atualizar(chave: (typeof GOOGLE_KEYS)[number], valor: string) {
    setValores((atual) => ({ ...atual, [chave]: valor }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Agenda Google</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Visão tipo Calendar com compromissos do jurídico.
              </p>
            </div>
            <StatusBadge label={readiness.agendaOk ? "pronta" : "pendente"} variant={readiness.agendaOk ? "sucesso" : "alerta"} />
          </div>
        </div>
        <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Drive Explorer</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Navegação direta de pastas e arquivos operacionais.
              </p>
            </div>
            <StatusBadge label={readiness.driveExplorerOk ? "pronto" : "pendente"} variant={readiness.driveExplorerOk ? "sucesso" : "alerta"} />
          </div>
        </div>
        <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Biblioteca via Drive</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Sync institucional para indexação e RAG.
              </p>
            </div>
            <StatusBadge label={readiness.bibliotecaSyncOk ? "pronta" : "pendente"} variant={readiness.bibliotecaSyncOk ? "sucesso" : "alerta"} />
          </div>
        </div>
      </div>

      <InlineAlert title="Decisão de arquitetura aplicada" variant="info">
        Agenda e Explorer do Drive passam a compartilhar a mesma fundação Google, mas continuam separados da
        sincronização da Biblioteca Jurídica. Isso evita misturar browsing operacional com ingestão para IA.
      </InlineAlert>

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectInput
          label="Modo de autenticação Google"
          helperText="Use OAuth para agendas individuais e Drive Explorer. Mantenha Service Account para sync institucional."
          options={AUTH_OPTIONS}
          value={authMode}
          onChange={(event) => atualizar("google_auth_mode", event.target.value)}
        />
        <TextInput
          label="Calendar ID padrão"
          helperText="Use `primary` para o calendário principal ou informe o ID de um calendário compartilhado da operação jurídica."
          value={valores.google_calendar_primary_id ?? "primary"}
          onChange={(event) => atualizar("google_calendar_primary_id", event.target.value)}
        />
      </div>

      {mostrarOAuth ? (
        <div className="space-y-4 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card-strong)] p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">OAuth por usuário</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Necessário para Agenda profissional e acesso direto ao Drive respeitando permissões individuais.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TextInput
              label="OAuth Client ID"
              requiredMark
              value={valores.google_oauth_client_id ?? ""}
              onChange={(event) => atualizar("google_oauth_client_id", event.target.value)}
              helperText="Client ID do app Google Cloud."
            />
            <TextInput
              label="OAuth Client Secret"
              type="password"
              requiredMark
              value={valores.google_oauth_client_secret ?? ""}
              onChange={(event) => atualizar("google_oauth_client_secret", event.target.value)}
              helperText="Client Secret do app Google Cloud."
            />
          </div>
          <TextInput
            label="Redirect URI OAuth"
            requiredMark
            value={valores.google_oauth_redirect_uri ?? ""}
            onChange={(event) => atualizar("google_oauth_redirect_uri", event.target.value)}
            helperText="Ex.: https://seu-dominio/api/integracoes/google/callback"
          />
        </div>
      ) : null}

      {mostrarServiceAccount ? (
        <div className="space-y-4 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card-strong)] p-5">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Service Account institucional</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Continua sendo o caminho mais seguro para sincronizar pastas institucionais na Biblioteca Jurídica.
            </p>
          </div>
          <TextareaInput
            label="JSON da Service Account"
            value={valores.google_service_account_key ?? ""}
            onChange={(event) => atualizar("google_service_account_key", event.target.value)}
            helperText="Cole o JSON completo da service account. Ele será usado apenas no backend."
            requiredMark
            rows={7}
          />
          <TextInput
            label="Pasta compartilhada do Drive"
            value={valores.google_drive_shared_folder_id ?? ""}
            onChange={(event) => atualizar("google_drive_shared_folder_id", event.target.value)}
            helperText="ID da pasta institucional raiz para sync da Biblioteca e futuros atalhos operacionais."
            requiredMark
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <TextInput
          label="Escopo operacional do calendário"
          value={valores.google_calendar_sync_scope ?? ""}
          onChange={(event) => atualizar("google_calendar_sync_scope", event.target.value)}
          helperText="Use algo como `operacao_juridica`, `contencioso` ou `societario` para separar calendários depois."
        />
      </div>

      {readiness.pendenciasAgenda.length > 0 ? (
        <InlineAlert title="Pendências da Agenda" variant="warning">
          {readiness.pendenciasAgenda.join(" ")}
        </InlineAlert>
      ) : null}
      {readiness.pendenciasDriveExplorer.length > 0 ? (
        <InlineAlert title="Pendências do Drive Explorer" variant="warning">
          {readiness.pendenciasDriveExplorer.join(" ")}
        </InlineAlert>
      ) : null}
      {mensagem ? (
        <InlineAlert title={mensagem.tipo === "success" ? "Configuração salva" : "Falha ao salvar"} variant={mensagem.tipo === "success" ? "success" : "warning"}>
          {mensagem.texto}
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {possuiAlteracoes ? "Existem alterações pendentes" : "Configuração sincronizada"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Salve esta base antes de avançar para OAuth callback, sincronização de eventos e explorer de arquivos.
          </p>
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || !possuiAlteracoes}
          className="rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar base Google"}
        </button>
      </div>
    </div>
  );
}
