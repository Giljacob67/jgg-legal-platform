import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { PerfilUsuario } from "@/modules/auth/domain/types";

/**
 * Demo users for development. In production, these would come from a database.
 */
const DEMO_USERS = [
  {
    id: "usr-adv-001",
    email: "mariana@jgg.com.br",
    password: "jgg2026",
    name: "Mariana Couto",
    initials: "MC",
    role: "Advogado" as PerfilUsuario,
  },
  {
    id: "usr-soc-001",
    email: "gilberto@jgg.com.br",
    password: "jgg2026",
    name: "Gilberto Jacob",
    initials: "GJ",
    role: "Sócio / Direção" as PerfilUsuario,
  },
  {
    id: "usr-adm-001",
    email: "admin@jgg.com.br",
    password: "jgg2026",
    name: "Administrador",
    initials: "AD",
    role: "Administrador do sistema" as PerfilUsuario,
  },
  {
    id: "usr-coord-001",
    email: "coordenador@jgg.com.br",
    password: "jgg2026",
    name: "Carlos Mendes",
    initials: "CM",
    role: "Coordenador Jurídico" as PerfilUsuario,
  },
];

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
