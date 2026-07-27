export interface SolexLensOption {
  id: string;
  name: string;
  coating: string;
  index: string;
  description: string;
  category: "single_vision" | "bifocal" | "progressive";
  basePrice: number;
  pricePlus40?: number;
}

export const SOLEX_LENS_OPTIONS: SolexLensOption[] = [
  {
    id: "sv-156-hc",
    name: "MY EYES 1.56 Diamond Hard Coat",
    coating: "Univex Green / Scratch Resistant",
    index: "1.56",
    description: "Standard scratch-resistant clear lenses for everyday wear",
    category: "single_vision",
    basePrice: 300,
    pricePlus40: 700,
  },
  {
    id: "sv-156-hmc",
    name: "MY EYES 1.56 HMC Anti-Reflective",
    coating: "Univex Green Anti-Reflective",
    index: "1.56",
    description: "Anti-reflective coating reduces glare & reflections",
    category: "single_vision",
    basePrice: 480,
    pricePlus40: 880,
  },
  {
    id: "sv-156-bluecut",
    name: "MY EYES 1.56 HMC UV420 Blue Cut",
    coating: "Univex Blue Cut UV420",
    index: "1.56",
    description: "Digital protection blocking harmful screen blue light",
    category: "single_vision",
    basePrice: 550,
    pricePlus40: 950,
  },
  {
    id: "sv-156-photogrey",
    name: "MY EYES 1.56 Photo Grey SHMC",
    coating: "Univex Light Intelligent Photochromic",
    index: "1.56",
    description: "Darkens outdoors in sunlight and clears indoors",
    category: "single_vision",
    basePrice: 800,
    pricePlus40: 1200,
  },
  {
    id: "sv-156-photogrey-bluecut",
    name: "MY EYES 1.56 Photo Grey SHMC + Blue Cut (Ice Vision)",
    coating: "Super Flat Blue Coating + Photochromic",
    index: "1.56",
    description: "Ultimate dual protection: Photochromic + Screen Blue Light filter",
    category: "single_vision",
    basePrice: 1600,
    pricePlus40: 2000,
  },
  {
    id: "sv-159-pc",
    name: "MY EYES 1.59 Polycarbonate SHMC",
    coating: "Graphene Material Impact Resistant",
    index: "1.59",
    description: "Impact-resistant shatterproof lenses for rimless & sports frames",
    category: "single_vision",
    basePrice: 700,
    pricePlus40: 1100,
  },
  {
    id: "sv-159-pc-bluecut",
    name: "MY EYES 1.59 Polycarbonate SHMC + Blue Cut",
    coating: "Univex Blue Coating + Polycarbonate",
    index: "1.59",
    description: "Shatterproof polycarbonate with digital blue cut protection",
    category: "single_vision",
    basePrice: 1200,
    pricePlus40: 1600,
  },
  {
    id: "sv-167-shmc",
    name: "MY EYES 1.67 Ultra Thin High Index SHMC",
    coating: "Super Hydrophobic HMC",
    index: "1.67",
    description: "Ultra thin & lightweight design for strong prescriptions",
    category: "single_vision",
    basePrice: 1200,
    pricePlus40: 1600,
  },
  {
    id: "progressive-freeform",
    name: "MY EYES Progressive Free Form 1.56 HMC",
    coating: "Univex Free Form HMC",
    index: "1.56",
    description: "No-line seamless transition between distance, mid & reading",
    category: "progressive",
    basePrice: 650,
    pricePlus40: 1050,
  },
];

/**
 * Calculates the exact MY EYES Precision prescription lens price based on:
 * - Lens Type ID
 * - OD/OS Sphere (SPH)
 * - OD/OS Cylinder (CYL)
 * - Near Addition (ADD for progressives) or +40 Presbyopia Tier
 * - Custom Base Price (Standard vs +40)
 */
