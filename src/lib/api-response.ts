import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

function mergeHeadersWithRequestId(
  requestId: string,
  headers?: HeadersInit,
): Headers {
  const merged = new Headers(headers);
  merged.set("X-Request-Id", requestId);
  return merged;
}

export function getRequestId(request?: Request): string {
  const incoming = request?.headers.get("x-request-id")?.trim();
  return incoming && incoming.length > 0 ? incoming : randomUUID();
}

export function jsonWithRequestId<T extends Record<string, unknown>>(
  requestId: string,
  body: T,
  init?: { status?: number; headers?: HeadersInit },
) {
  return NextResponse.json(
    { ...body, requestId },
    {
      status: init?.status,
      headers: mergeHeadersWithRequestId(requestId, init?.headers),
    },
  );
}

export function jsonError(
  requestId: string,
  error: string,
  status: number,
  details?: unknown,
) {
  return jsonWithRequestId(
    requestId,
    details === undefined ? { error } : { error, details },
    { status },
  );
}

export function logApiInfo(
  scope: string,
  requestId: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  console.info(
    `[${scope}] ${message}`,
    JSON.stringify({ requestId, ...(metadata ?? {}) }),
  );
}

export function logApiError(
  scope: string,
  requestId: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error(
    `[${scope}] erro`,
    JSON.stringify({ requestId, ...normalized, ...(metadata ?? {}) }),
  );
}
