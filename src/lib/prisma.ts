import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaDatabaseUrl: string | undefined;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 未配置");
  }

  if (globalThis.prisma && globalThis.prismaDatabaseUrl !== databaseUrl) {
    globalThis.prisma.$disconnect().catch(() => undefined);
    globalThis.prisma = undefined;
    globalThis.prismaDatabaseUrl = undefined;
  }

  if (!globalThis.prisma) {
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    globalThis.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    globalThis.prismaDatabaseUrl = databaseUrl;
  }

  return globalThis.prisma;
}
