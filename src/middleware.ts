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

  // ── 2. Deprecate /profile — permanently redirect to / ─────────────────
  if (pathname.startsWith("/profile")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl, 308);
  }

  // ── 3. Read & verify JWT session ─────────────────────────────────────────
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // ── 4. Protect /admin/* — RBAC Route Guard ─────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = session.role;
    const isAllowedAdmin =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "STORE_ADMIN" ||
      role === "OPTICIAN";

    if (!isAllowedAdmin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(homeUrl, 303);
    }

    // Role-Based Access Restriction:
    // If not SUPER_ADMIN, allow ONLY /admin/orders and /admin/payments
    if (role !== "SUPER_ADMIN") {
      const isOrdersPath = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
      const isPaymentsPath = pathname === "/admin/payments" || pathname.startsWith("/admin/payments/");

      if (!isOrdersPath && !isPaymentsPath) {
        const ordersUrl = request.nextUrl.clone();
        ordersUrl.pathname = "/admin/orders";
        ordersUrl.search = "";
        return NextResponse.redirect(ordersUrl, 307);
      }
    }

    return NextResponse.next();
  }

  // ── 5. Redirect authenticated users away from /login & /signup ──────────
  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const targetUrl = request.nextUrl.clone();
      if (session.role === "SUPER_ADMIN") {
        targetUrl.pathname = "/admin";
      } else if (
        session.role === "ADMIN" ||
        session.role === "STORE_ADMIN" ||
        session.role === "OPTICIAN"
      ) {
        targetUrl.pathname = "/admin/orders";
      } else {
        const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";
        targetUrl.pathname = redirectTo === "/profile" ? "/" : redirectTo;
      }
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
