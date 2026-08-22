import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdminRole } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  role: z.enum(["CUSTOMER", "OPTICIAN", "ADMIN", "SUPER_ADMIN"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  isVerified: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
        prescriptions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            isDefault: true,
            odSph: true,
            odCyl: true,
            odAxis: true,
            osSph: true,
            osCyl: true,
            osAxis: true,
            pd: true,
            addPower: true,
            prescriptionType: true,
            slipImageUrl: true,
            notes: true,
            createdAt: true,
          },
        },
        addresses: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            recipientName: true,
            phoneNumber: true,
            streetAddress: true,
            city: true,
            province: true,
            postalCode: true,
            isDefault: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                price: true,
                product: { select: { name: true, slug: true } },
              },
            },
          },
        },
        _count: {
          select: { orders: true, prescriptions: true, wishlist: true, addresses: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalSpent = user.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return NextResponse.json({
      user: {
        ...user,
        totalSpent,
        orderCount: user._count.orders,
        prescriptionCount: user._count.prescriptions,
        wishlistCount: user._count.wishlist,
        addressCount: user._count.addresses,
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_DETAIL_GET]", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);

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
    const dataToUpdate: Record<string, any> = {};

    // 1. Role modification security
    if (role && role !== targetUser.role) {
      // Promoting to SUPER_ADMIN requires current caller to be SUPER_ADMIN
      if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only Super Admins can grant the Super Admin role." },
          { status: 403 }
        );
      }

      // Demoting an existing SUPER_ADMIN requires current caller to be SUPER_ADMIN
      if (targetUser.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only Super Admins can modify Super Admin accounts." },
          { status: 403 }
        );
      }

      // Prevent demoting the only remaining SUPER_ADMIN
      if (targetUser.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
        const superAdminCount = await prisma.user.count({
          where: { role: "SUPER_ADMIN" },
        });
        if (superAdminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot demote the only remaining Super Admin account." },
            { status: 400 }
          );
        }
      }

      dataToUpdate.role = role;
    }

    // 2. Email update & conflict check
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: "A user with this email address already exists." },
            { status: 409 }
          );
        }
        dataToUpdate.email = normalizedEmail;
      }
    }

    // 3. Phone update & conflict check
    if (phone !== undefined) {
      const normalizedPhone = phone ? phone.trim() : null;
      if (normalizedPhone !== targetUser.phone) {
        if (normalizedPhone) {
          const phoneExists = await prisma.user.findFirst({
            where: {
              phone: normalizedPhone,
              NOT: { id: targetUser.id },
            },
          });
          if (phoneExists) {
            return NextResponse.json(
              { error: "This phone number is already assigned to another user." },
              { status: 409 }
            );
          }
        }
        dataToUpdate.phone = normalizedPhone;
      }
    }

    // 4. Name update
    if (name) {
      dataToUpdate.name = name.trim();
    }

    // 5. Verification status update
    if (isVerified !== undefined) {
      dataToUpdate.isVerified = isVerified;
    }

    // 6. Optional password update / reset
    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password.trim(), 12);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({
        success: true,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          phone: targetUser.phone,
          role: targetUser.role,
          isVerified: targetUser.isVerified,
          avatarUrl: targetUser.avatarUrl,
        },
        message: "No changes requested.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: dataToUpdate,
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
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt,
        orderCount: updatedUser._count.orders,
        prescriptionCount: updatedUser._count.prescriptions,
        addressCount: updatedUser._count.addresses,
        wishlistCount: updatedUser._count.wishlist,
      },
      message: "User account updated successfully.",
    });
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error);
    return NextResponse.json({ error: "Failed to update user account" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // 1. Prevent deleting the currently authenticated admin session
    if (session.userId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own logged-in admin account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Protect Super Admin accounts from deletion by non-super-admins
    if (targetUser.role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins have permission to delete Super Admin accounts." },
        { status: 403 }
      );
    }

    // 3. Prevent deleting the last remaining Super Admin
    if (targetUser.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN" },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the only remaining Super Admin account in the system." },
          { status: 400 }
        );
      }
    }

    // 4. Perform deletion (cascading relations like Cart, Prescriptions, Wishlist, Addresses; unlinking Orders via onDelete: SetNull)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `User account "${targetUser.name}" (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
