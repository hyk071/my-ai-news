// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const user = process.env.NEXT_ADMIN_USER;
  const pass = process.env.NEXT_ADMIN_PASS;
  if (!user || !pass) return NextResponse.next(); // 미설정시 우회(개발 편의)

  const auth = req.headers.get("authorization") || "";
  const [scheme, encoded] = auth.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm=admin" },
    });
  }
  const [u, p] = Buffer.from(encoded, "base64").toString().split(":");
  if (u === user && p === pass) return NextResponse.next();

  return new NextResponse("Forbidden", { status: 403 });
}
