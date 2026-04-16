import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE_NAME,
  readAdminSessionTokenFromCookieHeader,
  verifyAdminPassword,
  verifyAdminSessionToken,
  type AdminSessionPayload,
} from "@/lib/admin-auth";
import { serviceUnavailable, unauthorized } from "@/lib/api";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

export type AdminSession = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

export function getAdminAuthConfigError() {
  if (!isDatabaseConfigured()) {
    return "请先配置 DATABASE_URL";
  }

  if (!process.env.ADMIN_SESSION_SECRET) {
    return "请先配置 ADMIN_SESSION_SECRET";
  }

  return null;
}

export async function authenticateAdmin(email: string, password: string) {
  const prisma = getPrismaClient();
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!admin) {
    return null;
  }

  if (!verifyAdminPassword(password, admin.passwordHash)) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  } satisfies AdminSession;
}

async function readAdminSessionFromPayload(payload: AdminSessionPayload | null) {
  if (!payload) {
    return null;
  }

  const prisma = getPrismaClient();
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!admin) {
    return null;
  }

  if (admin.email !== payload.email) {
    return null;
  }

  return admin satisfies AdminSession;
}

export async function getAdminSession() {
  const configError = getAdminAuthConfigError();

  if (configError) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value ?? null;
  const payload = token ? verifyAdminSessionToken(token) : null;

  return readAdminSessionFromPayload(payload);
}

export async function requireAdminPageSession(nextPath: string) {
  const session = await getAdminSession();

  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

export async function requireAdminApiSession(request: Request) {
  const configError = getAdminAuthConfigError();

  if (configError) {
    return {
      ok: false as const,
      response: serviceUnavailable(configError),
    };
  }

  const token = readAdminSessionTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAdminSessionToken(token) : null;
  const session = await readAdminSessionFromPayload(payload);

  if (!session) {
    return {
      ok: false as const,
      response: unauthorized("请先登录管理员账号。"),
    };
  }

  return {
    ok: true as const,
    session,
  };
}
