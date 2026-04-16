import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const testDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://yacht_sales:yacht_sales_dev_password@127.0.0.1:55433/sme_yacht_sales_test?schema=public";

const adapter = new PrismaPg({
  connectionString: testDatabaseUrl,
});

export const testPrisma = new PrismaClient({
  adapter,
  log: ["error"],
});

export async function resetDatabase() {
  await testPrisma.inquiry.deleteMany();
  await testPrisma.yacht.deleteMany();
  await testPrisma.admin.deleteMany();
}
