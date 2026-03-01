import { NextResponse } from "next/server";
import { ZodError } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function validateUuid(id: string): NextResponse | null {
  if (!UUID_REGEX.test(id)) {
    return errorResponse(400, "Invalid UUID format");
  }
  return null;
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return errorResponse(400, "Validation error", err.issues);
  }
  // Catch Postgres invalid UUID errors
  if (err instanceof Error && err.message?.includes("invalid input syntax for type uuid")) {
    return errorResponse(400, "Invalid UUID format");
  }
  console.error("Unhandled error:", err);
  return errorResponse(500, "Internal server error");
}
