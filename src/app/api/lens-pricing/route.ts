import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLEX_LENS_OPTIONS, CORE_FIVE_LENS_IDS } from "@/lib/solex-lens-pricing";
import { LENS_PACKAGES } from "@/lib/prescription-pricing";
import { DEFAULT_BASE_PRICES, BasePriceConfig } from "@/lib/pricingEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORE_SET = new Set<string>(CORE_FIVE_LENS_IDS);

export async function GET() {
  try {
    // Ensure initial lens options exist in database
    const count = await prisma.lensOption.count();
    if (count === 0) {
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

    const [dbLensOptions, dbSettings] = await Promise.all([
      prisma.lensOption.findMany(),
      prisma.basePriceSetting.findMany(),
    ]);

    const basePrices: BasePriceConfig = { ...DEFAULT_BASE_PRICES };
    for (const setting of dbSettings) {
      if (setting.key in basePrices) {
        basePrices[setting.key as keyof BasePriceConfig] = setting.value;
      }
    }

    // Build the 5 core packages array with live database pricing
    const packages = LENS_PACKAGES.map((pkg) => {
      const match = dbLensOptions.find((l) => l.id === pkg.id);
      const staticSolex = SOLEX_LENS_OPTIONS.find((l) => l.id === pkg.id);

      // Determine standard base price: DB lensOption.price -> DB basePriceSetting[code] -> static fallback
      let standardBasePrice = pkg.standardBasePrice;
      if (match && typeof match.price === "number" && !isNaN(match.price)) {
        standardBasePrice = match.price;
      } else if (typeof basePrices[pkg.baseKey as keyof BasePriceConfig] === "number") {
        standardBasePrice = (basePrices[pkg.baseKey as keyof BasePriceConfig] as number) ?? pkg.standardBasePrice;
      }

      // Determine presbyopia base price: DB lensOption.pricePlus40 -> static fallback / standard + 400
      let presbyopiaBasePrice = pkg.presbyopiaBasePrice;
      if (match && typeof match.pricePlus40 === "number" && match.pricePlus40 > 0) {
        presbyopiaBasePrice = match.pricePlus40;
      } else {
        presbyopiaBasePrice = standardBasePrice + 400;
      }

      // Synchronize back into basePrices object
      basePrices[pkg.baseKey as keyof BasePriceConfig] = standardBasePrice;
      const plus40Key = `${pkg.baseKey}_plus40` as keyof BasePriceConfig;
      basePrices[plus40Key] = presbyopiaBasePrice;

      // Sync P1-P4 legacy keys for progressive engine
      if (pkg.baseKey === "B1") basePrices.P1 = presbyopiaBasePrice;
      if (pkg.baseKey === "B2") basePrices.P2 = presbyopiaBasePrice;
      if (pkg.baseKey === "B3") basePrices.P3 = presbyopiaBasePrice;
      if (pkg.baseKey === "B4") basePrices.P4 = presbyopiaBasePrice;

      return {
        id: pkg.id,
        code: pkg.baseKey,
        name: pkg.name,
        cleanName: staticSolex?.name || match?.name || pkg.name,
        standardBasePrice,
        presbyopiaBasePrice,
        index: pkg.index,
        indexNumber: pkg.indexNumber,
        badge: pkg.badge,
        description: pkg.description,
        idealRange: pkg.idealRange,
        abbeValue: pkg.abbeValue,
        reductionTag: pkg.reductionTag,
        coating: pkg.coating,
      };
    });

    const response = NextResponse.json({
      packages,
      basePrices,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (error) {
    console.error("GET /api/lens-pricing error:", error);
    return NextResponse.json(
      {
        packages: LENS_PACKAGES.map((pkg) => ({
          id: pkg.id,
          code: pkg.baseKey,
          name: pkg.name,
          cleanName: pkg.name,
          standardBasePrice: pkg.standardBasePrice,
          presbyopiaBasePrice: pkg.presbyopiaBasePrice,
          index: pkg.index,
          indexNumber: pkg.indexNumber,
          badge: pkg.badge,
          description: pkg.description,
          idealRange: pkg.idealRange,
          abbeValue: pkg.abbeValue,
          reductionTag: pkg.reductionTag,
          coating: pkg.coating,
        })),
        basePrices: DEFAULT_BASE_PRICES,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
