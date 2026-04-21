const PERFIS_COM_ALCADA_APROVACAO = [
  "coordenador_juridico",
  "socio_direcao",
  "administrador_sistema",
] as const;

type PerfilComAlcadaAprovacao = (typeof PERFIS_COM_ALCADA_APROVACAO)[number];

export function perfilTemAlcadaAprovacao(
  perfil: string | null | undefined,
): perfil is PerfilComAlcadaAprovacao {
  if (!perfil) return false;
  return PERFIS_COM_ALCADA_APROVACAO.includes(
    perfil as PerfilComAlcadaAprovacao,
  );
}
