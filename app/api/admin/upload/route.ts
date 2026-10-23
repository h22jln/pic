import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdmin } from "@/lib/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || !(await verifyAdmin())) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const body = await request.formData().catch(() => null);
  const file = body?.get("file");
  const selection = body?.get("purpose") === "selection";
  const allowed = selection ? ["image/png", "image/jpeg", "image/webp"] : ["image/png"];
  if (!(file instanceof File) || !allowed.includes(file.type) || file.size < 16 || file.size > 6 * 1024 * 1024) return NextResponse.json({ error: selection ? "6MB 이하의 PNG, JPG 또는 WebP 이미지를 선택해 주세요." : "6MB 이하의 투명 PNG를 선택해 주세요." }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const signature = new Uint8Array(bytes.slice(0, 12));
  const png = [137,80,78,71,13,10,26,10].every((n, i) => signature[i] === n);
  const jpg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
  const webp = String.fromCharCode(...signature.slice(0, 4)) === "RIFF" && String.fromCharCode(...signature.slice(8, 12)) === "WEBP";
  if (!(file.type === "image/png" && png || selection && file.type === "image/jpeg" && jpg || selection && file.type === "image/webp" && webp)) return NextResponse.json({ error: "이미지 파일 형식을 확인해 주세요." }, { status: 400 });
  if (!env.BUCKET) return NextResponse.json({ error: "파일 저장소가 준비되지 않았습니다." }, { status: 503 });
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
  return NextResponse.json({ key, url: `/api/assets/${key}` });
}
