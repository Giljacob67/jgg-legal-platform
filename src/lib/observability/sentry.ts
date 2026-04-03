import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for error monitoring.
 * Safe to call even when DSN is not configured — will silently skip.
 */
export function initSentry(context: "client" | "server") {
  if (!SENTRY_DSN || SENTRY_DSN === "https://...@sentry.io/...") {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV ?? "development",
    tracesSampleRate: context === "server" ? 0.5 : 0.2,
    enabled: process.env.NODE_ENV === "production",
    beforeSend(event) {
      // Filter out client-side network errors
      if (
        event.exception?.values?.some(
          (e) => e.type === "TypeError" && e.value?.includes("fetch"),
        )
      ) {
        return null;
      }
      return event;
    },
  });
}

/**
 * Capture a custom error with context.
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN || SENTRY_DSN === "https://...@sentry.io/...") {
    console.error("[sentry-disabled]", error.message, context);
    return;
  }

  if (context) {
    Sentry.setContext("custom", context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a breadcrumb for debugging.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}
