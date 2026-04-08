import "server-only";

import { getDataMode } from "@/lib/data-mode";
import { getSqlClient } from "@/lib/database/client";

type RateLimitResult = {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
};

const inMemoryRateLimit = new Map<string, { windowStartMs: number; count: number }>();

function nowMs(): number {
  return Date.now();
}

function getBucketStartMs(windowSeconds: number): number {
  const windowMs = windowSeconds * 1000;
  return Math.floor(nowMs() / windowMs) * windowMs;
}

function applyInMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const bucket = getBucketStartMs(windowSeconds);
  const existing = inMemoryRateLimit.get(key);
  const current =
    existing && existing.windowStartMs === bucket
      ? { windowStartMs: existing.windowStartMs, count: existing.count + 1 }
      : { windowStartMs: bucket, count: 1 };

  inMemoryRateLimit.set(key, current);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket + windowSeconds * 1000 - nowMs()) / 1000));

  return {
    allowed: current.count <= limit,
    count: current.count,
    limit,
    retryAfterSeconds,
  };
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = input;
  if (getDataMode() !== "real") {
    return applyInMemoryRateLimit(key, limit, windowSeconds);
  }

  try {
    const sql = getSqlClient();
    const [row] = await sql<{ count: number; retry_after: number }[]>`
      WITH upserted AS (
        INSERT INTO api_rate_limit (bucket_key, window_start, count, updated_at)
        VALUES (
          ${key},
          to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}),
          1,
          NOW()
        )
        ON CONFLICT (bucket_key, window_start)
        DO UPDATE SET
          count = api_rate_limit.count + 1,
          updated_at = NOW()
        RETURNING count, window_start
      )
      SELECT
        count,
        GREATEST(1, ceil(extract(epoch from ((window_start + (${windowSeconds} * interval '1 second')) - now()))))::int AS retry_after
      FROM upserted
    `;

    return {
      allowed: row.count <= limit,
      count: row.count,
      limit,
      retryAfterSeconds: row.retry_after,
    };
  } catch (error) {
    console.warn("[rate-limit] fallback em memória após falha de banco.", error);
    return applyInMemoryRateLimit(key, limit, windowSeconds);
  }
}
