import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminRole } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  role: z.enum(["CUSTOMER", "OPTICIAN", "ADMIN", "SUPER_ADMIN"]).default("CUSTOMER"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isVerified: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const roleFilter = searchParams.get("role")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  // Build Prisma where clause
  const whereConditions: Record<string, any>[] = [];

  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { id: { contains: search } },
      ],
    });
  }

  if (roleFilter && roleFilter !== "ALL") {
    if (roleFilter === "ADMINS") {
      whereConditions.push({
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      });
    } else if (["CUSTOMER", "OPTICIAN", "ADMIN", "SUPER_ADMIN"].includes(roleFilter)) {
      whereConditions.push({
        role: roleFilter,
      });
    }
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              orders: true,
              prescriptions: true,
              addresses: true,
              wishlist: true,
            },
          },
          orders: {
            select: { totalAmount: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Compute aggregate metrics
    const [totalUsers, totalCustomers, totalAdmins, totalOpticians, activePrescriptions, newThisMonth, clvResult] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
        prisma.user.count({ where: { role: "OPTICIAN" } }),
        prisma.savedPrescription.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.order.aggregate({
          _avg: { totalAmount: true },
          where: { userId: { not: null } },
        }),
      ]);

    const enrichedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      avatarUrl: u.avatarUrl,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      totalSpent: u.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      orderCount: u._count.orders,
      prescriptionCount: u._count.prescriptions,
      addressCount: u._count.addresses,
      wishlistCount: u._count.wishlist,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      metrics: {
        totalUsers,
        totalCustomers,
        totalAdmins,
        totalOpticians,
        activePrescriptions,
        newThisMonth,
        avgCLV: Math.round(clvResult._avg.totalAmount || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, role, password, isVerified } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Prevent non-super admins from creating SUPER_ADMIN users
    if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can create new Super Admin accounts" },
        { status: 403 }
      );
    }

    // Check for duplicate email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    // Check for duplicate phone if provided
    if (phone) {
      const existingByPhone = await prisma.user.findFirst({
        where: { phone },
      });
      if (existingByPhone) {
        return NextResponse.json(
          { error: "This phone number is already registered to another user." },
          { status: 409 }
        );
      }
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone || null,
        passwordHash,
        role,
        isVerified,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          ...newUser,
          totalSpent: 0,
          orderCount: 0,
          prescriptionCount: 0,
          addressCount: 0,
          wishlistCount: 0,
        },
        message: "User account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ADMIN_USERS_POST]", error);
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }
}
