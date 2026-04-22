import { NextRequest, NextResponse } from "next/server";

import { checkSecuAIRequest, readSecuAIConfig, shouldCheckSecuAIRequest } from "@/lib/secuai";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function buildRequestContext(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;

  return {
    method: request.method,
    host,
    path: request.nextUrl.pathname,
    queryString: request.nextUrl.search.length > 1 ? request.nextUrl.search.slice(1) : undefined,
    clientIp:
      firstHeaderValue(request.headers.get("x-forwarded-for")) ??
      firstHeaderValue(request.headers.get("x-real-ip")),
    userAgent: request.headers.get("user-agent") ?? undefined,
    referer: request.headers.get("referer") ?? undefined,
    occurredAt: new Date().toISOString(),
  };
}

export async function middleware(request: NextRequest) {
  if (
    !shouldCheckSecuAIRequest({
      method: request.method,
      pathname: request.nextUrl.pathname,
    })
  ) {
    return NextResponse.next();
  }

  const decision = await checkSecuAIRequest(buildRequestContext(request), readSecuAIConfig());

  if (!decision.allow) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REQUEST_BLOCKED",
          message: "Request blocked by SecuAI site security policy.",
          details: {
            action: decision.action,
            mode: decision.mode,
            reasons: decision.reasons,
          },
        },
      },
      { status: 403 },
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-secuai-protection-action", decision.action);
  response.headers.set("x-secuai-protection-mode", decision.mode);

  if (decision.failOpen) {
    response.headers.set("x-secuai-fail-open", decision.failOpenReason ?? "true");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
