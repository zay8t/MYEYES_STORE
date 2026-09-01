import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import type { CreateDiscountPayload, UpdateDiscountPayload } from "@/types/discounts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── GET — list all discount codes ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error("[discounts:GET]", error);
    return NextResponse.json({ error: "Failed to fetch discount codes." }, { status: 500 });
  }
}

// ─── POST — create a discount code ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const body: CreateDiscountPayload = await request.json();
    const {
      code,
      title,
      type,
      amount,
      minCartTotal = 0,
      maxDiscountLimit = null,
      usageLimitTotal = null,
      startsAt,
      endsAt = null,
      isActive = true,
      showAnnouncementBanner = false,
      bannerText = "",
      bannerTheme = "dark",
      showProductBadge = true,
      badgeLabel = "",
      badgeType = "percentage",
    } = body;

    if (!code || !title || !type || amount == null || !startsAt) {
      return NextResponse.json({ error: "code, title, type, amount, and startsAt are required." }, { status: 400 });
    }
    if (!["percentage", "fixed_cart"].includes(type)) {
      return NextResponse.json({ error: "type must be 'percentage' or 'fixed_cart'." }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");

    const existing = await prisma.discountCode.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      return NextResponse.json({ error: `Code "${normalizedCode}" already exists.` }, { status: 409 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        code: normalizedCode,
        title,
        type,
        amount,
        minCartTotal,
        maxDiscountLimit,
        usageLimitTotal,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive,
        showAnnouncementBanner,
        bannerText,
        bannerTheme,
        showProductBadge,
        badgeLabel,
        badgeType,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("[discounts:POST]", error);
    return NextResponse.json({ error: "Failed to create discount code." }, { status: 500 });
  }
}

// ─── PATCH — update a discount code ────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query param required." }, { status: 400 });
    }

    const body: UpdateDiscountPayload = await request.json();

    // Normalize code if being updated
    if (body.code) {
      body.code = body.code.trim().toUpperCase().replace(/\s+/g, "");
    }

    const discount = await prisma.discountCode.update({
      where: { id },
      data: {
        ...body,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : body.endsAt === null ? null : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error("[discounts:PATCH]", error);
    return NextResponse.json({ error: "Failed to update discount code." }, { status: 500 });
  }
}

// ─── DELETE — remove a discount code ───────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query param required." }, { status: 400 });
    }

    await prisma.discountCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[discounts:DELETE]", error);
    return NextResponse.json({ error: "Failed to delete discount code." }, { status: 500 });
  }
}
