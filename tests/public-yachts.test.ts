import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { YachtCondition, YachtStatus } from "@/generated/prisma/enums";
import { getPublicYachtById, getPublicYachtList } from "@/server/public-yachts";

import { resetDatabase, testPrisma } from "./helpers/db";

describe("public yachts service", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await testPrisma.$disconnect();
  });

  test("returns only public yachts ordered by newest first", async () => {
    const available = await testPrisma.yacht.create({
      data: {
        name: "Absolute 52 Fly",
        brand: "Absolute",
        model: "52 Fly",
        year: 2022,
        price: "780000.00",
        length: "16.76",
        capacity: 12,
        condition: YachtCondition.USED,
        location: "Hong Kong",
        description: "Flybridge yacht for client demos.",
        coverImage: "https://images.example.com/absolute-52.jpg",
        galleryImages: ["https://images.example.com/absolute-52-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });

    await testPrisma.yacht.create({
      data: {
        name: "Draft Boat",
        brand: "Test",
        model: "Draft",
        year: 2021,
        price: "100000.00",
        length: "10.00",
        capacity: 8,
        condition: YachtCondition.USED,
        location: "Shenzhen",
        description: "Should stay hidden.",
        coverImage: "https://images.example.com/draft.jpg",
        galleryImages: ["https://images.example.com/draft-1.jpg"],
        status: YachtStatus.DRAFT,
      },
    });

    await testPrisma.inquiry.create({
      data: {
        yachtId: available.id,
        customerName: "Alice",
        email: "alice@example.com",
        phone: "+85212345678",
        message: "Need more details",
      },
    });

    const yachts = await getPublicYachtList();

    expect(yachts).toHaveLength(1);
    expect(yachts[0]).toMatchObject({
      id: available.id,
      name: "Absolute 52 Fly",
      inquiryCount: 1,
      status: YachtStatus.AVAILABLE,
    });
  });

  test("returns null for a draft yacht detail request", async () => {
    const draft = await testPrisma.yacht.create({
      data: {
        name: "Draft Boat",
        brand: "Test",
        model: "Draft",
        year: 2021,
        price: "100000.00",
        length: "10.00",
        capacity: 8,
        condition: YachtCondition.USED,
        location: "Shenzhen",
        description: "Should stay hidden.",
        coverImage: "https://images.example.com/draft.jpg",
        galleryImages: ["https://images.example.com/draft-1.jpg"],
        status: YachtStatus.DRAFT,
      },
    });

    const yacht = await getPublicYachtById(draft.id);

    expect(yacht).toBeNull();
  });
});
