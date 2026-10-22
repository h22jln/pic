import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import { toFrame } from "@/lib/server";

export async function GET() {
  const rows = await getDb().select().from(frames).where(eq(frames.published, true)).orderBy(desc(frames.updatedAt));
  return NextResponse.json(rows.map(toFrame));
}
