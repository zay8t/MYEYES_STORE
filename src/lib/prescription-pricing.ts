import {
  calculateSingleEyePrice,
  calculateTotalLensPrice,
  calculateProgressivePrice,
  calculateTotalProgressivePrice,
  DEFAULT_BASE_PRICES,
  BasePriceConfig,
  PricingResult,
  TotalPricingResult,
} from "./pricingEngine";

export interface LensPackageDefinition {
  id: string;
  name: string;
  baseKey: "B1" | "B2" | "B3" | "B4" | "B5";
  standardBasePrice: number;
  presbyopiaBasePrice: number;
  index: "1.56" | "1.67";
  indexNumber: number;
  badge: string;
  description: string;
  idealRange: string;
  abbeValue: string;
  reductionTag: string;
  coating: string;
}

export const LENS_PACKAGES: LensPackageDefinition[] = [
  {
    id: "progressive-freeform",
    name: "MY EYES CR Hard Crystal Coat",
    baseKey: "B1",
    standardBasePrice: 850,
    presbyopiaBasePrice: 1250,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Daily Scratch Defense",
    description: "Single-vision clarity with standard hard crystal coating for daily scratch resistance.",
    idealRange: "0.00 to ±2.00",
    abbeValue: "High Clarity",
    reductionTag: "Standard Profile",
    coating: "Diamond Hard Crystal",
  },
  {
    id: "sv-156-bluecut",
    name: "MY EYES Blue Light Filter + UV Protection HMC",
    baseKey: "B2",
    standardBasePrice: 1850,
    presbyopiaBasePrice: 2250,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Digital Screen Shield",
    description: "Blocks harmful digital screen blue light and 100% UV rays with HMC anti-reflective coating.",
    idealRange: "0.00 to ±3.00",
    abbeValue: "HEV Filter",
    reductionTag: "Screen Shield",
    coating: "Univex Blue Cut UV420",
  },
  {
    id: "sv-156-photogrey",
    name: "MY EYES Sun Adaptive Photochromic HMC",
    baseKey: "B3",
    standardBasePrice: 1950,
    presbyopiaBasePrice: 2350,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Sun Adaptive",
    description: "Transitions smoothly to dark grey in sunlight. Complete UV protection.",
    idealRange: "0.00 to ±3.00",
    abbeValue: "Fast Transition",
    reductionTag: "2-in-1 Tint",
    coating: "Photochromic SHMC",
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "MY EYES PHOTOCHROMIC + BLUE LIGHT FILTER",
    baseKey: "B4",
    standardBasePrice: 3250,
    presbyopiaBasePrice: 3650,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Hybrid Protection",
    description: "Ultimate hybrid: filters digital blue light indoors and transitions to sunglasses outdoors.",
    idealRange: "0.00 to ±3.50",
    abbeValue: "Dual Filter",
    reductionTag: "Max Shield",
    coating: "Super Flat Blue + Photo",
  },
  {
    id: "sv-167-shmc",
    name: "MY EYES Ultra Thin Index",
    baseKey: "B5",
    standardBasePrice: 1950,
    presbyopiaBasePrice: 2350,
    index: "1.67",
    indexNumber: 1.67,
    badge: "Ultra Thin Profile",
    description: "High-index ultra-thin profile for stronger prescriptions. Reduces lens thickness significantly.",
    idealRange: "±3.50 to ±8.00+",
    abbeValue: "Slim Profile",
    reductionTag: "35% Thinner",
    coating: "Super Hydrophobic HMC",
  },
];

/**
 * Pure non-recursive mathematical sagitta calculation:
 * s = (r^2 * |D|) / (2000 * (index - 1))
 */
export function calculateLensThickness(
  sph: number,
  index: number
): { center: number; edge: number } {
  const absSph = Math.abs(sph);
  const radius = 26; // standard lens blank half-diameter (52mm eye size)
  const deltaN = Math.max(0.3, index - 1);
  const sag = (radius * radius * absSph) / (2000 * deltaN);

  if (sph <= 0) {
    // Myopia (Concave): fixed center, edge grows
    const center = 1.5;
    const edge = Number((center + sag).toFixed(1));
    return { center, edge };
  } else {
    // Hyperopia (Convex): fixed edge, center grows
    const edge = 1.2;
    const center = Number((edge + sag).toFixed(1));
    return { center, edge };
  }
}

/**
 * Evaluates exact lens pair price from central pricing engine for given package and prescription.
 */
export function calculateLensPrice({
  packageId,
  sph = 0,
  cyl = 0,
  add = 0,
  visionType = "single_vision",
  basePrices = DEFAULT_BASE_PRICES,
}: {
  packageId: string;
  sph?: number | string;
  cyl?: number | string;
  add?: number | string;
  visionType?: "single_vision" | "progressive";
  basePrices?: BasePriceConfig;
}): PricingResult | null {
  if (visionType === "progressive") {
    return calculateProgressivePrice(packageId, sph, cyl, add, basePrices);
  }
  return calculateSingleEyePrice(packageId, sph, cyl, basePrices);
}

export {
  calculateSingleEyePrice,
  calculateTotalLensPrice,
  calculateProgressivePrice,
  calculateTotalProgressivePrice,
  DEFAULT_BASE_PRICES,
};
export type { BasePriceConfig, PricingResult, TotalPricingResult };
