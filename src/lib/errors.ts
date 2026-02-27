import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return errorResponse(400, "Validation error", err.issues);
  }
  console.error("Unhandled error:", err);
  return errorResponse(500, "Internal server error");
}
