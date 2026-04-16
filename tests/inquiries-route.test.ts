import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { YachtCondition, YachtStatus } from "@/generated/prisma/enums";
import { createInquiry } from "@/server/inquiries";

import { resetDatabase, testPrisma } from "./helpers/db";

describe("inquiry service", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await testPrisma.$disconnect();
  });

  test("creates an inquiry for an available yacht", async () => {
    const yacht = await testPrisma.yacht.create({
      data: {
        name: "Princess F45",
        brand: "Princess",
        model: "F45",
        year: 2023,
        price: "920000.00",
        length: "14.35",
        capacity: 10,
        condition: YachtCondition.NEW,
        location: "Hong Kong",
        description: "A flybridge yacht for customer inquiries.",
        coverImage: "https://images.example.com/princess-f45.jpg",
        galleryImages: ["https://images.example.com/princess-f45-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });

    const result = await createInquiry({
      yachtId: yacht.id,
      customerName: "Bob",
      email: "bob@example.com",
      phone: "+85298765432",
      message: "Please contact me this week.",
    });

    expect(result.ok).toBe(true);
    expect(await testPrisma.inquiry.count()).toBe(1);
  });

  test("rejects inquiries for a draft yacht", async () => {
    const yacht = await testPrisma.yacht.create({
      data: {
        name: "Hidden Draft",
        brand: "Secret",
        model: "Preview",
        year: 2024,
        price: "500000.00",
        length: "12.50",
        capacity: 9,
        condition: YachtCondition.NEW,
        location: "Hong Kong",
        description: "Draft record should not receive leads.",
        coverImage: "https://images.example.com/draft-hidden.jpg",
        galleryImages: ["https://images.example.com/draft-hidden-1.jpg"],
        status: YachtStatus.DRAFT,
      },
    });

    const result = await createInquiry({
      yachtId: yacht.id,
      customerName: "Carol",
      email: "carol@example.com",
      phone: "+85200001111",
      message: "Can I book a visit?",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_FOUND");
      expect(result.error).toContain("游艇");
    }
  });
});
