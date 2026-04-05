import { getDb } from "@/lib/database/client";
import { clientes as clientesTable } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { Cliente, NovoClientePayload, StatusCliente, Endereco } from "@/modules/clientes/domain/types";
import type { MockClientesRepository } from "@/modules/clientes/infrastructure/mockClientesRepository";

export type ClientesRepository = InstanceType<typeof MockClientesRepository>;

let _idCounter = 0;

function nextId(): string {
  _idCounter++;
  return `CLI-${new Date().getFullYear()}-${String(_idCounter).padStart(3, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function mapRow(row: typeof clientesTable.$inferSelect): Cliente {
  let endereco: Endereco | undefined;
  if (row.enderecoJson) {
    try { endereco = JSON.parse(row.enderecoJson) as Endereco; } catch { /* ignorar */ }
  }
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as Cliente["tipo"],
    cpfCnpj: row.cpfCnpj ?? undefined,
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    endereco,
    status: row.status as StatusCliente,
    responsavelId: row.responsavelId ?? undefined,
    responsavelNome: undefined, // não armazenado — resolvido na UI
    casosIds: [],   // relação resolvida via módulo casos
    contratosIds: [], // relação resolvida via módulo contratos
    anotacoes: row.anotacoes ?? undefined,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

export class PostgresClientesRepository implements ClientesRepository {
  async listar(filtros?: { status?: StatusCliente }): Promise<Cliente[]> {
    const db = getDb();
    const rows = filtros?.status
      ? await db.select().from(clientesTable).where(eq(clientesTable.status, filtros.status))
      : await db.select().from(clientesTable);
    return rows
      .map(mapRow)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterPorId(id: string): Promise<Cliente | null> {
    const db = getDb();
    const rows = await db.select().from(clientesTable).where(eq(clientesTable.id, id));
    return rows.length > 0 ? mapRow(rows[0]) : null;
  }

  async criar(payload: NovoClientePayload): Promise<Cliente> {
    const db = getDb();
    const id = nextId();
    const agora = new Date();
    await db.insert(clientesTable).values({
      id,
      nome: payload.nome,
      tipo: payload.tipo,
      cpfCnpj: payload.cpfCnpj ?? null,
      email: payload.email ?? null,
      telefone: payload.telefone ?? null,
      enderecoJson: payload.endereco ? JSON.stringify(payload.endereco) : null,
      status: payload.status ?? "ativo",
      responsavelId: payload.responsavelId ?? null,
      anotacoes: payload.anotacoes ?? null,
      criadoEm: agora,
      atualizadoEm: agora,
    });
    return (await this.obterPorId(id))!;
  }

  async atualizar(id: string, dados: Partial<NovoClientePayload>): Promise<Cliente> {
    const db = getDb();
    const updates: Record<string, unknown> = { atualizadoEm: new Date() };
    if (dados.nome !== undefined) updates.nome = dados.nome;
    if (dados.tipo !== undefined) updates.tipo = dados.tipo;
    if (dados.cpfCnpj !== undefined) updates.cpfCnpj = dados.cpfCnpj;
    if (dados.email !== undefined) updates.email = dados.email;
    if (dados.telefone !== undefined) updates.telefone = dados.telefone;
    if (dados.endereco !== undefined) updates.enderecoJson = JSON.stringify(dados.endereco);
    if (dados.status !== undefined) updates.status = dados.status;
    if (dados.responsavelId !== undefined) updates.responsavelId = dados.responsavelId;
    if (dados.anotacoes !== undefined) updates.anotacoes = dados.anotacoes;

    await db.update(clientesTable).set(updates).where(eq(clientesTable.id, id));
    const updated = await this.obterPorId(id);
    if (!updated) throw new Error(`Cliente ${id} não encontrado.`);
    return updated;
  }
}
