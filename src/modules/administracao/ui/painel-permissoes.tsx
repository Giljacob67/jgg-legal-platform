import type { MatrizPermissoes, ModuloPlataforma, NivelAcesso, PerfilUsuario } from "../domain/types";
import { LABEL_PERFIL, PERMISSOES_PADRAO } from "../domain/types";

const MODULOS_LABEL: Record<ModuloPlataforma, string> = {
  dashboard: "Dashboard",
  peticoes: "Petições",
  casos: "Casos",
  documentos: "Documentos",
  biblioteca_juridica: "Biblioteca Jurídica",
  contratos: "Contratos",
  jurisprudencia: "Jurisprudência",
  gestao: "Gestão",
  clientes: "Clientes",
  bi: "BI",
  administracao: "Administração",
};

const NIVEL_BADGE: Record<NivelAcesso, { label: string; classes: string }> = {
  total: { label: "Total", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  edicao: { label: "Edição", classes: "bg-blue-100 text-blue-800 border-blue-200" },
  leitura: { label: "Leitura", classes: "bg-amber-100 text-amber-800 border-amber-200" },
  sem_acesso: { label: "—", classes: "bg-gray-100 text-gray-400 border-gray-200" },
};

const PERFIS_ORDENADOS = Object.keys(LABEL_PERFIL) as PerfilUsuario[];
const MODULOS_ORDENADOS = Object.keys(MODULOS_LABEL) as ModuloPlataforma[];

type PainelPermissoesProps = {
  matriz?: MatrizPermissoes;
};

export function PainelPermissoes({ matriz = PERMISSOES_PADRAO }: PainelPermissoesProps) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-3 text-sm text-[var(--color-muted)]">
        Matriz de permissões padrão. Personalizações por usuário serão configuráveis em versões futuras.
      </p>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <th className="sticky left-0 bg-[var(--color-surface-alt)] px-4 py-3 text-left font-semibold text-[var(--color-muted)]">
              Módulo
            </th>
            {PERFIS_ORDENADOS.map((p) => (
              <th key={p} className="px-3 py-3 text-center font-semibold text-[var(--color-muted)] whitespace-nowrap">
                {LABEL_PERFIL[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULOS_ORDENADOS.map((modulo, i) => (
            <tr
              key={modulo}
              className={`border-b border-[var(--color-border)] last:border-0 ${i % 2 === 0 ? "" : "bg-[var(--color-surface-alt)]/40"}`}
            >
              <td className="sticky left-0 bg-[var(--color-card)] px-4 py-2.5 font-medium text-[var(--color-ink)]">
                {MODULOS_LABEL[modulo]}
              </td>
              {PERFIS_ORDENADOS.map((perfil) => {
                const nivel = matriz[perfil]?.[modulo] ?? "sem_acesso";
                const badge = NIVEL_BADGE[nivel];
                return (
                  <td key={perfil} className="px-3 py-2.5 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
