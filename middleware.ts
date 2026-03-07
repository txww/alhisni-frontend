import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/hisni-control-panel")) {
    const token = req.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SECRET || "Hisni@Admin2024!";

    if (token === secret) {
      return NextResponse.next();
    }

    const url = new URL("/hisni-login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hisni-control-panel/:path*"],
};