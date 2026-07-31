import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveBasePrices, DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";
import { revalidatePath } from "next/cache";
import { SOLEX_LENS_OPTIONS } from "@/lib/solex-lens-pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prices = await getActiveBasePrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error("GET base prices error:", error);
    return NextResponse.json(DEFAULT_BASE_PRICES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { B1, B2, B3, B4, B5 } = body;

    const updates = [
      { key: "B1", value: parseFloat(B1), id: "progressive-freeform" },
      { key: "B2", value: parseFloat(B2), id: "sv-156-bluecut" },
      { key: "B3", value: parseFloat(B3), id: "sv-156-photogrey" },
      { key: "B4", value: parseFloat(B4), id: "sv-156-photogrey-bluecut" },
      { key: "B5", value: parseFloat(B5), id: "sv-167-shmc" },
    ].filter(item => !isNaN(item.value));

    for (const update of updates) {
      // Upsert to BasePriceSetting
      await prisma.basePriceSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });

      // Upsert to LensOption to keep completely synchronized
      const staticMatch = SOLEX_LENS_OPTIONS.find(l => l.id === update.id);
      await prisma.lensOption.upsert({
        where: { id: update.id },
        update: {
          price: update.value,
          pricePlus40: update.value + 400
        },
        create: {
          id: update.id,
          name: staticMatch?.name || "",
          description: staticMatch?.description || "",
          price: update.value,
          pricePlus40: update.value + 400,
          type: staticMatch?.category || "single_vision",
          index: staticMatch?.index || "1.56",
          isConfiguratorVisible: true,
        }
      });
    }

    // Invalidate caches site-wide immediately on price modifications
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST base prices error:", error);
    return NextResponse.json({ error: "Failed to update base prices" }, { status: 500 });
  }
}
