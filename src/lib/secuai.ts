export type SecuAIProtectionAction = "allow" | "monitor" | "block";
export type SecuAIProtectionMode = "monitor" | "protect";
export type SecuAIMiddlewareAction =
  | SecuAIProtectionAction
  | "disabled"
  | "fail-open"
  | "fail-closed";

export type SecuAIConfig = {
  enabled: boolean;
  platformUrl: string;
  siteId: string;
  siteIngestionKey: string;
  failOpen: boolean;
  timeoutMs: number;
  checkPath: string;
};

export type SecuAIRequestContext = {
  method: string;
  host: string;
  path: string;
  queryString?: string;
  clientIp?: string;
  userAgent?: string;
  referer?: string;
  occurredAt?: string;
};

export type SecuAICheckResult = {
  allow: boolean;
  action: SecuAIMiddlewareAction;
  mode: SecuAIProtectionMode | "disabled" | "fail-open" | "fail-closed";
  reasons: string[];
  failOpen: boolean;
  failOpenReason?: string;
};

type SecuAIEnv = Partial<Record<string, string | undefined>>;

const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_CHECK_PATH = "/api/v1/protection/check";

function readBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function readPositiveInteger(value: string | undefined, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function normalizeBaseUrl(value: string | undefined) {
  return (value ?? "").trim().replace(/\/+$/, "");
}

function normalizeCheckPath(value: string | undefined) {
  const path = (value ?? DEFAULT_CHECK_PATH).trim();
  return path.startsWith("/") ? path : `/${path}`;
}

function resolveCheckUrl(config: SecuAIConfig) {
  return new URL(config.checkPath, `${config.platformUrl}/`).toString();
}

function buildSoftFailureResult(config: SecuAIConfig, reason: string): SecuAICheckResult {
  if (config.failOpen) {
    // 安全平台不可用时默认放行，避免 SecuAI 故障阻断游艇站点演示。
    return {
      allow: true,
      action: "fail-open",
      mode: "fail-open",
      reasons: [],
      failOpen: true,
      failOpenReason: reason,
    };
  }

  return {
    allow: false,
    action: "fail-closed",
    mode: "fail-closed",
    reasons: [reason],
    failOpen: false,
  };
}

function isConfigured(config: SecuAIConfig) {
  return Boolean(config.platformUrl && config.siteId && config.siteIngestionKey);
}

function normalizePlatformDecision(payload: unknown): SecuAICheckResult | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as {
    success?: unknown;
    data?: {
      protection?: {
        action?: unknown;
        mode?: unknown;
        reasons?: unknown;
      };
    };
  };
  const protection = root.data?.protection;

  if (root.success !== true || !protection) {
    return null;
  }

  if (
    protection.action !== "allow" &&
    protection.action !== "monitor" &&
    protection.action !== "block"
  ) {
    return null;
  }

  const mode = protection.mode === "protect" ? "protect" : "monitor";
  const reasons = Array.isArray(protection.reasons)
    ? protection.reasons.filter((item): item is string => typeof item === "string")
    : [];

  return {
    allow: protection.action !== "block",
    action: protection.action,
    mode,
    reasons,
    failOpen: false,
  };
}

export function readSecuAIConfig(env: SecuAIEnv = process.env): SecuAIConfig {
  const platformUrl = normalizeBaseUrl(env.SECUAI_PLATFORM_URL);
  const siteId = (env.SECUAI_SITE_ID ?? "").trim();
  const siteIngestionKey = (env.SECUAI_SITE_INGESTION_KEY ?? "").trim();
  const hasRequiredConfig = Boolean(platformUrl && siteId && siteIngestionKey);

  return {
    enabled: readBoolean(env.SECUAI_ENABLED, hasRequiredConfig),
    platformUrl,
    siteId,
    siteIngestionKey,
    failOpen: readBoolean(env.SECUAI_FAIL_OPEN, true),
    timeoutMs: readPositiveInteger(env.SECUAI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    checkPath: normalizeCheckPath(env.SECUAI_CHECK_PATH),
  };
}

export async function checkSecuAIRequest(
  context: SecuAIRequestContext,
  config = readSecuAIConfig(),
): Promise<SecuAICheckResult> {
  if (!config.enabled) {
    return {
      allow: true,
      action: "disabled",
      mode: "disabled",
      reasons: [],
      failOpen: false,
    };
  }

  if (!isConfigured(config)) {
    return buildSoftFailureResult(config, "not_configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(resolveCheckUrl(config), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-ingestion-key": config.siteIngestionKey,
      },
      body: JSON.stringify({
        siteId: config.siteId,
        occurredAt: context.occurredAt ?? new Date().toISOString(),
        method: context.method,
        host: context.host,
        path: context.path,
        queryString: context.queryString,
        clientIp: context.clientIp,
        userAgent: context.userAgent,
        referer: context.referer,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return buildSoftFailureResult(config, `platform_error:${response.status}`);
    }

    const decision = normalizePlatformDecision(await response.json());

    if (!decision) {
      return buildSoftFailureResult(config, "platform_error:invalid_response");
    }

    return decision;
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "platform_timeout"
        : `platform_unavailable:${error instanceof Error ? error.message : String(error)}`;

    return buildSoftFailureResult(config, reason);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function shouldCheckSecuAIRequest({
  method,
  pathname,
}: {
  method: string;
  pathname: string;
}) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod !== "GET" && normalizedMethod !== "HEAD") {
    return false;
  }

  if (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return false;
  }

  return !/\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|woff2?)$/i.test(
    pathname,
  );
}
