import { NextRequest, NextResponse } from "next/server";
import { adminCookie, cookieName, passwordMatches, sameOrigin } from "@/lib/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!passwordMatches(body.password ?? "")) return NextResponse.json({ error: "비밀번호를 확인해 주세요." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, await adminCookie(), { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
