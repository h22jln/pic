import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { frames, qrPhotos } from "@/db/schema";
import { sameOrigin } from "@/lib/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "요청을 확인할 수 없습니다." }, { status: 403 });
  if (!env.BUCKET) return NextResponse.json({ error: "파일 저장소가 준비되지 않았습니다." }, { status: 503 });
  const body = await request.formData().catch(() => null);
  const file = body?.get("image");
  const frameId = body?.get("frameId");
  if (!(file instanceof File) || file.type !== "image/png" || file.size < 100 || file.size > 8 * 1024 * 1024 || typeof frameId !== "string" || !/^[a-f0-9-]{36}$/.test(frameId)) {
    return NextResponse.json({ error: "완성된 PNG 사진을 확인해 주세요. 최대 8MB까지 저장할 수 있습니다." }, { status: 400 });
  }
  const bytes = await file.arrayBuffer();
  const header = new DataView(bytes, 0, Math.min(bytes.byteLength, 24));
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (header.byteLength < 24 || !signature.every((value, index) => header.getUint8(index) === value)
    || header.getUint32(16) !== 800 || header.getUint32(20) !== 1000) {
    return NextResponse.json({ error: "ONE STUDIO에서 만든 완성 사진만 저장할 수 있습니다." }, { status: 400 });
  }
  const [frame] = await getDb().select({ title: frames.title }).from(frames).where(eq(frames.id, frameId)).limit(1);
  if (!frame) return NextResponse.json({ error: "프레임을 찾을 수 없습니다." }, { status: 404 });
  const id = crypto.randomUUID();
  const imageKey = `qr/${id}.png`;
  try {
    await env.BUCKET.put(imageKey, bytes, { httpMetadata: { contentType: "image/png" } });
    await getDb().insert(qrPhotos).values({ id, frameId, frameTitle: frame.title, imageKey, createdAt: Date.now() });
  } catch {
    await env.BUCKET.delete(imageKey).catch(() => {});
    return NextResponse.json({ error: "QR 사진을 저장하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
  return NextResponse.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
