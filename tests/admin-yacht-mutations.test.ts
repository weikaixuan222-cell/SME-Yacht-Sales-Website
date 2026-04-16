import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { YachtCondition, YachtStatus } from "@/generated/prisma/enums";
import {
  createAdminYacht,
  deleteAdminYacht,
  updateAdminYacht,
} from "@/server/admin-yachts";
import { createInquiry } from "@/server/inquiries";

import { resetDatabase, testPrisma } from "./helpers/db";

describe("admin yacht mutations", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await testPrisma.$disconnect();
  });

  test("creates a yacht in the database", async () => {
    const yacht = await createAdminYacht({
      name: "Azimut 53",
      brand: "Azimut",
      model: "53",
      year: 2021,
      price: "830000.00",
      length: "16.78",
      capacity: 12,
      condition: "USED",
      location: "Hong Kong",
      description: "Admin create verification",
      coverImage: "https://images.example.com/azimut-53.jpg",
      galleryImages: ["https://images.example.com/azimut-53-1.jpg"],
      status: "AVAILABLE",
    });

    expect(yacht.name).toBe("Azimut 53");
    expect(await testPrisma.yacht.count()).toBe(1);
  });

  test("updates an existing yacht", async () => {
    const yacht = await testPrisma.yacht.create({
      data: {
        name: "Azimut 53",
        brand: "Azimut",
        model: "53",
        year: 2021,
        price: "830000.00",
        length: "16.78",
        capacity: 12,
        condition: YachtCondition.USED,
        location: "Hong Kong",
        description: "Before update",
        coverImage: "https://images.example.com/azimut-53.jpg",
        galleryImages: ["https://images.example.com/azimut-53-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });

    const updated = await updateAdminYacht(yacht.id, {
      name: "Azimut 53 Updated",
      brand: "Azimut",
      model: "53",
      year: 2021,
      price: "840000.00",
      length: "16.78",
      capacity: 12,
      condition: "USED",
      location: "Macau",
      description: "After update",
      coverImage: "https://images.example.com/azimut-53.jpg",
      galleryImages: ["https://images.example.com/azimut-53-1.jpg"],
      status: "SOLD",
    });

    expect(updated.name).toBe("Azimut 53 Updated");
    expect(updated.status).toBe("SOLD");
    expect(updated.location).toBe("Macau");
  });

  test("deletes an existing yacht", async () => {
    const yacht = await testPrisma.yacht.create({
      data: {
        name: "Delete Me",
        brand: "Prestige",
        model: "460",
        year: 2020,
        price: "550000.00",
        length: "14.29",
        capacity: 10,
        condition: YachtCondition.USED,
        location: "Shenzhen",
        description: "To be deleted",
        coverImage: "https://images.example.com/prestige-460.jpg",
        galleryImages: ["https://images.example.com/prestige-460-1.jpg"],
        status: YachtStatus.DRAFT,
      },
    });

    await deleteAdminYacht(yacht.id);

    expect(await testPrisma.yacht.findUnique({ where: { id: yacht.id } })).toBeNull();
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
        description: "A flybridge yacht for inquiry service testing.",
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
});
