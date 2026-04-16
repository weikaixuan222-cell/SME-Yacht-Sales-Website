import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { DELETE as deleteSession, POST as createSession } from "@/app/api/admin/session/route";
import { GET as getInquiries } from "@/app/api/inquiries/route";
import { GET as getYachts, POST as postYacht } from "@/app/api/yachts/route";
import { YachtCondition, YachtStatus } from "@/generated/prisma/enums";
import { hashAdminPassword } from "@/lib/admin-auth";

import { resetDatabase, testPrisma } from "./helpers/db";

describe("admin auth protection", () => {
  beforeEach(async () => {
    await resetDatabase();

    await testPrisma.admin.create({
      data: {
        email: "admin@example.com",
        passwordHash: hashAdminPassword("change-me-please"),
        role: "SUPER_ADMIN",
      },
    });

    await testPrisma.yacht.create({
      data: {
        name: "Protected Yacht",
        brand: "Princess",
        model: "F45",
        year: 2023,
        price: "920000.00",
        length: "14.35",
        capacity: 10,
        condition: YachtCondition.NEW,
        location: "Hong Kong",
        description: "Used to verify admin API protection.",
        coverImage: "https://images.example.com/protected-yacht.jpg",
        galleryImages: ["https://images.example.com/protected-yacht-1.jpg"],
        status: YachtStatus.AVAILABLE,
      },
    });
  });

  afterAll(async () => {
    await resetDatabase();
    await testPrisma.$disconnect();
  });

  test("rejects unauthenticated access to admin yacht list api", async () => {
    const response = await getYachts(new Request("http://localhost/api/yachts"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toContain("登录");
  });

  test("rejects unauthenticated yacht creation", async () => {
    const response = await postYacht(
      new Request("http://localhost/api/yachts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Azimut 53",
          brand: "Azimut",
          model: "53",
          year: 2021,
          price: 830000,
          length: 16.78,
          capacity: 12,
          condition: "USED",
          location: "Hong Kong",
          description: "Should require admin login.",
          coverImage: "https://images.example.com/azimut-53.jpg",
          galleryImages: ["https://images.example.com/azimut-53-1.jpg"],
          status: "AVAILABLE",
        }),
      }),
    );
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toContain("登录");
  });

  test("rejects unauthenticated access to inquiry list api", async () => {
    const response = await getInquiries(new Request("http://localhost/api/inquiries"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(body.error).toContain("登录");
  });

  test("creates an admin session and allows access to protected yacht api", async () => {
    const loginResponse = await createSession(
      new Request("http://localhost/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "change-me-please",
        }),
      }),
    );

    expect(loginResponse.status).toBe(200);
    const cookie = loginResponse.headers.get("set-cookie");
    expect(cookie).toContain("sme_admin_session=");

    const response = await getYachts(
      new Request("http://localhost/api/yachts", {
        headers: {
          cookie: cookie ?? "",
        },
      }),
    );

    expect(response.status).toBe(200);
  });

  test("rejects wrong admin password and clears session on logout", async () => {
    const loginResponse = await createSession(
      new Request("http://localhost/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "wrong-password",
        }),
      }),
    );
    const loginBody = (await loginResponse.json()) as { error?: string };

    expect(loginResponse.status).toBe(401);
    expect(loginBody.error).toContain("密码");

    const logoutResponse = await deleteSession();

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
