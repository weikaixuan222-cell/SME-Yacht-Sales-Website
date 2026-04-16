import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serviceUnavailable(message: string) {
  return NextResponse.json({ error: message }, { status: 503 });
}

export function internalServerError(message = "服务器内部错误") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
