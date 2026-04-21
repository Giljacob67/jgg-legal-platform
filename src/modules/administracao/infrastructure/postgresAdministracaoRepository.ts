import { getDb } from "@/lib/database/client";
import { users, configuracoesSistema } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import type { IAdministracaoRepository } from "@/modules/administracao/domain/IAdministracaoRepository";
import type {
  Usuario,
  ConviteUsuario,
  PerfilUsuario,
  RegistroAuditoria,
  ConfiguracaoSistema,
} from "@/modules/administracao/domain/types";

function mapUserRow(row: typeof users.$inferSelect): Usuario {
  return {
    id: row.id,
    nome: row.name,
    email: row.email,
    iniciais: row.initials ?? row.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    perfil: (row.perfil as PerfilUsuario) ?? "advogado",
    ativo: row.ativo,
    ultimoAcesso: row.ultimoAcesso?.toISOString(),
    criadoEm: row.createdAt.toISOString(),
  };
}

export class PostgresAdministracaoRepository implements IAdministracaoRepository {
  // ─── Usuários ──────────────────────────────────────────────

  async listarUsuarios(): Promise<Usuario[]> {
    const db = getDb();
    const rows = await db.select().from(users);
    return rows.map(mapUserRow).sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterUsuarioPorId(id: string): Promise<Usuario | null> {
    const db = getDb();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows.length > 0 ? mapUserRow(rows[0]) : null;
  }

  async convidarUsuario(convite: ConviteUsuario): Promise<Usuario> {
    const db = getDb();
    const initials = convite.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const rows = await db
      .insert(users)
      .values({
        email: convite.email,
        passwordHash: "PENDING_SETUP", // senha definida no primeiro acesso
        name: convite.nome,
        initials,
        perfil: convite.perfil,
        ativo: true,
      })
      .returning();
    return mapUserRow(rows[0]);
  }

  async atualizarPerfil(id: string, perfil: PerfilUsuario): Promise<Usuario> {
    const db = getDb();
    await db.update(users).set({ perfil }).where(eq(users.id, id));
    const updated = await this.obterUsuarioPorId(id);
    if (!updated) throw new Error(`Usuário ${id} não encontrado.`);
    return updated;
  }

  async ativarDesativar(id: string, ativo: boolean): Promise<Usuario> {
    const db = getDb();
    await db.update(users).set({ ativo }).where(eq(users.id, id));
    const updated = await this.obterUsuarioPorId(id);
    if (!updated) throw new Error(`Usuário ${id} não encontrado.`);
    return updated;
  }

  // ─── Auditoria ─────────────────────────────────────────────
  // Auditoria ainda não tem tabela própria — retorna vazia até ser implementada.
  async listarAuditoria(limite?: number): Promise<RegistroAuditoria[]> {
    void limite;
    return [];
  }

  // ─── Configurações ─────────────────────────────────────────

  async obterConfiguracoes(): Promise<ConfiguracaoSistema[]> {
    const db = getDb();
    const rows = await db.select().from(configuracoesSistema);
    return rows.map((r) => ({
      chave: r.chave,
      valor: r.valor,
      descricao: r.descricao ?? undefined,
    }));
  }

  async atualizarConfiguracao(chave: string, valor: string): Promise<void> {
    const db = getDb();
    await db
      .insert(configuracoesSistema)
      .values({ chave, valor })
      .onConflictDoUpdate({ target: configuracoesSistema.chave, set: { valor } });
  }
}
