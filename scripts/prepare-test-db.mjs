import { execSync } from "node:child_process";

import pg from "pg";

const { Client } = pg;

const defaultAdminUrl =
  process.env.TEST_DATABASE_ADMIN_URL ??
  "postgresql://yacht_sales:yacht_sales_dev_password@127.0.0.1:55433/postgres";
const defaultDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://yacht_sales:yacht_sales_dev_password@127.0.0.1:55433/sme_yacht_sales_test?schema=public";

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const client = new Client({ connectionString: defaultAdminUrl });

    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
  }

  throw new Error("PostgreSQL 未在预期时间内就绪");
}

async function ensureDatabase() {
  const target = new URL(defaultDatabaseUrl);
  const databaseName = target.pathname.replace(/^\//, "");

  const client = new Client({ connectionString: defaultAdminUrl });
  await client.connect();

  const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
  }

  await client.end();
}

await waitForServer();
await ensureDatabase();

const prismaCommand = process.platform === "win32" ? "npx prisma db push" : "npx prisma db push";

execSync(prismaCommand, {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: defaultDatabaseUrl,
  },
});
