import { NextResponse } from "next/server";

import {
  badRequest,
  internalServerError,
  notFound,
  parseJsonBody,
  serviceUnavailable,
} from "@/lib/api";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { validateInquiryPayload } from "@/lib/validators";
import { requireAdminApiSession } from "@/server/admin-auth";
import { createInquiry } from "@/server/inquiries";

export async function GET(request: Request) {
  const auth = await requireAdminApiSession(request);

  if (!auth.ok) {
    return auth.response;
  }

  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再访问询盘接口。");
  }

  try {
    const prisma = getPrismaClient();
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        yacht: {
          select: {
            id: true,
            name: true,
            brand: true,
            model: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ data: inquiries });
  } catch (error) {
    console.error(error);
    return internalServerError("获取询盘列表失败。");
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return serviceUnavailable("请先配置 DATABASE_URL 再提交询盘。");
  }

  const payload = await parseJsonBody<unknown>(request);

  if (!payload) {
    return badRequest("请求体必须为合法 JSON。");
  }

  const result = validateInquiryPayload(payload);

  if (!result.ok) {
    return badRequest(result.error);
  }

  try {
    const inquiryResult = await createInquiry(result.value);

    if (!inquiryResult.ok) {
      return notFound(inquiryResult.error);
    }

    return NextResponse.json({ data: inquiryResult.value }, { status: 201 });
  } catch (error) {
    console.error(error);
    return internalServerError("提交询盘失败。");
  }
}
