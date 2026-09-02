import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookie } from "./jwt";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export interface GoogleProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

/**
 * Derives the canonical base URL from incoming request or environment
 */
export function getBaseUrl(requestOrHost?: string): string {
  if (requestOrHost) {
    if (requestOrHost.startsWith("http://") || requestOrHost.startsWith("https://")) {
      return requestOrHost;
    }
    const protocol = requestOrHost.includes("localhost") || requestOrHost.includes("127.0.0.1") ? "http" : "https";
    return `${protocol}://${requestOrHost}`;
  }
  return process.env.NEXTAUTH_URL || (process.env.NODE_ENV === "production" ? "https://myeyes.pk" : "http://localhost:3000");
}

/**
 * Builds Google OAuth 2.0 authorization URL
 */
export function getGoogleAuthUrl(options?: { callbackUrl?: string; origin?: string }): string {
  const origin = getBaseUrl(options?.origin);
  const redirectUri = `${origin}/api/auth/callback/google`;
  const stateData = {
    callbackUrl: options?.callbackUrl || "/",
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for Google access token
 */
export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("[GOOGLE_TOKEN_EXCHANGE_ERROR]", errorText);
    throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData as { access_token: string; id_token?: string; expires_in: number };
}

/**
 * Retrieves user profile from Google UserInfo endpoint
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleProfile> {
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    console.error("[GOOGLE_USERINFO_ERROR]", errorText);
    throw new Error(`Failed to fetch Google user info: ${userRes.status}`);
  }

  const profile = (await userRes.json()) as GoogleProfile;
  return profile;
}

/**
 * Finds or creates user record in Prisma database from Google profile
 */
export async function syncGoogleUser(profile: GoogleProfile) {
  const normalizedEmail = profile.email.toLowerCase().trim();
  const userName = profile.name?.trim() || normalizedEmail.split("@")[0];
  const avatar = profile.picture || null;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    // Update avatar and login timestamp if existing
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        avatarUrl: existingUser.avatarUrl || avatar,
        isVerified: true,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
      },
    });
    return updated;
  }

  // Create new customer account
  const randomPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name: userName,
      email: normalizedEmail,
      passwordHash,
      role: "CUSTOMER",
      avatarUrl: avatar,
      isVerified: true,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isVerified: true,
    },
  });

  return newUser;
}

/**
 * Generates JWT session and builds response redirect
 */
export async function createGoogleSessionResponse(
  user: { id: string; name: string; email: string; role: string },
  destinationUrl: string,
  origin: string
): Promise<NextResponse> {
  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // Ensure redirect URL is safe
  let targetPath = destinationUrl || "/";
  if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
    try {
      const parsed = new URL(targetPath);
      targetPath = parsed.pathname + parsed.search;
    } catch {
      targetPath = "/";
    }
  }
  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }

  // Auto redirect admin roles to /admin if logging into home
  if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && targetPath === "/") {
    targetPath = "/admin";
  }

  const finalUrl = new URL(targetPath, getBaseUrl(origin));
  const response = NextResponse.redirect(finalUrl);
  setSessionCookie(response, token);
  return response;
}
