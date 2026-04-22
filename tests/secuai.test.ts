import { afterEach, describe, expect, test, vi } from "vitest";

import {
  checkSecuAIRequest,
  readSecuAIConfig,
  shouldCheckSecuAIRequest,
  type SecuAIRequestContext,
} from "@/lib/secuai";

const requestContext: SecuAIRequestContext = {
  method: "GET",
  host: "yachts.example.com",
  path: "/yachts",
  queryString: "page=1",
  clientIp: "203.0.113.10",
  userAgent: "Vitest",
  referer: "https://example.com/",
};

describe("SecuAI integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reads minimal SecuAI config from environment values", () => {
    const config = readSecuAIConfig({
      SECUAI_ENABLED: "true",
      SECUAI_PLATFORM_URL: "https://secuai.example.com/",
      SECUAI_SITE_ID: "site-001",
      SECUAI_SITE_INGESTION_KEY: "site-key",
      SECUAI_FAIL_OPEN: "false",
      SECUAI_TIMEOUT_MS: "2500",
    });

    expect(config).toMatchObject({
      enabled: true,
      platformUrl: "https://secuai.example.com",
      siteId: "site-001",
      siteIngestionKey: "site-key",
      failOpen: false,
      timeoutMs: 2500,
      checkPath: "/api/v1/protection/check",
    });
  });

  test("calls protection check endpoint and allows monitor decisions", async () => {
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            protection: {
              action: "monitor",
              mode: "monitor",
              reasons: ["blocked_ip"],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSecuAIRequest(
      requestContext,
      readSecuAIConfig({
        SECUAI_ENABLED: "true",
        SECUAI_PLATFORM_URL: "https://secuai.example.com",
        SECUAI_SITE_ID: "site-001",
        SECUAI_SITE_INGESTION_KEY: "site-key",
      }),
    );

    expect(result).toMatchObject({
      allow: true,
      action: "monitor",
      mode: "monitor",
      reasons: ["blocked_ip"],
      failOpen: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0] as Parameters<typeof fetch>;
    const firstCallInit = firstCall[1] as RequestInit;

    expect(String(firstCall[0])).toBe(
      "https://secuai.example.com/api/v1/protection/check",
    );
    expect(firstCallInit).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-ingestion-key": "site-key",
      },
    });
    expect(JSON.parse(String(firstCallInit.body))).toMatchObject({
      siteId: "site-001",
      method: "GET",
      host: "yachts.example.com",
      path: "/yachts",
      queryString: "page=1",
      clientIp: "203.0.113.10",
    });
  });

  test("blocks only when platform explicitly returns block", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              protection: {
                action: "block",
                mode: "protect",
                reasons: ["blocked_ip"],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const result = await checkSecuAIRequest(
      requestContext,
      readSecuAIConfig({
        SECUAI_ENABLED: "true",
        SECUAI_PLATFORM_URL: "https://secuai.example.com",
        SECUAI_SITE_ID: "site-001",
        SECUAI_SITE_INGESTION_KEY: "site-key",
      }),
    );

    expect(result).toMatchObject({
      allow: false,
      action: "block",
      mode: "protect",
      reasons: ["blocked_ip"],
      failOpen: false,
    });
  });

  test("fails open by default when platform is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }),
    );

    const result = await checkSecuAIRequest(
      requestContext,
      readSecuAIConfig({
        SECUAI_ENABLED: "true",
        SECUAI_PLATFORM_URL: "https://secuai.example.com",
        SECUAI_SITE_ID: "site-001",
        SECUAI_SITE_INGESTION_KEY: "site-key",
      }),
    );

    expect(result).toMatchObject({
      allow: true,
      action: "fail-open",
      mode: "fail-open",
      failOpen: true,
    });
    expect(result.failOpenReason).toContain("platform_unavailable");
  });

  test("can fail closed when fail-open is disabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad gateway", { status: 502 })),
    );

    const result = await checkSecuAIRequest(
      requestContext,
      readSecuAIConfig({
        SECUAI_ENABLED: "true",
        SECUAI_PLATFORM_URL: "https://secuai.example.com",
        SECUAI_SITE_ID: "site-001",
        SECUAI_SITE_INGESTION_KEY: "site-key",
        SECUAI_FAIL_OPEN: "false",
      }),
    );

    expect(result).toMatchObject({
      allow: false,
      action: "fail-closed",
      mode: "fail-closed",
      failOpen: false,
    });
  });

  test("checks page requests and skips static assets or api routes", () => {
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/" })).toBe(true);
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/yachts/demo" })).toBe(true);
    expect(shouldCheckSecuAIRequest({ method: "POST", pathname: "/contact" })).toBe(false);
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/api/yachts" })).toBe(false);
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/_next/static/app.js" })).toBe(
      false,
    );
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/favicon.ico" })).toBe(false);
    expect(shouldCheckSecuAIRequest({ method: "GET", pathname: "/images/yacht.jpg" })).toBe(
      false,
    );
  });
});
