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
    name: "Standard Clear",
    baseKey: "B1",
    index: "1.56",
    indexNumber: 1.56,
    badge: "Scratch Defense",
    description: "Simple, high-clarity lenses with everyday scratch protection.",
    idealRange: "0.00 to ±2.00",
    abbeValue: "High Clarity",
    reductionTag: "Standard Profile",
    coating: "Diamond Hard Crystal",
  },
  {
    id: "sv-156-bluecut",
    name: "Screen Protection",
    baseKey: "B2",
    index: "1.56",
    indexNumber: 1.56,
    badge: "Blue Light Filter",
    description: "Filters harsh light from phones, tablets, and laptops to reduce eye strain.",
    idealRange: "0.00 to ±3.00",
    abbeValue: "HEV Filter",
    reductionTag: "Screen Shield",
    coating: "Univex Blue Cut UV420",
  },
  {
    id: "sv-156-photogrey",
    name: "Color Changing (Sun Adaptive)",
    baseKey: "B3",
    index: "1.56",
    indexNumber: 1.56,
    badge: "Sun Adaptive",
    description: "Clear indoors and automatically turns dark when you step out into the sun.",
    idealRange: "0.00 to ±3.00",
    abbeValue: "Fast Transition",
    reductionTag: "2-in-1 Tint",
    coating: "Photochromic SHMC",
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "All-Day Blue Light & Sun Guard",
    baseKey: "B4",
    index: "1.56",
    indexNumber: 1.56,
    badge: "2-in-1 Protection",
    description: "Our best all-in-one lens: protects against screens indoors and turns dark in sunlight.",
    idealRange: "0.00 to ±3.50",
    abbeValue: "Dual Filter",
    reductionTag: "Max Shield",
    coating: "Super Flat Blue + Photo",
  },
  {
    id: "sv-167-shmc",
    name: "Extra Thin & Lightweight",
    baseKey: "B5",
    index: "1.67",
    indexNumber: 1.67,
    badge: "Extra Thin",
    description: "Thinned down so stronger eye numbers stay light and do not look thick.",
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
  basePrices = DEFAULT_BASE_PRICES,
}: {
  packageId: string;
  sph?: number | string;
  cyl?: number | string;
  basePrices?: BasePriceConfig;
}): PricingResult | null {
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
