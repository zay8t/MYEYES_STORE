import { Metadata } from "next";
import BasePricesClient from "./BasePricesClient";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_PRICES } from "@/lib/pricingEngine";

export const metadata: Metadata = {
  title: "Base Price Matrix | My Eyes Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BasePricesPage() {
  const prices = { ...DEFAULT_BASE_PRICES };
  
  try {
    const settings = await prisma.basePriceSetting.findMany();
    for (const setting of settings) {
      if (setting.key in prices) {
        prices[setting.key as keyof typeof prices] = setting.value;
      }
    }
  } catch (error) {
    console.error("Failed to load base prices in page:", error);
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Base Price Matrix ($B)</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Manage the dynamic pricing engine base parameters. These values are used to calculate exact prescription lens costs based on the absolute SPH/CYL magnitude.
        </p>
      </div>

      <BasePricesClient initialPrices={prices} />
    </div>
  );
}
