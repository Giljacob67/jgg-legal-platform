import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { PerfilUsuario } from "@/modules/auth/domain/types";

// ─────────────────────────────────────────────────────────────
// DEMO USERS — via environment variables (NUNCA hardcoded)
// Instalar bcrypt: npm i bcrypt && npm i -D @types/bcrypt
//
// Em .env (DATA_MODE=mock), configure:
// DEMO_USERS_JSON='[{"id":"usr-adv-001","email":"mariana@jgg.com.br","passwordHash":"$2b$12$...","name":"Mariana Couto","initials":"MC","role":"advogado"}, ...]'
//
// Para gerar hash bcrypt da senha "jgg2026":
//   node -e "const b = require('bcrypt'); b.hash('jgg2026', 12).then(h => console.log(h))"
// ─────────────────────────────────────────────────────────────
interface DemoUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  initials: string;
  role: PerfilUsuario;
}

function getDemoUsers(): DemoUser[] {
  if (process.env.DATA_MODE !== "mock") return [];

  const envVal = process.env.DEMO_USERS_JSON;
  if (!envVal) {
    // Fallback: se nada configurado, retorna vazio (ninguém faz login em mock)
    console.warn("[auth] DATA_MODE=mock mas DEMO_USERS_JSON não está configurado.");
    return [];
  }

  try {
    const users = JSON.parse(envVal) as DemoUser[];
    return Array.isArray(users) ? users : [];
  } catch {
    console.error("[auth] DEMO_USERS_JSON mal formatado. Use JSON array.");
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: Comparar senha (suporta bcrypt e SHA-256 legacy)
// ─────────────────────────────────────────────────────────────
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("$2")) {
    // bcrypt (formato moderno)
    const bcrypt = await import("bcrypt");
    return bcrypt.compare(password, hash);
  }
  // Legacy SHA-256 (seeds antigos)
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(password).digest("hex") === hash;
}

// ─────────────────────────────────────────────────────────────
// TIPOS DA SESSÃO
// ─────────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      initials: string;
      role: PerfilUsuario;
    };
  }

  interface User {
    initials: string;
    role: PerfilUsuario;
  }
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO DE AUTENTICAÇÃO REAL (DATA_MODE=real) — usa bcrypt
// ─────────────────────────────────────────────────────────────
type DbUserRow = {
  id: string;
  email: string;
  name: string;
  initials: string | null;
  role: string | null;
  perfil: string | null;
  ativo: boolean;
  password_hash: string;
};

async function autenticarNoBanco(
  email: string,
  password: string,
): Promise<{ id: string; name: string; email: string; initials: string; role: PerfilUsuario } | null> {
  try {
    const { getSqlClient } = await import("@/lib/database/client");
    const sql = getSqlClient();

    const rows = await sql<DbUserRow[]>`
      SELECT id, email, name, initials, role, perfil, ativo, password_hash
      FROM users
      WHERE email = ${email}
        AND ativo = true
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const u = rows[0];
    // Suporta ambos: bcrypt (novo) e SHA-256 (legacy seed)
    const senhaValida = await verifyPassword(password, u.password_hash);
    if (!senhaValida) return null;

    const perfilFinal = (u.perfil ?? u.role ?? "advogado") as PerfilUsuario;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      initials:
        u.initials ??
        u.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      role: perfilFinal,
    };
  } catch (error) {
    console.error("[auth] Falha ao autenticar no banco:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// NEXTAUTH CONFIG
// ─────────────────────────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const dataMode = process.env.DATA_MODE ?? "mock";

        if (dataMode === "real") {
          return await autenticarNoBanco(email, password);
        }

        // Modo mock: validar contra DEMO_USERS_JSON (env var)
        const demoUsers = getDemoUsers();
        for (const user of demoUsers) {
          if (user.email !== email) continue;
          const match = await verifyPassword(password, user.passwordHash);
          if (match) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              initials: user.initials,
              role: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.initials = user.initials;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.initials = token.initials as string;
      session.user.role = token.role as PerfilUsuario;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS DE SENHA (para scripts de seed e admin)
// hashPasswordBcrypt('senha') → hash para salvar no banco
// ─────────────────────────────────────────────────────────────
export async function hashPasswordBcrypt(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 12);
}

export { verifyPassword };
