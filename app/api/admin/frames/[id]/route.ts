import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import { isDecorations, isLayout } from "@/lib/frame";
import { sameOrigin, toFrame, verifyAdmin } from "@/lib/server";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request) || !(await verifyAdmin())) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const { id } = await context.params;
  const data = await request.json().catch(() => null) as Record<string, any> | null;
  if (!data || typeof data.title !== "string" || !data.title.trim() || data.title.length > 80 || typeof data.subtitle !== "string" || data.subtitle.length > 160 || !/^#[0-9a-fA-F]{6}$/.test(data.accent) || !/^#[0-9a-fA-F]{6}$/.test(data.backgroundColor) || !isDecorations(data.decorations) || typeof data.published !== "boolean" || typeof data.showHero !== "boolean" || !isLayout(data.layout) || !Array.isArray(data.poses) || data.poses.length !== 4 || !data.poses.every((x: unknown) => x === null || (typeof x === "string" && /^[a-f0-9-]{36}\.png$/.test(x))) || ![data.decoration, data.hero].every((x) => x === null || (typeof x === "string" && /^[a-f0-9-]{36}\.png$/.test(x))) || !(data.selectionImage === null || (typeof data.selectionImage === "string" && /^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(data.selectionImage)))) {
    return NextResponse.json({ error: "프레임 내용을 확인해 주세요." }, { status: 400 });
  }
  if (data.published && (data.poses.some((x: unknown) => !x) || (data.showHero && !data.hero))) return NextResponse.json({ error: "공개하려면 포즈 4개와 오른쪽 이미지를 등록해 주세요." }, { status: 400 });
  const [row] = await getDb().update(frames).set({ title: data.title.trim(), subtitle: data.subtitle.trim(), accent: data.accent, backgroundColor: data.backgroundColor, published: data.published, showHero: data.showHero, poses: JSON.stringify(data.poses), decoration: data.decoration, decorations: JSON.stringify(data.decorations.map((item: { id: string; type?: string; key?: string; text?: string; color?: string; rect: unknown }) => item.type === "text" ? { id: item.id, type: "text", text: item.text, color: item.color, rect: item.rect } : { id: item.id, type: "image", key: item.key, rect: item.rect })), hero: data.hero, selectionImage: data.selectionImage, layout: JSON.stringify(data.layout), updatedAt: Date.now() }).where(eq(frames.id, id)).returning();
  if (!row) return NextResponse.json({ error: "프레임을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(toFrame(row));
}
