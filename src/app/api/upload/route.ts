import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminSession } from "@/server/admin-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "未授权的访问" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未接收到有效的文件" }, { status: 400 });
    }

    // 2. Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 });
    }

    // 3. Generate somewhat secure unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Attempt to extract extension from the original name (fallback to .jpg if missing or strange)
    const originalExt = file.name.split('.').pop()?.toLowerCase();
    const isSafeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(originalExt || "");
    const ext = isSafeExt ? originalExt : "jpg";

    const uniqueId = randomUUID();
    const filename = `${uniqueId}.${ext}`;

    // 4. Ensure destination exists
    const uploadDir = join(process.cwd(), "public", "uploads", "yachts");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if folder exists
    }

    // 5. Write file
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 6. Return relative URL
    return NextResponse.json({ 
      url: `/uploads/yachts/${filename}` 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "图片上传失败，请检查服务器本地权限或稍后再试" },
      { status: 500 }
    );
  }
}
