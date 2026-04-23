import { createHmac, timingSafeEqual } from "node:crypto";

type OAuthStatePayload = {
  userId: string;
  redirectTo: string;
  issuedAt: number;
};

function getStateSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_URL ||
    "jgg-google-oauth-state-dev";

  return secret;
}

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function criarOAuthState(payload: Omit<OAuthStatePayload, "issuedAt">) {
  const corpo: OAuthStatePayload = {
    ...payload,
    issuedAt: Date.now(),
  };
  const serializado = JSON.stringify(corpo);
  const data = base64url(serializado);
  const assinatura = createHmac("sha256", getStateSecret()).update(data).digest("base64url");
  return `${data}.${assinatura}`;
}

export function validarOAuthState(state: string, maxAgeMs = 1000 * 60 * 15): OAuthStatePayload | null {
  const [data, assinatura] = state.split(".");
  if (!data || !assinatura) return null;

  const esperada = createHmac("sha256", getStateSecret()).update(data).digest("base64url");
  const assinaturaBuffer = Buffer.from(assinatura);
  const esperadaBuffer = Buffer.from(esperada);

  if (
    assinaturaBuffer.length !== esperadaBuffer.length ||
    !timingSafeEqual(assinaturaBuffer, esperadaBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64url(data)) as OAuthStatePayload;
    if (!payload.userId || !payload.redirectTo || !payload.issuedAt) return null;
    if (Date.now() - payload.issuedAt > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}
