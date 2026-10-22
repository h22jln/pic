import { NextRequest, NextResponse } from "next/server";
import { cookieName, sameOrigin } from "@/lib/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}
