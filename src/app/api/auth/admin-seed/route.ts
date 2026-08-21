import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/jwt";

/**
 * One-time admin seeder endpoint.
 * Creates a SUPER_ADMIN user if none exists yet.
 * DELETE or disable this route after first use in production.
 */
export async function POST(request: NextRequest) {
  try {
    // Safety: only allow if no admin exists yet
    const existingAdmin = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin account already exists. This endpoint is disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, seedKey } = body;

    // Simple protection via env seed key
    if (seedKey !== process.env.JWT_SECRET?.slice(0, 16)) {
      return NextResponse.json({ error: "Invalid seed key." }, { status: 401 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "SUPER_ADMIN",
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = await createSession({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    const response = NextResponse.json({
      success: true,
      admin,
      message: "SUPER_ADMIN account created. Remove this endpoint now.",
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[ADMIN_SEED]", error);
    return NextResponse.json({ error: "Seed failed." }, { status: 500 });
  }
}
