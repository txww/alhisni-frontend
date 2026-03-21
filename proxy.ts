import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("jwt")?.value;

  // حماية لوحة الإدارة
  if (pathname.startsWith("/hisni-control-panel")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // حماية بوابة المدرسين
  if (pathname.startsWith("/teacher")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // حماية داشبورد الطالب
  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/hisni-control-panel/:path*",
    "/teacher/:path*",
    "/dashboard/:path*",
  ],
};