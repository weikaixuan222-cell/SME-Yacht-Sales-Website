import "dotenv/config";
import { randomUUID } from "node:crypto";

import { Client } from "pg";

import { hashAdminPassword, normalizeAdminEmail } from "../src/lib/admin-auth";

if (!process.env.DATABASE_URL) {
  throw new Error("运行 seed 前请先配置 DATABASE_URL");
}

const adminEmail = normalizeAdminEmail(process.env.ADMIN_EMAIL ?? "admin@example.com");
const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-please";

const yachts = [
  {
    name: "Princess F45",
    brand: "Princess",
    model: "F45",
    year: 2023,
    price: "920000.00",
    length: "14.35",
    capacity: 10,
    condition: "NEW",
    location: "Hong Kong",
    description:
      "适合接待、商务演示和近海休闲的中型飞桥游艇，当前用于 MVP 列表与详情演示。",
    coverImage:
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "AVAILABLE",
  },
  {
    name: "Absolute 52 Fly",
    brand: "Absolute",
    model: "52 Fly",
    year: 2022,
    price: "780000.00",
    length: "16.76",
    capacity: 12,
    condition: "USED",
    location: "Shenzhen",
    description:
      "带飞桥和宽敞会客区的二手游艇，适合本地客户看船和详情页参数展示演示。",
    coverImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "AVAILABLE",
  },
  {
    name: "Beneteau Oceanis 46.1",
    brand: "Beneteau",
    model: "Oceanis 46.1",
    year: 2021,
    price: "420000.00",
    length: "14.60",
    capacity: 8,
    condition: "USED",
    location: "Xiamen",
    description:
      "帆船类型演示数据，用于保证列表页存在多条真实记录，便于现场切换展示。",
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "SOLD",
  },
] as const;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM "Inquiry"');
    await client.query('DELETE FROM "Yacht"');
    await client.query('DELETE FROM "Admin"');

    await client.query(
      `
        INSERT INTO "Admin"
          ("id", "email", "passwordHash", "role", "createdAt", "updatedAt")
        VALUES
          ($1, $2, $3, $4::"AdminRole", NOW(), NOW())
      `,
      [randomUUID(), adminEmail, hashAdminPassword(adminPassword), "SUPER_ADMIN"],
    );

    for (const yacht of yachts) {
      await client.query(
        `
          INSERT INTO "Yacht"
            ("id", "name", "brand", "model", "year", "price", "length", "capacity", "condition", "location", "description", "coverImage", "galleryImages", "status", "createdAt", "updatedAt")
          VALUES
            ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8, $9::"YachtCondition", $10, $11, $12, $13::text[], $14::"YachtStatus", NOW(), NOW())
        `,
        [
          randomUUID(),
          yacht.name,
          yacht.brand,
          yacht.model,
          yacht.year,
          yacht.price,
          yacht.length,
          yacht.capacity,
          yacht.condition,
          yacht.location,
          yacht.description,
          yacht.coverImage,
          yacht.galleryImages,
          yacht.status,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
