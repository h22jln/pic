import "server-only";
import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Frame, isDecorations, isLayout } from "./frame";

const encoder = new TextEncoder();
const cookieName = "pose_admin";

function secrets() {
  const e = env as Cloudflare.Env & { ADMIN_PASSWORD?: string; SESSION_SECRET?: string };
  return { password: e.ADMIN_PASSWORD, session: e.SESSION_SECRET };
}

async function hmac(value: string) {
  const { session } = secrets();
  if (!session) throw new Error("SESSION_SECRET is missing");
  const key = await crypto.subtle.importKey("raw", encoder.encode(session), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(result), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function adminCookie() {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = String(expires);
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyAdmin() {
  const raw = (await cookies()).get(cookieName)?.value;
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || Number(payload) < Date.now() / 1000) return false;
  const expected = await hmac(payload);
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < signature.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function passwordMatches(input: string) {
  const password = secrets().password;
  if (!password || !input || input.length !== password.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) diff |= input.charCodeAt(i) ^ password.charCodeAt(i);
  return diff === 0;
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export function toFrame(row: typeof frames.$inferSelect): Frame {
  const poses = JSON.parse(row.poses);
  const layout = JSON.parse(row.layout);
  const decorations = JSON.parse(row.decorations);
  return {
    id: row.id, title: row.title, subtitle: row.subtitle, accent: row.accent, backgroundColor: row.backgroundColor,
    published: row.published, showHero: row.showHero,
    poses: Array.isArray(poses) && poses.length === 4 ? poses : [null, null, null, null],
    decoration: row.decoration, decorations: isDecorations(decorations) ? decorations.map((item) => ({ ...item, editableByUser: item.editableByUser === true })) : [], hero: row.hero,
    layout: isLayout(layout) ? layout : [], createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

export async function getFrame(id: string) {
  const [row] = await getDb().select().from(frames).where(eq(frames.id, id)).limit(1);
  return row ? toFrame(row) : null;
}

export { cookieName };