export function calculateSolexLensPrice(
  lensTypeId: string,
  sph: number = 0,
  cyl: number = 0,
  add: number = 0,
  customBasePrice?: number,
  isPresbyopiaTier: boolean = false,
  customPricePlus40?: number
): number {
  const match = SOLEX_LENS_OPTIONS.find((l) => l.id === lensTypeId);
  const isPresbyopia = isPresbyopiaTier || add > 0;

  const targetBase = isPresbyopia
    ? (customPricePlus40 && customPricePlus40 > 0 ? customPricePlus40 : (customBasePrice !== undefined ? customBasePrice + 400 : (match?.pricePlus40 || (match?.basePrice ? match.basePrice + 400 : 0))))
    : (customBasePrice !== undefined ? customBasePrice : (match?.basePrice || 0));

  const originalBase = isPresbyopia
    ? (match?.pricePlus40 || (match?.basePrice ? match.basePrice + 400 : 0))
    : (match?.basePrice || 0);

  const priceDiff = targetBase - originalBase;
  let rawPrice = getRawSolexLensPrice(lensTypeId, sph, cyl, add);

  if (isPresbyopia && !lensTypeId.includes("progressive")) {
    rawPrice += 400; // Presbyopia +40 addition standard step
  }

  return Math.max(0, rawPrice + priceDiff);
}

