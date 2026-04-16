import { YachtStatus } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma";

type CreateInquiryInput = {
  yachtId: string;
  customerName: string;
  email: string;
  phone: string;
  message: string;
};

export async function createInquiry(input: CreateInquiryInput) {
  const prisma = getPrismaClient();
  const yacht = await prisma.yacht.findFirst({
    where: {
      id: input.yachtId,
      status: {
        in: [YachtStatus.AVAILABLE, YachtStatus.SOLD],
      },
    },
    select: {
      id: true,
    },
  });

  if (!yacht) {
    return {
      ok: false as const,
      code: "NOT_FOUND" as const,
      error: "目标游艇不存在或暂不可提交询盘。",
    };
  }

  const inquiry = await prisma.inquiry.create({
    data: input,
  });

  return { ok: true as const, value: inquiry };
}
