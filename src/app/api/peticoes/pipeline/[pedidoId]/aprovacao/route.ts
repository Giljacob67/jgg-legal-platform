import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, getSessionPerfil } from "@/lib/api-auth";
import { getPeticoesOperacionalInfra } from "@/modules/peticoes/infrastructure/operacional/provider.server";
import { obterPedidoDePeca } from "@/modules/peticoes/application/obterPedidoDePeca";

const AprovacaoPayloadSchema = z.object({
  resultado: z.enum(["aprovado", "rejeitado", "revisao_pendente"]),
  observacoes: z.string().optional(),
});

// Somente coordenadores, sócios e administradores podem aprovar minutas
const PERFIS_APROVACAO = ["coordenador_juridico", "socio_direcao", "administrador_sistema"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pedidoId: string }> },
) {
  const forbidden = await requireRole([...PERFIS_APROVACAO]);
  if (forbidden) return forbidden;

  const sessionPerfil = await getSessionPerfil();
  if (!sessionPerfil) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { pedidoId } = await params;

  const pedido = await obterPedidoDePeca(pedidoId);
  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = AprovacaoPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { resultado, observacoes } = parsed.data;

  const infra = getPeticoesOperacionalInfra();
  const snapshot = await infra.pipelineSnapshotRepository.salvarNovaVersao({
    pedidoId,
    etapa: "aprovacao",
    entradaRef: { origem: "aprovacao_humana", aprovadoPor: sessionPerfil.userId },
    saidaEstruturada: {
      resultado,
      observacoes: observacoes ?? null,
      data_aprovacao: new Date().toISOString(),
      aprovado_por: sessionPerfil.userId,
      perfil_aprovador: sessionPerfil.perfil,
    },
    status: resultado === "aprovado" ? "concluido" : resultado === "rejeitado" ? "erro" : "em_andamento",
    tentativa: 1,
  });

  return NextResponse.json({ snapshot, resultado }, { status: 200 });
}
