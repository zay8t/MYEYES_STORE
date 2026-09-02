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

// Re-export the upgraded optical physics engine
export {
  calculateLensThickness,
  runLensSimulator,
  INDEX_REGISTRY,
  calcSingleVisionThickness,
  calcProgressiveThickness,
} from "./optical/lensThicknessSimulator";
export type {
  LensIndexProfile,
  SingleVisionThickness,
  ProgressiveZoneThickness,
  LensThicknessResult,
  SimulatorInput,
} from "./optical/lensThicknessSimulator";

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
    name: "Clear Everyday Lenses",
    baseKey: "B1",
    standardBasePrice: 850,
    presbyopiaBasePrice: 1250,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Anti-Scratch Clear",
    description: "Easy on the eyes, clear everyday vision with scratch-resistant coating.",
    idealRange: "Mild & Standard",
    abbeValue: "High Clarity",
    reductionTag: "Standard Profile",
    coating: "Anti-Scratch Coat",
  },
  {
    id: "sv-156-bluecut",
    name: "Screen Protection (Blue Light)",
    baseKey: "B2",
    standardBasePrice: 1850,
    presbyopiaBasePrice: 2250,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Blue Light Guard",
    description: "Stops eye strain from phones, laptops, and TVs. Prevents tired eyes.",
    idealRange: "Daily Screen Use",
    abbeValue: "Blue Light Block",
    reductionTag: "Screen Shield",
    coating: "Blue Light Shield",
  },
  {
    id: "sv-156-photogrey",
    name: "Auto-Darkening (Transitions)",
    baseKey: "B3",
    standardBasePrice: 1950,
    presbyopiaBasePrice: 2350,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Sun-Adaptive",
    description: "Clear inside your room, turns into sunglasses automatically in the sun.",
    idealRange: "Indoor & Outdoor",
    abbeValue: "Adaptive Tint",
    reductionTag: "2-in-1 Tint",
    coating: "Auto-Darkening Coat",
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "All-in-One (Screen Guard + Sun)",
    baseKey: "B4",
    standardBasePrice: 3250,
    presbyopiaBasePrice: 3650,
    index: "1.56",
    indexNumber: 1.56,
    badge: "Screen + Sun Hybrid",
    description: "Blocks harsh screen glare while you work and darkens automatically outside.",
    idealRange: "Complete Protection",
    abbeValue: "Dual Shield",
    reductionTag: "Max Shield",
    coating: "Blue + Auto-Darkening",
  },
  {
    id: "sv-167-shmc",
    name: "Ultra Thin Slim Lenses",
    baseKey: "B5",
    standardBasePrice: 1950,
    presbyopiaBasePrice: 2350,
    index: "1.67",
    indexNumber: 1.67,
    badge: "Slim Profile",
    description: "Extra lightweight and slim profile designed for higher power prescriptions.",
    idealRange: "High Powers",
    abbeValue: "Slim Profile",
    reductionTag: "35% Thinner",
    coating: "Hydrophobic Smooth Coat",
  },
];




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
