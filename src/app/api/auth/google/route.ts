import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, getBaseUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const origin = getBaseUrl(host);

  const authUrl = getGoogleAuthUrl({ callbackUrl, origin });
  return NextResponse.redirect(authUrl);
}
