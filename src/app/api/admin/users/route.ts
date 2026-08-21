import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

function isAdminSession(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || !isAdminSession(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { id: { contains: search } },
        ],
      }
    : {};

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
          },
        },
        orders: {
          select: { totalAmount: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Compute metrics
  const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
  const activePrescriptions = await prisma.savedPrescription.count();
  const newThisMonth = await prisma.user.count({
    where: {
      role: "CUSTOMER",
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  // Compute average CLV
  const clvResult = await prisma.order.aggregate({
    _avg: { totalAmount: true },
    where: { userId: { not: null } },
  });

  const enrichedUsers = users.map((u) => ({
    ...u,
    totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    orderCount: u._count.orders,
    prescriptionCount: u._count.prescriptions,
    orders: undefined,
    _count: undefined,
  }));

  return NextResponse.json({
    users: enrichedUsers,
    total,
    page,
    metrics: {
      totalCustomers,
      activePrescriptions,
      newThisMonth,
      avgCLV: Math.round(clvResult._avg.totalAmount || 0),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session || !isAdminSession(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await request.json();
  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }

  const validRoles = ["CUSTOMER", "OPTICIAN", "ADMIN", "SUPER_ADMIN"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updatedUser });
}
