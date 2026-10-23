import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { qrPhotos } from "@/db/schema";
import { verifyAdmin } from "@/lib/server";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  const page = Number(request.nextUrl.searchParams.get("page") || "0");
  if (!Number.isSafeInteger(page) || page < 0 || page > 1000) return NextResponse.json({ error: "페이지 번호를 확인해 주세요." }, { status: 400 });
  const rows = await getDb().select({ id: qrPhotos.id, frameTitle: qrPhotos.frameTitle, createdAt: qrPhotos.createdAt })
    .from(qrPhotos).orderBy(desc(qrPhotos.createdAt), desc(qrPhotos.id)).limit(PAGE_SIZE + 1).offset(page * PAGE_SIZE);
  return NextResponse.json({
    items: rows.slice(0, PAGE_SIZE).map((row) => ({ ...row, imageUrl: `/api/qr-photos/${row.id}/image`, pageUrl: `/qr/${row.id}` })),
    hasMore: rows.length > PAGE_SIZE,
  }, { headers: { "Cache-Control": "no-store" } });
}
