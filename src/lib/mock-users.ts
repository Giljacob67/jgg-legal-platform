import type { PerfilUsuario } from "@/modules/auth/domain/types";

export type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  initials: string;
  role: PerfilUsuario;
};

const DEFAULT_USER_IDENTITIES: Array<Omit<MockUser, "password">> = [
  {
    id: "usr-adv-001",
    email: "mariana@jgg.com.br",
    name: "Mariana Couto",
    initials: "MC",
    role: "advogado",
  },
  {
    id: "usr-soc-001",
    email: "gilberto@jgg.com.br",
    name: "Gilberto Jacob",
    initials: "GJ",
    role: "socio_direcao",
  },
  {
    id: "usr-adm-001",
    email: "admin@jgg.com.br",
    name: "Administrador",
    initials: "AD",
    role: "administrador_sistema",
  },
  {
    id: "usr-coord-001",
    email: "coordenador@jgg.com.br",
    name: "Carlos Mendes",
    initials: "CM",
    role: "coordenador_juridico",
  },
  {
    id: "usr-est-001",
    email: "estagiario@jgg.com.br",
    name: "Lucas Ferreira",
    initials: "LF",
    role: "estagiario_assistente",
  },
];

const DEFAULT_MOCK_PASSWORD = "dev-only-change-me";

function isPerfilUsuario(value: string): value is PerfilUsuario {
  return [
    "socio_direcao",
    "coordenador_juridico",
    "advogado",
    "estagiario_assistente",
    "operacional_admin",
    "administrador_sistema",
  ].includes(value);
}

function normalizeUsersFromEnv(raw: unknown): MockUser[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const users: MockUser[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const role = typeof candidate.role === "string" ? candidate.role : "";

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.email !== "string" ||
      typeof candidate.password !== "string" ||
      typeof candidate.name !== "string" ||
      typeof candidate.initials !== "string" ||
      !isPerfilUsuario(role)
    ) {
      continue;
    }

    users.push({
      id: candidate.id,
      email: candidate.email,
      password: candidate.password,
      name: candidate.name,
      initials: candidate.initials,
      role,
    });
  }

  return users;
}

export function getMockUsers(): MockUser[] {
  const raw = process.env.MOCK_USERS_JSON;
  if (raw && raw.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw);
      const fromEnv = normalizeUsersFromEnv(parsed);
      if (fromEnv.length > 0) {
        return fromEnv;
      }
      console.warn("[auth] MOCK_USERS_JSON definido, mas inválido. Usando fallback de desenvolvimento.");
    } catch (error) {
      console.warn("[auth] Não foi possível parsear MOCK_USERS_JSON. Usando fallback de desenvolvimento.", error);
    }
  }

  const fallbackPassword = process.env.MOCK_DEFAULT_PASSWORD ?? DEFAULT_MOCK_PASSWORD;
  return DEFAULT_USER_IDENTITIES.map((item) => ({
    ...item,
    password: fallbackPassword,
  }));
}
