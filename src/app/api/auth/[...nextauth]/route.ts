import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserInfo,
  syncGoogleUser,
  createGoogleSessionResponse,
  getBaseUrl,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "@/lib/auth/google";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Universal NextAuth API Route Handler
 * Compatible with NextAuth standard endpoints:
 * - /api/auth/signin/google
 * - /api/auth/callback/google
 * - /api/auth/session
 * - /api/auth/providers
 * - /api/auth/csrf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const action = nextauth?.join("/") || "";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const origin = getBaseUrl(host);
  const { searchParams } = new URL(request.url);

  // 1. Providers endpoint
  if (action === "providers") {
    return NextResponse.json({
      google: {
        id: "google",
        name: "Google",
        type: "oauth",
        signinUrl: `${origin}/api/auth/signin/google`,
        callbackUrl: `${origin}/api/auth/callback/google`,
      },
    });
  }

  // 2. CSRF Token endpoint
  if (action === "csrf") {
    return NextResponse.json({ csrfToken: "myeyes_csrf_token" });
  }

  // 3. Session endpoint
  if (action === "session") {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(null);
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
      },
    });
    return NextResponse.json({
      user: user || {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // 4. Sign in initiation: /api/auth/signin/google
  if (action === "signin/google" || action === "signin") {
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const authUrl = getGoogleAuthUrl({ callbackUrl, origin });
    return NextResponse.redirect(authUrl);
  }

  // 5. Callback endpoint: /api/auth/callback/google
  if (action === "callback/google") {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const redirectUri = `${origin}/api/auth/callback/google`;

    let callbackUrl = "/";
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        if (decoded?.callbackUrl) callbackUrl = decoded.callbackUrl;
      } catch {}
    }

    if (error || !code) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error || "access_denied")}`, origin));
    }

    try {
      const tokenData = await exchangeGoogleCode(code, redirectUri);
      const profile = await getGoogleUserInfo(tokenData.access_token);
      const user = await syncGoogleUser(profile);
      return await createGoogleSessionResponse(user, callbackUrl, origin);
    } catch (err) {
      console.error("[NEXTAUTH_CALLBACK_ERROR]", err);
      return NextResponse.redirect(new URL(`/login?error=oauth_error`, origin));
    }
  }

  return NextResponse.json({ error: "Invalid auth action" }, { status: 400 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  const action = nextauth?.join("/") || "";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const origin = getBaseUrl(host);
  const { searchParams } = new URL(request.url);

  if (action === "signin/google") {
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const authUrl = getGoogleAuthUrl({ callbackUrl, origin });
    return NextResponse.json({ url: authUrl });
  }

  return NextResponse.json({ error: "Unsupported auth POST action" }, { status: 400 });
}
