import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import { defaultLayout } from "@/lib/frame";
import { sameOrigin, toFrame, verifyAdmin } from "@/lib/server";

export async function GET() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const rows = await getDb().select().from(frames).orderBy(desc(frames.updatedAt));
  return NextResponse.json(rows.map(toFrame));
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || !(await verifyAdmin())) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const now = Date.now();
  const id = crypto.randomUUID();
  const [row] = await getDb().insert(frames).values({ id, title: "새 프레임", subtitle: "포즈를 함께 완성해요", layout: JSON.stringify(defaultLayout), createdAt: now, updatedAt: now }).returning();
  return NextResponse.json(toFrame(row), { status: 201 });
}
