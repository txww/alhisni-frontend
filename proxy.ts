import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("jwt")?.value;

  if (pathname.startsWith("/hisni-control-panel") ||
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
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