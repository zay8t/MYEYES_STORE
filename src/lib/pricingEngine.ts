export interface BasePriceConfig {
  B1: number;
  B2: number;
  B3: number;
  B4: number;
  B5: number;
}

export const DEFAULT_BASE_PRICES: BasePriceConfig = {
  B1: 850,
  B2: 1850,
  B3: 1950,
  B4: 3250,
  B5: 1950,
};

export interface PricingResult {
  basePriceKey: string;
  basePriceValue: number;
  multiplier: number;
  finalPrice: number;
}

export interface TotalPricingResult {
  basePriceKey: string;
  basePriceValue: number;
  multiplier: number;
  finalPrice: number;
  isAsymmetricRx: boolean;
  rightEyeLensPrice?: number;
  leftEyeLensPrice?: number;
  rightMultiplier?: number;
  leftMultiplier?: number;
}

export function parsePower(val: string | number | null | undefined): number {
  const parsed = parseFloat(String(val || 0));
  return isNaN(parsed) ? 0 : parsed;
}

export async function getActiveBasePrices(): Promise<BasePriceConfig> {
  const prices = { ...DEFAULT_BASE_PRICES };
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.basePriceSetting.findMany();
    if (settings.length === 0) {
      const seedData = Object.entries(prices).map(([key, val]) => ({
        key,
        value: val,
      }));
      await prisma.basePriceSetting.createMany({
        data: seedData,
      });
      return prices;
    }
    for (const setting of settings) {
      if (setting.key in prices) {
        prices[setting.key as keyof typeof prices] = setting.value;
      }
    }
  } catch (error) {
    console.error("Failed to load active base prices from DB, using defaults:", error);
  }
  return prices;
}

/**
 * Calculates exact single lens costs based on absolute SPH and CYL prescription ranges.
 * Returns null if the combination is out-of-range for standard checkout.
 */
export function calculateSingleEyePrice(
  lensType: string,
  sph: string | number | null | undefined,
  cyl: string | number | null | undefined,
  basePrices: BasePriceConfig = DEFAULT_BASE_PRICES
): PricingResult | null {
  const parsedSph = parsePower(sph);
  const parsedCyl = parsePower(cyl);
  const absSph = Math.abs(parsedSph);
  const absCyl = Math.abs(parsedCyl);

  let baseKey = "";
  let baseValue = 0;
  let multiplier = 0;

  switch (lensType) {
    case "progressive-freeform":
      // A. LENS TYPE 1: Progressive Free Form 1.56 HMC (Base B1)
      baseKey = "B1";
      baseValue = basePrices.B1;
      if (absSph >= 0 && absSph <= 4.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.00;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 2.50;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 3.50;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.50;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 2.50;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 3.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 5.50;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 5.50;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 6.00;
      else if (absSph >= 12.50 && absSph <= 16.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 6.00;
      else if (absSph >= 12.50 && absSph <= 16.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 6.50;
      else return null;
      break;

    case "sv-156-bluecut":
      // B. LENS TYPE 2: SV 1.56 HMC UV420 Blue Cut (Base B2)
      baseKey = "B2";
      baseValue = basePrices.B2;
      if (absSph >= 0 && absSph <= 4.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.00;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 1.50;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.00;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.25;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.75;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 2.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.76;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 3.00;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 3.15;
      else return null;
      break;

    case "sv-156-photogrey":
      // C. LENS TYPE 3: SV 1.56 Photogrey SHMC (Base B3)
      baseKey = "B3";
      baseValue = basePrices.B3;
      if (absSph >= 0 && absSph <= 4.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.00;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 1.50;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.50;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.75;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 2.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.75;
      else return null;
      break;

    case "sv-156-photogrey-bluecut":
      // D. LENS TYPE 4: SV 1.56 Photogrey SHMC + Blue Cut (Base B4)
      baseKey = "B4";
      baseValue = basePrices.B4;
      if (absSph >= 0 && absSph <= 4.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.00;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 1.50;
      else if (absSph >= 0 && absSph <= 4.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.00;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.25;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 0 && absCyl <= 2.00) multiplier = 1.75;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 2.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.75;
      else return null;
      break;

    case "sv-167-shmc":
      // E. LENS TYPE 5: SV 1.67 Ultra Thin Index SHMC (Base B5)
      baseKey = "B5";
      baseValue = basePrices.B5;
      if (absSph >= 0.00 && absSph <= 4.00 && absCyl >= 0.00 && absCyl <= 2.00) multiplier = 1.00;
      else if (absSph >= 0.00 && absSph <= 4.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 1.75;
      else if (absSph >= 0.00 && absSph <= 4.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 2.50;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 0.00 && absCyl <= 2.00) multiplier = 1.75;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 0.00 && absCyl <= 2.00) multiplier = 2.25;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 2.75;
      else if (absSph >= 4.25 && absSph <= 8.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 3.25;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 3.50;
      else if (absSph >= 8.25 && absSph <= 12.00 && absCyl >= 4.25 && absCyl <= 6.00) multiplier = 3.75;
      else if (absSph >= 12.50 && absSph <= 16.00 && absCyl >= 0.00 && absCyl <= 2.00) multiplier = 4.50;
      else if (absSph >= 12.50 && absSph <= 16.00 && absCyl >= 2.25 && absCyl <= 4.00) multiplier = 6.00;
      else return null;
      break;

    default:
      return null;
  }

  const finalPrice = baseValue * multiplier;

  return {
    basePriceKey: baseKey,
    basePriceValue: baseValue,
    multiplier,
    finalPrice,
  };
}

/**
 * Calculates total lens price for both eyes, handling asymmetrical prescriptions
 * by splitting the pair price in half for each eye.
 */
export function calculateTotalLensPrice(
  lensType: string,
  rightEye: { sph: string | number | null | undefined; cyl: string | number | null | undefined },
  leftEye: { sph: string | number | null | undefined; cyl: string | number | null | undefined },
  basePrices: BasePriceConfig = DEFAULT_BASE_PRICES
): TotalPricingResult | null {
  const rightSph = parsePower(rightEye.sph);
  const rightCyl = parsePower(rightEye.cyl);
  const leftSph = parsePower(leftEye.sph);
  const leftCyl = parsePower(leftEye.cyl);

  const isSymmetric = rightSph === leftSph && rightCyl === leftCyl;

  if (isSymmetric) {
    const res = calculateSingleEyePrice(lensType, rightSph, rightCyl, basePrices);
    if (!res) return null;
    return {
      basePriceKey: res.basePriceKey,
      basePriceValue: res.basePriceValue,
      multiplier: res.multiplier,
      finalPrice: res.finalPrice,
      isAsymmetricRx: false,
    };
  }

  // Asymmetric: Calculate for each eye and split price
  const rightRes = calculateSingleEyePrice(lensType, rightSph, rightCyl, basePrices);
  const leftRes = calculateSingleEyePrice(lensType, leftSph, leftCyl, basePrices);

  if (!rightRes || !leftRes) return null;

  return {
    basePriceKey: rightRes.basePriceKey,
    basePriceValue: rightRes.basePriceValue,
    multiplier: Math.max(rightRes.multiplier, leftRes.multiplier),
    finalPrice: (rightRes.finalPrice / 2) + (leftRes.finalPrice / 2),
    isAsymmetricRx: true,
    rightEyeLensPrice: rightRes.finalPrice / 2,
    leftEyeLensPrice: leftRes.finalPrice / 2,
    rightMultiplier: rightRes.multiplier,
    leftMultiplier: leftRes.multiplier,
  };
}
