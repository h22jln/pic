import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { galleryPhotos } from "@/db/schema";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const [photo] = await getDb().select({ imageKey: galleryPhotos.imageKey }).from(galleryPhotos).where(eq(galleryPhotos.id, id)).limit(1);
  if (!photo) return new NextResponse(null, { status: 404 });
  const object = await env.BUCKET?.get(photo.imageKey);
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(object.body, { headers: {
    "Content-Type": "image/png",
    "Content-Disposition": `inline; filename="one-studio-${id}.png"`,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  } });
}
