import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { YachtCondition, YachtStatus } from "@/generated/prisma/enums";
import { listAdminInquiries } from "@/server/admin-inquiries";
import { listAdminYachts } from "@/server/admin-yachts";

import { resetDatabase, testPrisma } from "./helpers/db";

describe("admin data services", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await testPrisma.$disconnect();
  });

  test("lists inquiries with yacht summary ordered by latest first", async () => {
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
        description: "A flybridge yacht for admin inquiries testing.",
        coverImage: "https://images.example.com/princess-f45.jpg",
        galleryImages: ["https://images.example.com/princess-f45-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });

    await testPrisma.inquiry.create({
      data: {
        yachtId: yacht.id,
        customerName: "Alice",
        email: "alice@example.com",
        phone: "+85212345678",
        message: "Need berth details",
      },
    });

    await testPrisma.inquiry.create({
      data: {
        yachtId: yacht.id,
        customerName: "Bob",
        email: "bob@example.com",
        phone: "+85299998888",
        message: "Need a viewing slot",
      },
    });

    const inquiries = await listAdminInquiries();

    expect(inquiries).toHaveLength(2);
    expect(inquiries[0]).toMatchObject({
      customerName: "Bob",
      yacht: {
        id: yacht.id,
        name: "Princess F45",
      },
    });
  });

  test("lists all yachts including draft with inquiry counts", async () => {
    const available = await testPrisma.yacht.create({
      data: {
        name: "Available Yacht",
        brand: "Aquila",
        model: "48",
        year: 2022,
        price: "660000.00",
        length: "14.60",
        capacity: 10,
        condition: YachtCondition.USED,
        location: "Shenzhen",
        description: "Visible publicly.",
        coverImage: "https://images.example.com/available.jpg",
        galleryImages: ["https://images.example.com/available-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });

    await testPrisma.yacht.create({
      data: {
        name: "Draft Yacht",
        brand: "Ferretti",
        model: "Preview",
        year: 2024,
        price: "1200000.00",
        length: "18.50",
        capacity: 12,
        condition: YachtCondition.NEW,
        location: "Hong Kong",
        description: "Hidden draft entry.",
        coverImage: "https://images.example.com/draft.jpg",
        galleryImages: ["https://images.example.com/draft-1.jpg"],
        status: YachtStatus.DRAFT,
      },
    });

    await testPrisma.inquiry.create({
      data: {
        yachtId: available.id,
        customerName: "Lead",
        email: "lead@example.com",
        phone: "+85277776666",
        message: "Interested in purchase.",
      },
    });

    const yachts = await listAdminYachts();

    expect(yachts).toHaveLength(2);
    expect(yachts.find((item) => item.name === "Draft Yacht")).toBeTruthy();
    expect(yachts.find((item) => item.id === available.id)?.inquiryCount).toBe(1);
  });
});
