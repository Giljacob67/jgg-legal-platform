import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash, timingSafeEqual } from "node:crypto";
import { hash as hashArgon2id, verify as verifyArgon2id } from "@node-rs/argon2";
import type { PerfilUsuario } from "@/modules/auth/domain/types";
import { getMockUsers } from "@/lib/mock-users";

const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  console.error("[auth] AUTH_SECRET não definido em produção. Defina a variável para evitar sessões frágeis.");
}

const resolvedAuthSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production" ? undefined : "dev-insecure-auth-secret");

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
// FUNÇÃO DE AUTENTICAÇÃO REAL (DATA_MODE=real)
// ─────────────────────────────────────────────────────────────
type DbUserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  initials: string | null;
  role: string | null;
  perfil: string | null;
  ativo: boolean;
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

function verifyLegacySha256(password: string, expectedHash: string): boolean {
  const actual = Buffer.from(sha256Hex(password), "utf-8");
  const expected = Buffer.from(expectedHash, "utf-8");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isArgon2Hash(storedHash)) {
    return verifyArgon2id(storedHash, password);
  }

  return verifyLegacySha256(password, storedHash);
}

async function autenticarNoBanco(
  email: string,
  password: string,
): Promise<{ id: string; name: string; email: string; initials: string; role: PerfilUsuario } | null> {
  try {
    // Import dinâmico para não quebrar o Edge runtime quando DATA_MODE=mock
    const { getSqlClient } = await import("@/lib/database/client");
    const sql = getSqlClient();

    const rows = await sql<DbUserRow[]>`
      SELECT id, email, password_hash, name, initials, role, perfil, ativo
      FROM users
      WHERE email = ${email}
        AND ativo = true
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const u = rows[0];
    const passwordOk = await verifyPassword(password, u.password_hash);
    if (!passwordOk) {
      return null;
    }

    if (!isArgon2Hash(u.password_hash)) {
      const upgradedHash = await hashArgon2id(password, ARGON2_OPTIONS);
      await sql`
        UPDATE users
        SET password_hash = ${upgradedHash}
        WHERE id = ${u.id}
          AND password_hash = ${u.password_hash}
      `;
    }

    // Preferir perfil (chave técnica) sobre role (label legado)
    const perfilFinal = (u.perfil ?? u.role ?? "advogado") as PerfilUsuario;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      initials: u.initials ?? u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
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
  secret: resolvedAuthSecret,
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
        const mockUser = getMockUsers().find(
          (u) => u.email === email && u.password === password,
        );

        if (dataMode === "real") {
          const dbUser = await autenticarNoBanco(email, password);
          if (dbUser) {
            return dbUser;
          }

          if (process.env.NODE_ENV !== "production" && mockUser) {
            return {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              initials: mockUser.initials,
              role: mockUser.role,
            };
          }

          return null;
        }

        // Modo mock: validar contra lista de demo users
        if (!mockUser) return null;

        return {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          initials: mockUser.initials,
          role: mockUser.role,
        };
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
