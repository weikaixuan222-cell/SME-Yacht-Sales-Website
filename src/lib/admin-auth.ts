import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { AdminRole } from "@/generated/prisma/enums";

export const ADMIN_SESSION_COOKIE_NAME = "sme_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type AdminSessionPayload = {
  adminId: string;
  email: string;
  role: AdminRole;
  expiresAt: number;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("请先配置 ADMIN_SESSION_SECRET");
  }

  return secret;
}

function createSignature(encodedPayload: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(encodedPayload).digest("base64url");
}

export function isAdminSessionConfigured() {
  return Boolean(process.env.ADMIN_SESSION_SECRET);
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashAdminPassword(password: string) {
  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 8) {
    throw new Error("管理员密码至少需要 8 位字符");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(normalizedPassword, salt, 64).toString("hex");

  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, salt, storedDerivedKey] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedDerivedKey) {
    return false;
  }

  const actualDerivedKey = scryptSync(password.trim(), salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(storedDerivedKey, "utf8");
  const actualBuffer = Buffer.from(actualDerivedKey, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createAdminSessionToken(payload: Omit<AdminSessionPayload, "expiresAt">) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const value: AdminSessionPayload = {
    ...payload,
    expiresAt,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(value));
  const signature = createSignature(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

export function verifyAdminSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminSessionPayload;

    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    if (payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((result, pair) => {
    const [rawName, ...rawValueParts] = pair.split("=");
    const name = rawName?.trim();

    if (!name) {
      return result;
    }

    result[name] = decodeURIComponent(rawValueParts.join("=").trim());
    return result;
  }, {});
}

export function readAdminSessionTokenFromCookieHeader(cookieHeader: string | null) {
  return parseCookieHeader(cookieHeader)[ADMIN_SESSION_COOKIE_NAME] ?? null;
}

export function createAdminSessionCookieValue(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function createExpiredAdminSessionCookieValue() {
  return {
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
