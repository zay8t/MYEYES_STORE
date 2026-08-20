import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // If traffic lands on a *.vercel.app domain in production, 301-redirect to canonical domain
  if (
    process.env.NODE_ENV === "production" &&
    host.includes(".vercel.app") &&
    !host.includes("localhost")
  ) {
    const url = request.nextUrl.clone();
    url.host = "myeyes.pk";
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons / manifest.json / sw.js
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
