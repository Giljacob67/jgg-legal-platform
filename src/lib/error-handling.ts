/**
 * Standardized result type for Server Actions and application-layer operations.
 *
 * Usage:
 *   return actionSuccess(data);   // { success: true, data }
 *   return actionError(["msg"]);  // { success: false, errors: ["msg"] }
 */

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError<T = never>(errors: string[]): ActionResult<T> {
  return { success: false, errors };
}

/**
 * Wraps an async operation with standardized error handling.
 * Catches thrown errors and returns them as ActionResult.
 */
export async function safeAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return actionSuccess(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado na operação.";
    return actionError([message]);
  }
}
