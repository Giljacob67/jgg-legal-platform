"use client";

import { useState, useTransition } from "react";
import type { Usuario, PerfilUsuario } from "../domain/types";
import { LABEL_PERFIL, ORDEM_PERFIL } from "../domain/types";

type ListaUsuariosProps = {
  usuariosIniciais: Usuario[];
};

const BADGE_PERFIL: Record<PerfilUsuario, string> = {
  socio_direcao: "bg-violet-100 text-violet-800 border-violet-200",
  coordenador_juridico: "bg-blue-100 text-blue-800 border-blue-200",
  advogado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  estagiario_assistente: "bg-amber-100 text-amber-800 border-amber-200",
  operacional_admin: "bg-gray-100 text-gray-700 border-gray-200",
  administrador_sistema: "bg-rose-100 text-rose-800 border-rose-200",
};

function AvatarInicial({ iniciais, ativo }: { iniciais: string; ativo: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
        ativo
          ? "bg-[var(--color-accent)] text-white"
          : "bg-gray-200 text-gray-400"
      }`}
    >
      {iniciais}
    </div>
  );
}

export function ListaUsuarios({ usuariosIniciais }: ListaUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  async function toggleAtivo(usuario: Usuario) {
    startTransition(async () => {
      const res = await fetch(`/api/administracao/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      if (res.ok) {
        const data = await res.json() as { usuario: Usuario };
        setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? data.usuario : u)));
        setFeedback(`${usuario.nome} ${!usuario.ativo ? "ativado" : "desativado"}.`);
        setTimeout(() => setFeedback(""), 3000);
      }
    });
  }

  async function alterarPerfil(usuario: Usuario, novoPerfil: PerfilUsuario) {
    startTransition(async () => {
      const res = await fetch(`/api/administracao/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil: novoPerfil }),
      });
      if (res.ok) {
        const data = await res.json() as { usuario: Usuario };
        setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? data.usuario : u)));
        setFeedback(`Perfil de ${usuario.nome} atualizado.`);
        setTimeout(() => setFeedback(""), 3000);
      }
    });
  }

  const ordenados = [...usuarios].sort((a, b) =>
    (ORDEM_PERFIL[a.perfil] ?? 99) - (ORDEM_PERFIL[b.perfil] ?? 99)
  );

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          ✅ {feedback}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Usuário</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Perfil</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Último acesso</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-muted)]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-surface-alt)]/40"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarInicial iniciais={u.iniciais} ativo={u.ativo} />
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{u.nome}</p>
                      <p className="text-xs text-[var(--color-muted)]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.perfil}
                    disabled={isPending}
                    onChange={(e) => alterarPerfil(u, e.target.value as PerfilUsuario)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_PERFIL[u.perfil]} cursor-pointer`}
                  >
                    {Object.entries(LABEL_PERFIL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                  {u.ultimoAcesso
                    ? new Date(u.ultimoAcesso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                    : "Nunca"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAtivo(u)}
                    disabled={isPending}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                  >
                    {u.ativo ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
