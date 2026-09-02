import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  syncGoogleUser,
  createGoogleSessionResponse,
  getBaseUrl,
} from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const origin = getBaseUrl(host);
  const redirectUri = `${origin}/api/auth/callback/google`;

  // Decode callback URL from state if available
  let callbackUrl = "/";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      if (decoded && typeof decoded.callbackUrl === "string") {
        callbackUrl = decoded.callbackUrl;
      }
    } catch {
      callbackUrl = "/";
    }
  }

  if (error || !code) {
    console.warn("[GOOGLE_AUTH_CALLBACK_CANCELLED]", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error || "access_denied")}`, origin));
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenData = await exchangeGoogleCode(code, redirectUri);

    // 2. Fetch user profile from Google UserInfo endpoint
    const profile = await getGoogleUserInfo(tokenData.access_token);

    if (!profile.email) {
      throw new Error("No verified email received from Google");
    }

    // 3. Upsert user in database with role and verified status
    const user = await syncGoogleUser(profile);

    // 4. Issue session JWT and redirect user
    return await createGoogleSessionResponse(user, callbackUrl, origin);
  } catch (err) {
    console.error("[GOOGLE_AUTH_CALLBACK_ERROR]", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Failed to sign in with Google. Please try again.")}`, origin)
    );
  }
}
