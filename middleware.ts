import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/hisni-control-panel")) {
    const token = req.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SECRET;

    if (token && token === secret) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/hisni-login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hisni-control-panel/:path*"],
};