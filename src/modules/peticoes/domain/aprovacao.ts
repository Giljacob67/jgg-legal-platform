import type { EstagioExecutavel } from "@/modules/peticoes/domain/types";
import type { PerfilUsuario } from "@/modules/administracao/domain/types";

const PERFIS_COM_ALCADA_APROVACAO = [
  "coordenador_juridico",
  "socio_direcao",
  "administrador_sistema",
] as const satisfies readonly PerfilUsuario[];

const PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO = [
  "advogado",
  "coordenador_juridico",
  "socio_direcao",
] as const satisfies readonly PerfilUsuario[];

const ALCADA_EXECUCAO_POR_ESTAGIO: Record<EstagioExecutavel, readonly PerfilUsuario[]> = {
  triagem: PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO,
  "extracao-fatos": PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO,
  "analise-adversa": PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO,
  estrategia: PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO,
  minuta: PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO,
};

type PerfilComAlcadaAprovacao = (typeof PERFIS_COM_ALCADA_APROVACAO)[number];
type PerfilComAlcadaExecucaoEstagio = (typeof PERFIS_COM_ALCADA_EXECUCAO_ESTAGIO)[number];

export function perfilTemAlcadaAprovacao(
  perfil: string | null | undefined,
): perfil is PerfilComAlcadaAprovacao {
  if (!perfil) return false;
  return PERFIS_COM_ALCADA_APROVACAO.includes(perfil as PerfilComAlcadaAprovacao);
}

export function perfilTemAlcadaExecucaoEstagio(
  perfil: string | null | undefined,
  estagio: EstagioExecutavel,
): perfil is PerfilComAlcadaExecucaoEstagio {
  if (!perfil) return false;
  const perfisComAlcada = ALCADA_EXECUCAO_POR_ESTAGIO[estagio];
  return perfisComAlcada.includes(perfil as PerfilComAlcadaExecucaoEstagio);
}
