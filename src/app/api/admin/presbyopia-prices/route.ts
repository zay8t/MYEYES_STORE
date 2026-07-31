import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveBasePrices, DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prices = await getActiveBasePrices();
    return NextResponse.json({
      P1: prices.P1,
      P2: prices.P2,
      P3: prices.P3,
      P4: prices.P4,
      P1_tier2: prices.P1_tier2,
      P2_tier2: prices.P2_tier2,
      P3_tier2: prices.P3_tier2,
      P4_tier2: prices.P4_tier2,
    });
  } catch (error) {
    console.error("GET presbyopia prices error:", error);
    return NextResponse.json({
      P1: DEFAULT_BASE_PRICES.P1,
      P2: DEFAULT_BASE_PRICES.P2,
      P3: DEFAULT_BASE_PRICES.P3,
      P4: DEFAULT_BASE_PRICES.P4,
      P1_tier2: DEFAULT_BASE_PRICES.P1_tier2,
      P2_tier2: DEFAULT_BASE_PRICES.P2_tier2,
      P3_tier2: DEFAULT_BASE_PRICES.P3_tier2,
      P4_tier2: DEFAULT_BASE_PRICES.P4_tier2,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keys = ["P1", "P2", "P3", "P4", "P1_tier2", "P2_tier2", "P3_tier2", "P4_tier2"];

    for (const key of keys) {
      if (body[key] !== undefined) {
        const val = parseFloat(body[key]);
        if (!isNaN(val)) {
          await prisma.basePriceSetting.upsert({
            where: { key },
            update: { value: val },
            create: { key, value: val },
          });
        }
      }
    }

    try {
      revalidatePath("/admin/presbyopia-pricing");
      revalidatePath("/lens-pricing");
      revalidatePath("/pricing");
      revalidatePath("/api/admin/presbyopia-prices");
    } catch (err) {
      console.warn("revalidatePath warning:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST presbyopia prices error:", error);
    return NextResponse.json({ error: "Failed to update presbyopia prices" }, { status: 500 });
  }
}
