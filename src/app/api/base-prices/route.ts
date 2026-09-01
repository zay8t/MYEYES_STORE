import { NextResponse } from "next/server";
import { getActiveBasePrices, DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";
import { POST as adminPOST } from "../admin/base-prices/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prices = await getActiveBasePrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error("GET public base prices error:", error);
    return NextResponse.json(DEFAULT_BASE_PRICES);
  }
}

export { adminPOST as POST };
