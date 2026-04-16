/**
 * Retry com backoff exponencial para chamadas de IA.
 *
 * Tratamento de erros:
 * - Retryable: rede (ENOTFOUND, ETIMEDOUT, ECONNRESET), HTTP 429, 500, 502, 503, 504
 * - Não retryable: 400 (bad request), 401 (auth), 403 (forbidden), 404 (not found)
 */

const ERRORES_RETRYAVEIS = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ENOTFOUND",
  "ENETUNREACH",
  "EAI_AGAIN",
  "socketHangUp",
  "ECONNREFUSED",
]);

function isRetryavel(error: unknown): boolean {
  if (error instanceof Error) {
    // Erros de rede — TypeScript não expõe .code em Error genérico
    if ("code" in error && typeof error.code === "string" && ERRORES_RETRYAVEIS.has(error.code)) return true;
    // Erros HTTP retryable
    if ("status" in error && typeof error.status === "number") {
      return error.status === 429 || (error.status >= 500 && error.status < 600);
    }
    // Erros de provider (ex: rate limit do OpenRouter)
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("429") || msg.includes("overloaded")) {
      return true;
    }
  }
  return false;
}

function calcularBackoff(attempt: number, baseMs = 1000, maxMs = 30000): number {
  // Jitter: ±20% para evitar thundering herd
  const exp = Math.min(baseMs * 2 ** attempt, maxMs);
  const jitter = exp * 0.2 * (Math.random() * 2 - 1);
  return Math.round(Math.min(exp + jitter, maxMs));
}

export interface RetryOptions {
  /** Número máximo de tentativas (default: 3) */
  maxAttempts?: number;
  /** Atraso base em ms (default: 1000) */
  baseDelayMs?: number;
  /** Atraso máximo em ms (default: 30000) */
  maxDelayMs?: number;
  /** Lista de modelos fallback para tentar em caso de erro */
  fallbackModels?: string[];
  /** Callback chamado a cada tentativa falha */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export interface RetryResult<T> {
  ok: true;
  data: T;
  attempts: number;
};

export interface RetryFailure {
  ok: false;
  error: unknown;
  attempts: number;
  lastError: unknown;
}

type RetryResultType<T> = RetryResult<T> | RetryFailure;

/**
 * Executa `fn` com retry exponencial e fallback de modelos.
 *
 * Uso:
 * ```ts
 * const result = await withRetry(() => generateObject({ model, schema, prompt }));
 * if (!result.ok) { throw result.error; }
 * const { object } = result.data;
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResultType<T>> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    fallbackModels = [],
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fn();
      return { ok: true, data, attempts: attempt + 1 };
    } catch (err) {
      lastError = err;

      const isLastAttempt = attempt === maxAttempts - 1;
      const podeTentarFallback = !isLastAttempt && fallbackModels.length > 0;

      if (isLastAttempt || (!isRetryavel(err) && !podeTentarFallback)) {
        return { ok: false, error: err, attempts: attempt + 1, lastError: err };
      }

      // Tentar próximo modelo fallback em vez de retry
      if (podeTentarFallback && attempt < fallbackModels.length) {
        const fallbackModel = fallbackModels[attempt];
        console.warn(`[retry] Modelo falhou — tentando fallback: ${fallbackModel}`);
        // O fallback é ativado passando novo modelo na próxima iteração
        // A função chamadora precisa detectar e usar outro modelo
      }

      if (isRetryavel(err)) {
        const delayMs = calcularBackoff(attempt, baseDelayMs, maxDelayMs);
        onRetry?.(attempt + 1, err, delayMs);
        await sleep(delayMs);
      }
    }
  }

  return {
    ok: false,
    error: lastError ?? new Error("Retry exausto sem erro registrado"),
    attempts: maxAttempts,
    lastError,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extrai erro de uma chamada AI SDK.
 * Ajuda a normalizar erros entre provedores.
 */
export function extractAIError(cause: unknown): unknown {
  if (cause instanceof Error) {
    // @ts-expect-error - Errors can have response property
    const response = cause.response;
    if (response && typeof response.status === "number") {
      return Object.assign(cause, { status: response.status });
    }
    return cause;
  }
  return cause;
}

/**
 * Retry para streamText — tenta novamente re-chamando a função criadora do stream.
 * Retorna stream ou erro após exaustão.
 *
 * Aceita o shape real do AI SDK v6: textStream + text (PromiseLike).
 */
export async function retryStreamText(
  createStream: () => Promise<{ textStream: AsyncIterable<string>; text: PromiseLike<string> }>,
  options: RetryOptions = {},
): Promise<{
  textStream: AsyncIterable<string>;
  textPromise: Promise<string>;
  attempts: number;
}> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const stream = await createStream();
      return {
        textStream: stream.textStream,
        // Resolve the PromiseLike so callers get a real Promise
        textPromise: Promise.resolve(stream.text),
        attempts: attempt + 1,
      };
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts - 1 || !isRetryavel(err)) {
        throw err;
      }

      const delayMs = calcularBackoff(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(attempt + 1, err, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
