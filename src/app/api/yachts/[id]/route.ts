import { NextResponse } from "next/server";

import {
  badRequest,
  internalServerError,
  notFound,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { validateYachtPayload } from "@/lib/validators";
import { requireAdminApiSession } from "@/server/admin-auth";
import { deleteAdminYacht, updateAdminYacht } from "@/server/admin-yachts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再访问游艇接口。");
  }

  const { id } = await params;

  try {
    const prisma = getPrismaClient();
    const yacht = await prisma.yacht.findUnique({
      where: { id },
      include: {
        inquiries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!yacht) {
      return notFound("游艇不存在。");
    }

    return NextResponse.json({ data: yacht });
  } catch (error) {
    console.error(error);
    return internalServerError("获取游艇详情失败。");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再更新游艇数据。");
  }

  const { id } = await params;
  const payload = await parseJsonBody<unknown>(request);

  if (!payload) {
    return badRequest("请求体必须为合法 JSON。");
  }

  const result = validateYachtPayload(payload);

  if (!result.ok) {
    return badRequest(result.error);
  }

  try {
    const yacht = await updateAdminYacht(id, result.value);

    return NextResponse.json({ data: yacht });
  } catch (error) {
    console.error(error);
    return notFound("游艇不存在或更新失败。");
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再删除游艇数据。");
  }

  const { id } = await params;

  try {
    await deleteAdminYacht(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return notFound("游艇不存在或删除失败。");
  }
}
