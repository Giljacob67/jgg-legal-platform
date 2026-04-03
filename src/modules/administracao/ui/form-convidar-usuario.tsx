"use client";

import { useState } from "react";
import type { ConviteUsuario, PerfilUsuario } from "../domain/types";
import { LABEL_PERFIL } from "../domain/types";

type FormConvidarUsuarioProps = {
  onConvite?: () => void;
};

export function FormConvidarUsuario({ onConvite }: FormConvidarUsuarioProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("advogado");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);

    try {
      const payload: ConviteUsuario = { nome, email, perfil };
      const res = await fetch("/api/administracao/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao convidar.");
      }
      setSucesso(`Convite enviado para ${email} com perfil "${LABEL_PERFIL[perfil]}".`);
      setNome("");
      setEmail("");
      setPerfil("advogado");
      onConvite?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Nome completo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            placeholder="Ex: Ana Paula Mendes"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            placeholder="ana@escritorio.adv.br"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Perfil de acesso</label>
        <select
          value={perfil}
          onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        >
          {Object.entries(LABEL_PERFIL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          O perfil define quais módulos e ações este usuário pode acessar.
        </p>
      </div>

      {sucesso && <p className="text-sm text-emerald-700">✅ {sucesso}</p>}
      {erro && <p className="text-sm text-rose-700">⚠️ {erro}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
      >
        {loading ? "Enviando convite..." : "Convidar usuário"}
      </button>
    </form>
  );
}
