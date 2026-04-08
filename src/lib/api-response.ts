import { NextResponse } from "next/server";

export type ErroApiCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "INVALID_LINKS_PAYLOAD"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "SCHEMA_VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export function apiError(
  code: ErroApiCode,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      code,
      message,
      details,
    },
    { status },
  );
}
