import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/jwt";

const LoginSchema = z.object({
  identifier: z.string().min(1, "WhatsApp number or identifier is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Please provide your WhatsApp number and password." },
        { status: 400 }
      );
    }

    const { identifier, password } = validation.data;
    const rawIdentifier = identifier.trim();
    const isEmail = rawIdentifier.includes("@");
    const normalizedIdentifier = rawIdentifier.toLowerCase();

    // Prepare phone search variants if not an email
    const digitsOnly = rawIdentifier.replace(/\D/g, "");
    const phoneVariants: string[] = [rawIdentifier];
    if (digitsOnly.length >= 9) {
      const localPhone = digitsOnly.startsWith("92")
        ? "0" + digitsOnly.slice(2)
        : digitsOnly.startsWith("0")
        ? digitsOnly
        : "0" + digitsOnly;
      const intlPhone = digitsOnly.startsWith("92")
        ? "+" + digitsOnly
        : "+92" + (digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly);
      const raw92 = digitsOnly.startsWith("92")
        ? digitsOnly
        : "92" + (digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly);
      const rawWithoutCountry = digitsOnly.startsWith("92")
        ? digitsOnly.slice(2)
        : digitsOnly.startsWith("0")
        ? digitsOnly.slice(1)
        : digitsOnly;

      phoneVariants.push(digitsOnly, localPhone, intlPhone, raw92, rawWithoutCountry);
    }

    // Find user by email or phone variants
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          ...phoneVariants.map((p) => ({ phone: p })),
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: isEmail
            ? "No account found with this email address. Please check your credentials."
            : "No account found with this WhatsApp number. Please check your number or password.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue JWT session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
    };

    const response = NextResponse.json(
      {
        success: true,
        user: safeUser,
        message: `Welcome back, ${user.name.split(" ")[0]}!`,
      },
      { status: 200 }
    );

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[AUTH_LOGIN]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
