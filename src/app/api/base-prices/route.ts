import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.basePriceSetting.findMany();
    const prices = { ...DEFAULT_BASE_PRICES };
    
    for (const setting of settings) {
      if (setting.key in prices) {
        prices[setting.key as keyof typeof prices] = setting.value;
      }
    }
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Failed to fetch base prices", error);
    // If DB fails, return defaults
    return NextResponse.json(DEFAULT_BASE_PRICES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { B1, B2, B3, B4, B5 } = body;
    
    const updates = [
      { key: "B1", value: parseFloat(B1) },
      { key: "B2", value: parseFloat(B2) },
      { key: "B3", value: parseFloat(B3) },
      { key: "B4", value: parseFloat(B4) },
      { key: "B5", value: parseFloat(B5) },
    ].filter(item => !isNaN(item.value));

    for (const update of updates) {
      await prisma.basePriceSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update base prices", error);
    return NextResponse.json({ error: "Failed to update base prices" }, { status: 500 });
  }
}
