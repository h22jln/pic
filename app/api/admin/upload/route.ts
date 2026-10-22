import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdmin } from "@/lib/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || !(await verifyAdmin())) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const body = await request.formData().catch(() => null);
  const file = body?.get("file");
  if (!(file instanceof File) || file.type !== "image/png" || file.size < 16 || file.size > 6 * 1024 * 1024) return NextResponse.json({ error: "6MB 이하의 투명 PNG를 선택해 주세요." }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const signature = new Uint8Array(bytes.slice(0, 8));
  if ([137,80,78,71,13,10,26,10].some((n, i) => signature[i] !== n)) return NextResponse.json({ error: "PNG 파일이 아닙니다." }, { status: 400 });
  if (!env.BUCKET) return NextResponse.json({ error: "파일 저장소가 준비되지 않았습니다." }, { status: 503 });
  const key = `${crypto.randomUUID()}.png`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: "image/png" } });
  return NextResponse.json({ key, url: `/api/assets/${key}` });
}
