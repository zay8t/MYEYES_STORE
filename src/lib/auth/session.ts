import { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME, SessionPayload } from "./jwt";
import prisma from "@/lib/prisma";

/**
 * Extract and verify the session from a request's cookies
 */
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

/**
 * Get the full User record for the current session
 */
export async function getCurrentUser(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        savedFaceShape: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            cartItems: true,
            wishlist: true,
            prescriptions: true,
            orders: true,
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
}
