import { getDb } from "@/lib/database/client";
import { contratos as contratosTable } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type {
  Contrato,
  NovoContratoPayload,
  StatusContrato,
  ParteContrato,
  Clausula,
  VersaoContrato,
  AnaliseRiscoContrato,
} from "@/modules/contratos/domain/types";
import type { MockContratosRepository } from "@/modules/contratos/infrastructure/mockContratosRepository";

export type ContratosRepository = InstanceType<typeof MockContratosRepository>;

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
}