function getRawSolexLensPrice(
  lensTypeId: string,
  sph: number = 0,
  cyl: number = 0,
  add: number = 0
): number {
  const absSph = Math.abs(sph);
  const absCyl = Math.abs(cyl);
  const isMinusSph = sph <= 0;
  const isPlusSph = sph > 0;

  switch (lensTypeId) {
    // 1. S.V 1.56 DIAMOND HARD COAT
    case "sv-156-hc": {
      if (cyl === 0) {
        if (sph >= 0 && sph <= 4.0) return 300;
        if (sph > 4.0 && sph <= 6.0) return 450;
        if (sph > 6.0 && sph <= 8.0) return 750;
        if (sph > 8.0 && sph <= 10.0) return 850;
        if (sph > 10.0 && sph <= 12.0) return 1000;
      }
      if (isPlusSph || sph === 0) {
        if (sph <= 3.0 && absCyl <= 2.0) return 350;
        if (sph > 3.0 && sph <= 4.0 && absCyl <= 2.0) return 450;
        if (sph > 4.0 && sph <= 6.0 && absCyl <= 2.0) return 750;
        if (absCyl > 2.0 && absCyl <= 3.0 && sph <= 4.0) return 650;
      }
      if (isMinusSph) {
        if (absCyl <= 2.0) {
          if (absSph <= 6.0) return 300;
          if (absSph <= 8.0) return 400;
          if (absSph <= 10.0) return 600;
          if (absSph <= 12.0) return 1000;
        } else if (absCyl <= 4.0) {
          if (absSph <= 6.0) return 600;
          if (absSph <= 8.0) return 800;
          if (absSph <= 12.0) return 1000;
        }
      }
      return 350;
    }

    // 2. S.V 1.56 HMC ANTI-REFLECTIVE
    case "sv-156-hmc": {
      if (isPlusSph || sph === 0) {
        if (sph <= 4.0 && absCyl <= 2.0) return 480;
        if (sph > 4.0 && sph <= 6.0 && absCyl <= 2.0) return 650;
        if (sph > 4.0 && sph <= 6.0 && absCyl > 2.0 && absCyl <= 3.0) return 850;
        if (sph > 6.0 && sph <= 8.0 && absCyl <= 2.0) return 900;
        if (sph > 8.0 && sph <= 10.0) return 1000;
        if (sph <= 3.0 && absCyl > 2.0 && absCyl <= 3.0) return 750;
      }
      if (isMinusSph) {
        if (absCyl <= 2.0) {
          if (absSph <= 4.0) return 450;
          if (absSph <= 6.0) return 500;
          if (absSph <= 8.0) return 600;
          if (absSph <= 10.0) return 850;
          if (absSph <= 12.0) return 1200;
        } else if (absCyl <= 4.0) {
          if (absSph <= 6.0) return 750;
          if (absSph <= 8.0) return 1000;
          if (absSph <= 15.0) return 1200;
        }
      }
      return 480;
    }

    // 3. S.V 1.56 HMC UV420 BLUE CUT
    case "sv-156-bluecut": {
      if (isPlusSph || sph === 0) {
        if (sph <= 2.0 && absCyl <= 1.0) return 600;
        if (sph > 2.0 && sph <= 4.0 && absCyl <= 1.0) return 650;
        if (sph > 2.0 && sph <= 3.0 && absCyl <= 2.0) return 650;
        if (sph <= 3.0 && absCyl > 2.0 && absCyl <= 4.0) return 900;
      }
      if (isMinusSph) {
        if (absCyl <= 2.0) {
          if (absSph <= 4.0) return 550;
          if (absSph <= 6.0) return 600;
          if (absSph <= 8.0) return 700;
          if (absSph <= 10.0) return 850;
          if (absSph <= 12.0) return 1100;
        } else if (absCyl <= 4.0) {
          if (absSph <= 6.0) return 900;
          if (absSph <= 8.0) return 1000;
          if (absSph <= 10.0) return 1400;
        }
      }
      return 600;
    }

    // 4. S.V 1.56 PHOTO GREY SHMC
    case "sv-156-photogrey": {
      if (isMinusSph || sph === 0) {
        if (absSph <= 6.0 && absCyl <= 2.0) return 800;
        if (absSph <= 4.0 && absCyl > 2.0 && absCyl <= 4.0) return 1250;
      }
      if (isPlusSph) {
        if (sph <= 4.0 && absCyl <= 1.0) return 850;
        if (sph <= 3.0 && absCyl <= 2.0) return 950;
      }
      return 850;
    }

    // 5. S.V 1.56 PHOTO GREY SHMC + BLUE CUT (ICE VISION)
    case "sv-156-photogrey-bluecut": {
      if (isMinusSph || sph === 0) {
        if (absSph <= 6.0 && absCyl <= 2.0) return 1600;
      }
      if (isPlusSph) {
        if (sph <= 4.0 && absCyl <= 1.0) return 1700;
        if (sph <= 3.0 && absCyl <= 2.0) return 1800;
      }
      return 1800;
    }

    // 6. S.V 1.59 PC SHMC POLYCARBONATE
    case "sv-159-pc": {
      if (isMinusSph || sph === 0) {
        if (absSph <= 6.0 && absCyl <= 2.0) return 700;
        if (absSph <= 4.0 && absCyl > 2.0 && absCyl <= 4.0) return 1200;
      }
      if (isPlusSph) {
        if (sph <= 4.0 && absCyl <= 1.0) return 850;
        if (sph <= 3.0 && absCyl <= 2.0) return 850;
      }
      return 700;
    }

    // 7. S.V 1.59 PC SHMC BLUE CUT
    case "sv-159-pc-bluecut": {
      if (isMinusSph || sph === 0) {
        if (absSph <= 6.0 && absCyl <= 2.0) return 1200;
        if (absSph <= 4.0 && absCyl > 2.0 && absCyl <= 4.0) return 1350;
      }
      if (isPlusSph) {
        if (sph <= 4.0 && absCyl <= 1.0) return 1350;
        if (sph <= 3.0 && absCyl <= 2.0) return 1450;
      }
      return 1200;
    }

    // 8. S.V 1.67 SHMC HIGH INDEX
    case "sv-167-shmc": {
      if (absSph >= 3.25 && absSph <= 10.0 && absCyl <= 2.0) return 1200;
      if (absSph > 10.0 && absSph <= 12.0 && absCyl <= 2.0) return 1600;
      if (absSph >= 3.25 && absSph <= 10.0 && absCyl > 2.0 && absCyl <= 4.0) return 2500;
      if (absSph > 10.0 && absSph <= 12.0 && absCyl > 2.0 && absCyl <= 4.0) return 5000;
      if (absSph > 12.0 && absSph <= 15.0 && absCyl <= 2.0) return 5500;
      if (absSph > 12.0 && absSph <= 15.0 && absCyl > 2.0 && absCyl <= 4.0) return 6500;
      return 1200;
    }

    // 9. ROUND TOP BIFOCAL 1.56
    case "bifocal-round-top": {
      if (add >= 1.0 && add <= 2.5) return 450; // HMC default
      return 450;
    }

    // 10. FLAT TOP BIFOCAL 1.56
    case "bifocal-flat-top": {
      if (add >= 1.0 && add <= 2.5) return 600; // HMC default
      return 600;
    }

    // 11. PROGRESSIVE FREE FORM 1.56
    case "progressive-freeform": {
      if (add >= 1.0 && add <= 2.5) return 650; // HMC default
      return 650;
    }

    default:
      return 0;
  }
}
