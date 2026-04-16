import { YachtStatus } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma";

const PUBLIC_STATUSES = [YachtStatus.AVAILABLE, YachtStatus.SOLD];

function toNumber(value: string | number | { toString(): string }) {
  return Number(value.toString());
}

export async function getPublicYachtList() {
  const prisma = getPrismaClient();
  const yachts = await prisma.yacht.findMany({
    where: {
      status: {
        in: PUBLIC_STATUSES,
      },
    },
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
    coverImage: yacht.coverImage,
    status: yacht.status,
    inquiryCount: yacht._count.inquiries,
    description: yacht.description,
  }));
}

export async function getPublicYachtById(id: string) {
  const prisma = getPrismaClient();
  const yacht = await prisma.yacht.findFirst({
    where: {
      id,
      status: {
        in: PUBLIC_STATUSES,
      },
    },
    include: {
      _count: {
        select: { inquiries: true },
      },
    },
  });

  if (!yacht) {
    return null;
  }

  return {
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
  };
}
