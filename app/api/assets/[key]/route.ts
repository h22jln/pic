import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import { verifyAdmin } from "@/lib/server";

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[a-f0-9-]{36}\.png$/.test(key)) return new NextResponse(null, { status: 404 });
  if (!(await verifyAdmin())) {
    const rows = await getDb().select({ poses: frames.poses, decoration: frames.decoration, decorations: frames.decorations, hero: frames.hero }).from(frames).where(eq(frames.published, true));
    if (!rows.some((row) => JSON.parse(row.poses).includes(key) || row.decoration === key || row.hero === key || JSON.parse(row.decorations).some((item: { key: string }) => item.key === key))) return new NextResponse(null, { status: 404 });
  }
  const object = await env.BUCKET?.get(key);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(object.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
