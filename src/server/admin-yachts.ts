import { getPrismaClient } from "@/lib/prisma";

type AdminYachtInput = {
  name: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  length: string;
  capacity: number;
  condition: "NEW" | "USED";
  location: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  status: "DRAFT" | "AVAILABLE" | "SOLD";
};

function toNumber(value: string | number | { toString(): string }) {
  return Number(value.toString());
}

export async function listAdminYachts() {
  const prisma = getPrismaClient();
  const yachts = await prisma.yacht.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { inquiries: true },
      },
    },
  });

  return yachts.map((yacht) => ({
    id: yacht.id,
    name: yacht.name,
    brand: yacht.brand,
    model: yacht.model,
    year: yacht.year,
    price: toNumber(yacht.price),
    length: toNumber(yacht.length),
    capacity: yacht.capacity,
    condition: yacht.condition,
    location: yacht.location,
    description: yacht.description,
    coverImage: yacht.coverImage,
    galleryImages: yacht.galleryImages,
    status: yacht.status,
    inquiryCount: yacht._count.inquiries,
    createdAt: yacht.createdAt.toISOString(),
    updatedAt: yacht.updatedAt.toISOString(),
  }));
}

export async function createAdminYacht(input: AdminYachtInput) {
  const prisma = getPrismaClient();
  return prisma.yacht.create({
    data: input,
  });
}

export async function updateAdminYacht(id: string, input: AdminYachtInput) {
  const prisma = getPrismaClient();
  return prisma.yacht.update({
    where: { id },
    data: input,
  });
}

export async function deleteAdminYacht(id: string) {
  const prisma = getPrismaClient();
  await prisma.yacht.delete({
    where: { id },
  });
}
