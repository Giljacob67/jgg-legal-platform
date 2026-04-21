import { getDb } from "@/lib/database/client";
import { contratos as contratosTable } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type {
  Contrato,
  NovoContratoPayload,
  AtualizarContratoPayload,
  StatusContrato,
  ParteContrato,
  Clausula,
  VersaoContrato,
  AnaliseRiscoContrato,
} from "@/modules/contratos/domain/types";
import type { ContratosRepository } from "@/modules/contratos/infrastructure/contracts";

function mapRow(row: typeof contratosTable.$inferSelect): Contrato {
  let partes: ParteContrato[] = [];
  let clausulas: Clausula[] = [];
  let versoes: VersaoContrato[] = [];
  let analiseRisco: AnaliseRiscoContrato | undefined;
  partes = (row.partesJson as ParteContrato[]) ?? [];
  clausulas = (row.clausulasJson as Clausula[]) ?? [];
  versoes = (row.versoesJson as VersaoContrato[]) ?? [];
  if (row.analiseRiscoJson) {
    analiseRisco = row.analiseRiscoJson as AnaliseRiscoContrato;
  }

  return {
    id: row.id,
    casoId: row.casoId ?? undefined,
    clienteId: row.clienteId ?? undefined,
    titulo: row.titulo,
    tipo: row.tipo as Contrato["tipo"],
    status: row.status as StatusContrato,
    objeto: row.objeto,
    partes,
    clausulas,
    valorReais: row.valorReais ?? undefined,
    vigenciaInicio: row.vigenciaInicio ?? undefined,
    vigenciaFim: row.vigenciaFim ?? undefined,
    conteudoAtual: row.conteudoAtual,
    versoes,
    responsavelId: row.responsavelId ?? undefined,
    analiseRisco,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

export class PostgresContratosRepository implements ContratosRepository {
  async listar(filtros?: { status?: StatusContrato; tipo?: Contrato["tipo"] }): Promise<Contrato[]> {
    const db = getDb();
    const rows = await db.select().from(contratosTable);
    let resultado = rows.map(mapRow);
    if (filtros?.status) resultado = resultado.filter((c) => c.status === filtros.status);
    if (filtros?.tipo) resultado = resultado.filter((c) => c.tipo === filtros.tipo);
    return resultado.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async obterPorId(id: string): Promise<Contrato | null> {
    const db = getDb();
    const rows = await db.select().from(contratosTable).where(eq(contratosTable.id, id));
    return rows.length > 0 ? mapRow(rows[0]) : null;
  }

  async criar(payload: NovoContratoPayload): Promise<Contrato> {
    const db = getDb();
    const count = await db.select({ id: contratosTable.id }).from(contratosTable);
    const id = `CTR-${new Date().getFullYear()}-${String(count.length + 1).padStart(3, "0")}`;
    const agora = new Date();

    await db.insert(contratosTable).values({
      id,
      casoId: payload.casoId ?? null,
      clienteId: payload.clienteId ?? null,
      titulo: payload.titulo,
      tipo: payload.tipo,
      status: "rascunho",
      objeto: payload.objeto,
      partesJson: payload.partes,
      clausulasJson: [],
      valorReais: payload.valorReais ?? null,
      vigenciaInicio: payload.vigenciaInicio ?? null,
      vigenciaFim: payload.vigenciaFim ?? null,
      conteudoAtual: "",
      versoesJson: [],
      responsavelId: null,
      analiseRiscoJson: null,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    return (await this.obterPorId(id))!;
  }

  async atualizarStatus(id: string, status: StatusContrato): Promise<Contrato> {
    const db = getDb();
    await db
      .update(contratosTable)
      .set({ status, atualizadoEm: new Date() })
      .where(eq(contratosTable.id, id));
    const updated = await this.obterPorId(id);
    if (!updated) throw new Error(`Contrato ${id} não encontrado.`);
    return updated;
  }

  async salvarAnaliseRisco(id: string, analise: Contrato["analiseRisco"]): Promise<void> {
    const db = getDb();
    await db
      .update(contratosTable)
      .set({
        analiseRiscoJson: analise ?? null,
        atualizadoEm: new Date(),
      })
      .where(eq(contratosTable.id, id));
  }

  async atualizarConteudoEClausulas(
    id: string,
    clausulas: Clausula[],
    conteudoAtual: string,
  ): Promise<Contrato> {
    const db = getDb();
    const current = await this.obterPorId(id);
    if (!current) throw new Error(`Contrato ${id} não encontrado.`);

    const versaoAtual = current.versoes.length;
    const novaVersao: VersaoContrato = {
      id: `v${versaoAtual + 1}`,
      numero: versaoAtual + 1,
      autorNome: "Usuário",
      resumoMudancas: "Edição manual de cláusulas",
      conteudo: current.conteudoAtual,
      criadoEm: new Date().toISOString(),
    };

    await db
      .update(contratosTable)
      .set({
        clausulasJson: clausulas as unknown[],
        conteudoAtual,
        versoesJson: [...current.versoes, novaVersao] as unknown[],
        atualizadoEm: new Date(),
      })
      .where(eq(contratosTable.id, id));

    return (await this.obterPorId(id))!;
  }

  async atualizarContrato(id: string, payload: AtualizarContratoPayload): Promise<Contrato> {
    const db = getDb();
    const existing = await this.obterPorId(id);
    if (!existing) throw new Error(`Contrato ${id} não encontrado.`);

    const updates: Record<string, unknown> = { atualizadoEm: new Date() };
    if (payload.titulo !== undefined) updates.titulo = payload.titulo;
    if (payload.tipo !== undefined) updates.tipo = payload.tipo;
    if (payload.objeto !== undefined) updates.objeto = payload.objeto;
    if (payload.partes !== undefined) updates.partesJson = payload.partes;
    if (payload.casoId !== undefined) updates.casoId = payload.casoId ?? null;
    if (payload.clienteId !== undefined) updates.clienteId = payload.clienteId ?? null;
    if (payload.valorReais !== undefined) updates.valorReais = payload.valorReais ?? null;
    if (payload.vigenciaInicio !== undefined) updates.vigenciaInicio = payload.vigenciaInicio ?? null;
    if (payload.vigenciaFim !== undefined) updates.vigenciaFim = payload.vigenciaFim ?? null;
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.responsavelId !== undefined) updates.responsavelId = payload.responsavelId ?? null;

    await db.update(contratosTable).set(updates).where(eq(contratosTable.id, id));
    return (await this.obterPorId(id))!;
  }

  async excluirContrato(id: string): Promise<void> {
    const db = getDb();
    const existing = await this.obterPorId(id);
    if (!existing) throw new Error(`Contrato ${id} não encontrado.`);
    await db.delete(contratosTable).where(eq(contratosTable.id, id));
  }
}
