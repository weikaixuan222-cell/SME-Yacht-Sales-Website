import { NextResponse } from "next/server";

import {
  badRequest,
  internalServerError,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { validateYachtPayload } from "@/lib/validators";
import { requireAdminApiSession } from "@/server/admin-auth";
import { createAdminYacht } from "@/server/admin-yachts";

export async function GET(request: Request) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再访问游艇接口。");
  }

  try {
    const prisma = getPrismaClient();
    const yachts = await prisma.yacht.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { inquiries: true },
        },
      },
    });

    return NextResponse.json({ data: yachts });
  } catch (error) {
    console.error(error);
    return internalServerError("获取游艇列表失败。");
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再创建游艇数据。");
  }

  const payload = await parseJsonBody<unknown>(request);

  if (!payload) {
    return badRequest("请求体必须为合法 JSON。");
  }

  const result = validateYachtPayload(payload);

  if (!result.ok) {
    return badRequest(result.error);
  }

  try {
    const yacht = await createAdminYacht(result.value);

    return NextResponse.json({ data: yacht }, { status: 201 });
  } catch (error) {
    console.error(error);
    return internalServerError("创建游艇失败。");
  }
}
