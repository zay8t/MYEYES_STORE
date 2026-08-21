import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLEX_LENS_OPTIONS, CORE_FIVE_LENS_IDS } from "@/lib/solex-lens-pricing";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORE_SET = new Set<string>(CORE_FIVE_LENS_IDS);

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const count = await prisma.lensOption.count();
    if (count === 0) {
      // Seed initial lens options list from static constant
      await prisma.lensOption.createMany({
        data: SOLEX_LENS_OPTIONS.map((lens) => ({
          id: lens.id,
          name: lens.name,
          price: lens.basePrice,
          pricePlus40: lens.pricePlus40 ?? (lens.basePrice + 400),
          type: lens.category,
          index: lens.index,
          description: lens.description,
          isConfiguratorVisible: CORE_SET.has(lens.id),
        })),
      });
    }

    const lensOptions = await prisma.lensOption.findMany({
      orderBy: { type: "asc" },
    });

    // Map Prisma fields back to the SolexLensOption shape expected by the frontend
    const mapped = lensOptions.map((lens) => {
      const staticMatch = SOLEX_LENS_OPTIONS.find((s) => s.id === lens.id);
      return {
        id: lens.id,
        name: lens.name || staticMatch?.name || "",
        basePrice: lens.price,
        pricePlus40: lens.pricePlus40 && lens.pricePlus40 > 0 ? lens.pricePlus40 : lens.price + 400,
        category: lens.type ?? staticMatch?.category ?? "single_vision",
        index: lens.index ?? staticMatch?.index ?? "1.56",
        description: lens.description ?? staticMatch?.description ?? "",
        coating: staticMatch?.coating ?? "Standard",
        isConfiguratorVisible: CORE_SET.has(lens.id),
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch lens options:", error);
    return NextResponse.json(
      { error: "Failed to fetch lens options" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, basePrice, pricePlus40 } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const updateData: { price?: number; pricePlus40?: number } = {};
    if (basePrice !== undefined && basePrice !== null) {
      updateData.price = parseFloat(basePrice);
    }
    if (pricePlus40 !== undefined && pricePlus40 !== null) {
      updateData.pricePlus40 = parseFloat(pricePlus40);
    }

    const updated = await prisma.lensOption.update({
      where: { id },
      data: updateData,
    });

    // Synchronize to BasePriceSetting table for B1-B5 key mapping
    const baseCodes: Record<string, string> = {
      "progressive-freeform": "B1",
      "sv-156-bluecut": "B2",
      "sv-156-photogrey": "B3",
      "sv-156-photogrey-bluecut": "B4",
      "sv-167-shmc": "B5",
    };

    const baseKey = baseCodes[id];
    if (baseKey && basePrice !== undefined && basePrice !== null) {
      await prisma.basePriceSetting.upsert({
        where: { key: baseKey },
        update: { value: parseFloat(basePrice) },
        create: { key: baseKey, value: parseFloat(basePrice) },
      });
    }

    // Invalidate cached prices site-wide
    const { revalidatePath } = await import("next/cache");
    try {
      revalidatePath("/lens-pricing");
      revalidatePath("/pricing");
      revalidatePath("/admin/lens-pricing");
      revalidatePath("/admin/base-prices");
      revalidatePath("/api/admin/base-prices");
      revalidatePath("/api/base-prices");
    } catch (err) {
      console.warn("revalidatePath warning:", err);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update lens option price:", error);
    return NextResponse.json(
      { error: "Failed to update lens option price" },
      { status: 500 }
    );
  }
}
