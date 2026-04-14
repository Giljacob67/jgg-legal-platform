import "server-only";

/**
 * Rate limiter in-memory simples por userId.
 *
 * Adequado para monorepo single-process (Next.js standalone / Vercel serverless por instância).
 * Para multi-instância em produção, substituir por Redis (ex: @upstash/ratelimit).
 *
 * Padrão: janela deslizante de 1 hora, limite configurável por contexto.
 */

interface BucketEntry {
  timestamps: number[];
}

// Map global — persiste enquanto o processo está vivo (por instância serverless)
const buckets = new Map<string, BucketEntry>();

/**
 * Verifica se o userId pode fazer uma nova chamada dentro da janela.
 *
 * @param userId - Identificador único do usuário
 * @param key - Chave do contexto (ex: "pipeline-ia", "triagem")
 * @param limitePorHora - Máximo de chamadas por hora (default: 20)
 * @returns { permitido, restante, resetEmMs }
 */
export function verificarRateLimit(
  userId: string,
  key: string,
  limitePorHora = 20,
): { permitido: boolean; restante: number; resetEmMs: number } {
  const bucketKey = `${userId}:${key}`;
  const agora = Date.now();
  const janelaMs = 60 * 60 * 1000; // 1 hora

  const entry = buckets.get(bucketKey) ?? { timestamps: [] };

  // Remove timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((ts) => agora - ts < janelaMs);

  if (entry.timestamps.length >= limitePorHora) {
    const maisAntigoNaJanela = entry.timestamps[0] ?? agora;
    const resetEmMs = janelaMs - (agora - maisAntigoNaJanela);
    buckets.set(bucketKey, entry);
    return { permitido: false, restante: 0, resetEmMs };
  }

  entry.timestamps.push(agora);
  buckets.set(bucketKey, entry);

  return {
    permitido: true,
    restante: limitePorHora - entry.timestamps.length,
    resetEmMs: janelaMs,
  };
}

/**
 * Limpa buckets expirados para evitar memory leak em processos de longa duração.
 * Chamar periodicamente se necessário (ex: em cron ou a cada N requests).
 */
export function limparBucketsExpirados(): void {
  const agora = Date.now();
  const janelaMs = 60 * 60 * 1000;

  for (const [key, entry] of buckets) {
    const ativos = entry.timestamps.filter((ts) => agora - ts < janelaMs);
    if (ativos.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, { timestamps: ativos });
    }
  }
}
