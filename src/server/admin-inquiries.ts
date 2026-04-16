import { getPrismaClient } from "@/lib/prisma";

export async function listAdminInquiries() {
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

  return inquiries.map((inquiry) => ({
    id: inquiry.id,
    customerName: inquiry.customerName,
    email: inquiry.email,
    phone: inquiry.phone,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
    yacht: inquiry.yacht,
  }));
}
