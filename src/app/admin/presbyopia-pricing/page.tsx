import { Metadata } from "next";
import PresbyopiaPricesClient from "./PresbyopiaPricesClient";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";

export const metadata: Metadata = {
  title: "Presbyopia (+40) Pricing Matrix | My Eyes Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PresbyopiaPricingPage() {
  const prices = {
    P1: DEFAULT_BASE_PRICES.P1,
    P2: DEFAULT_BASE_PRICES.P2,
    P3: DEFAULT_BASE_PRICES.P3,
    P4: DEFAULT_BASE_PRICES.P4,
    P1_tier2: DEFAULT_BASE_PRICES.P1_tier2,
    P2_tier2: DEFAULT_BASE_PRICES.P2_tier2,
    P3_tier2: DEFAULT_BASE_PRICES.P3_tier2,
    P4_tier2: DEFAULT_BASE_PRICES.P4_tier2,
  };

  try {
    const settings = await prisma.basePriceSetting.findMany();
    for (const setting of settings) {
      if (setting.key in prices) {
        prices[setting.key as keyof typeof prices] = setting.value;
      }
    }
  } catch (error) {
    console.error("Failed to load presbyopia prices in page:", error);
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Presbyopia (+40) Pricing Matrix
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Manage dynamic base rates for progressive lenses. These settings apply to customers aged 40 or older with standard near addition (ADD) prescriptions.
        </p>
      </div>

      <PresbyopiaPricesClient initialPrices={prices} />
    </div>
  );
}
