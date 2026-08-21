import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ── 1. Canonical domain redirect (Vercel → myeyes.pk) ───────────────────
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

  // ── 2. Read & verify JWT session ─────────────────────────────────────────
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // ── 3. Protect /profile/* — require authenticated customer ───────────────
  if (pathname.startsWith("/profile")) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 4. Protect /admin/* — require ADMIN or SUPER_ADMIN role ─────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(homeUrl, 303);
    }
    return NextResponse.next();
  }

  // ── 5. Redirect authenticated users away from /login & /signup ──────────
  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const redirectTo = request.nextUrl.searchParams.get("redirect") || "/profile";
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = redirectTo;
      targetUrl.search = "";
      return NextResponse.redirect(targetUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static & _next/image
     * - favicon, icons, manifest, service worker
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
