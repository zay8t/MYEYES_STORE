import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/jwt";

const RegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(
      /^(?:\+92|0092|0)?3[0-9]{9}$|^\+[1-9]\d{6,14}$/,
      "Please enter a valid Pakistani or international phone number"
    )
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone?.trim() || undefined;

    // Check for existing email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Check for existing phone (if provided)
    if (normalizedPhone) {
      const existingByPhone = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
      if (existingByPhone) {
        return NextResponse.json(
          { error: "This phone number is already associated with another account." },
          { status: 409 }
        );
      }
    }

    // Hash password with cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone || null,
        passwordHash,
        role: "CUSTOMER",
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Create JWT session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        user,
        message: "Account created successfully! Welcome to MY EYES.",
      },
      { status: 201 }
    );

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[AUTH_REGISTER]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
