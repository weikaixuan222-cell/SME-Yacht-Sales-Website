process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://yacht_sales:yacht_sales_dev_password@127.0.0.1:55433/sme_yacht_sales_test?schema=public";
process.env.ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "test-admin-session-secret";
