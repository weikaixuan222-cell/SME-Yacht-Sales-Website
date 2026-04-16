import { NextResponse } from "next/server";

import {
  createAdminSessionCookieValue,
  createAdminSessionToken,
  createExpiredAdminSessionCookieValue,
} from "@/lib/admin-auth";
import {
  badRequest,
  internalServerError,
  parseJsonBody,
  serviceUnavailable,
  unauthorized,
} from "@/lib/api";
import { authenticateAdmin, getAdminAuthConfigError } from "@/server/admin-auth";

function readLoginCredentials(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false as const, error: "请求体必须为 JSON 对象" };
  }

  const record = payload as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password.trim() : "";

  if (!email) {
    return { ok: false as const, error: "email 为必填项" };
  }

  if (!password) {
    return { ok: false as const, error: "password 为必填项" };
  }

  return {
    ok: true as const,
    value: {
      email,
      password,
    },
  };
}

export async function POST(request: Request) {
  const configError = getAdminAuthConfigError();

  if (configError) {
    return serviceUnavailable(configError);
  }

  const payload = await parseJsonBody<unknown>(request);

  if (!payload) {
    return badRequest("请求体必须为合法 JSON。");
  }

  const result = readLoginCredentials(payload);

  if (!result.ok) {
    return badRequest(result.error);
  }

  try {
    const admin = await authenticateAdmin(result.value.email, result.value.password);

    if (!admin) {
      return unauthorized("管理员邮箱或密码错误。");
    }

    const { token } = createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });
    const response = NextResponse.json({
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set(createAdminSessionCookieValue(token));
    return response;
  } catch (error) {
    console.error(error);
    return internalServerError("管理员登录失败。");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(createExpiredAdminSessionCookieValue());
  return response;
}
