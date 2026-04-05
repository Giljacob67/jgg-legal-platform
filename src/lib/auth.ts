import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { PerfilUsuario } from "@/modules/auth/domain/types";

// ─────────────────────────────────────────────────────────────
// DEMO USERS — utilizados apenas em DATA_MODE=mock
// ─────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    id: "usr-adv-001",
    email: "mariana@jgg.com.br",
    password: "jgg2026",
    name: "Mariana Couto",
    initials: "MC",
    role: "advogado" as PerfilUsuario,
  },
  {
    id: "usr-soc-001",
    email: "gilberto@jgg.com.br",
    password: "jgg2026",
    name: "Gilberto Jacob",
    initials: "GJ",
    role: "socio_direcao" as PerfilUsuario,
  },
  {
    id: "usr-adm-001",
    email: "admin@jgg.com.br",
    password: "jgg2026",
    name: "Administrador",
    initials: "AD",
    role: "administrador_sistema" as PerfilUsuario,
  },
  {
    id: "usr-coord-001",
    email: "coordenador@jgg.com.br",
    password: "jgg2026",
    name: "Carlos Mendes",
    initials: "CM",
    role: "coordenador_juridico" as PerfilUsuario,
  },
  {
    id: "usr-est-001",
    email: "estagiario@jgg.com.br",
    password: "jgg2026",
    name: "Lucas Ferreira",
    initials: "LF",
    role: "estagiario_assistente" as PerfilUsuario,
  },
];

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
  name: string;
  initials: string | null;
  role: string | null;
  perfil: string | null;
  ativo: boolean;
};

async function autenticarNoBanco(
  email: string,
  password: string,
): Promise<{ id: string; name: string; email: string; initials: string; role: PerfilUsuario } | null> {
  try {
    // Import dinâmico para não quebrar o Edge runtime quando DATA_MODE=mock
    const { getSqlClient } = await import("@/lib/database/client");
    const sql = getSqlClient();
    const passwordHash = createHash("sha256").update(password).digest("hex");

    const rows = await sql<DbUserRow[]>`
      SELECT id, email, name, initials, role, perfil, ativo
      FROM users
      WHERE email = ${email}
        AND password_hash = ${passwordHash}
        AND ativo = true
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const u = rows[0];
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

        // Modo mock: validar contra lista de demo users
        const user = DEMO_USERS.find(
          (u) => u.email === email && u.password === password,
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          initials: user.initials,
          role: user.role,
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
