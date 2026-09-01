/**
 * MY EYES — Lens Thickness Simulator Engine
 * lib/optical/lensThicknessSimulator.ts
 *
 * Physics:
 *   Sagitta formula:  s = (r² × |D|) / (2000 × (n − 1))
 *   Multi-zone progressive: uses max(|SPH|, |SPH+CYL|, |SPH+ADD|) as governing power
 *
 * B1–B5 Refractive Index Registry:
 *   B1  MY EYES CR Hard Crystal Coat          → 1.56 (Standard Resin)
 *   B2  MY EYES Blue Light Filter + UV HMC    → 1.56 (Blue Guard Resin)
 *   B3  MY EYES Sun Adaptive Photochromic HMC → 1.56 (Photochromic Matrix)
 *   B4  MY EYES PHOTOCHROMIC + BLUE LIGHT     → 1.56 (Dual Shield Hybrid)
 *   B5  MY EYES Ultra Thin Index              → 1.67 (High Index Thin Resin)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LensIndexProfile {
  /** B-tier code: B1..B5 */
  tier: "B1" | "B2" | "B3" | "B4" | "B5";
  /** ISO refractive index */
  n: number;
  /** Human-readable material descriptor */
  material: string;
  /** Minimum center thickness for this index (mm) */
  minCT: number;
  /** Minimum edge thickness (mm) */
  minET: number;
}

export interface SingleVisionThickness {
  mode: "single_vision";
  /** Physical center thickness (mm) */
  center: number;
  /** Physical edge thickness (mm) */
  edge: number;
  /** Governing diopter used */
  diopter: number;
  /** Index profile applied */
  profile: LensIndexProfile;
}

export interface ProgressiveZoneThickness {
  mode: "progressive";
  /** Distance zone center thickness (mm) */
  distanceCenter: number;
  /** Distance zone edge thickness (mm) */
  distanceEdge: number;
  /** Reading zone effective center thickness (mm) */
  readingCenter: number;
  /** Peak governing power (D) */
  fMax: number;
  /** Effective reading power = SPH + ADD */
  readingPower: number;
  /** ADD power */
  add: number;
  /** Index profile applied */
  profile: LensIndexProfile;
}

export type LensThicknessResult = SingleVisionThickness | ProgressiveZoneThickness;

// ─── Index Registry ───────────────────────────────────────────────────────────

/** Maps package baseKey → refractive index profile */
export const INDEX_REGISTRY: Record<string, LensIndexProfile> = {
  B1: { tier: "B1", n: 1.56, material: "Standard Resin",        minCT: 2.0, minET: 1.5 },
  B2: { tier: "B2", n: 1.56, material: "Blue Guard Resin",      minCT: 2.0, minET: 1.5 },
  B3: { tier: "B3", n: 1.56, material: "Photochromic Matrix",   minCT: 2.0, minET: 1.5 },
  B4: { tier: "B4", n: 1.56, material: "Dual Shield Hybrid",    minCT: 2.0, minET: 1.5 },
  B5: { tier: "B5", n: 1.67, material: "High Index Thin Resin", minCT: 1.4, minET: 1.2 },
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Standard lens blank half-diameter: 52 mm eye size → r = 26 mm */
const BLANK_RADIUS_MM = 26;

/** Progressive blank margin: extra CT added for corridor blending */
const PROGRESSIVE_BLANK_MARGIN_MM = 0.5;

// ─── Core Sagitta Utility ─────────────────────────────────────────────────────

/**
 * Sagitta: s = (r² × |D|) / (2000 × (n − 1))
 * Returns mm, clamped to ≥ 0
 */
function sagitta(absDiopter: number, n: number, radiusMm: number = BLANK_RADIUS_MM): number {
  const deltaN = Math.max(0.01, n - 1);
  return (radiusMm * radiusMm * absDiopter) / (2000 * deltaN);
}

// ─── Single-Vision Calculator ─────────────────────────────────────────────────

/**
 * Calculates single-vision lens cross-section thickness.
 *
 * @param sph   Dominant SPH value (signed, diopters). Negative = myopia, positive = hyperopia.
 * @param profile  Refractive index profile for this package tier.
 */
export function calcSingleVisionThickness(
  sph: number,
  profile: LensIndexProfile
): SingleVisionThickness {
  const absSph = Math.abs(sph);
  const s = sagitta(absSph, profile.n);

  let center: number;
  let edge: number;

  if (sph <= 0) {
    // Myopia / Concave: minimum center, edge grows outward
    center = profile.minCT - 0.5; // thinner center for minus lenses (e.g., 1.5 for 1.56, 0.9 for 1.67)
    edge = Math.max(profile.minET, center + s);
  } else {
    // Hyperopia / Convex: minimum edge, center grows
    edge = profile.minET - 0.3; // 1.2 for 1.56, 0.9 for 1.67
    center = Math.max(profile.minCT, edge + s);
  }

  return {
    mode: "single_vision",
    center: parseFloat(center.toFixed(1)),
    edge: parseFloat(edge.toFixed(1)),
    diopter: sph,
    profile,
  };
}

// ─── Progressive Multi-Zone Calculator ───────────────────────────────────────

/**
 * Calculates progressive lens cross-section with multi-zone physics.
 *
 * Progressive geometry rules:
 *  - Effective reading power = SPH + ADD
 *  - Governing peak power (Fmax) = max(|SPH|, |SPH + CYL|, |SPH + ADD|)
 *  - For plus/presbyopia (SPH >= 0 or ADD > 0):
 *      CT = minCT + sag(Fmax) + PROGRESSIVE_BLANK_MARGIN
 *  - For minus (myopia with ADD):
 *      ET = minET + sag(|SPH_max|)
 *      CT = minCT
 *
 * @param sph      Dominant eye SPH (signed diopters)
 * @param cyl      Dominant eye CYL (signed diopters)
 * @param add      Reading addition (positive, diopters)
 * @param profile  Refractive index profile
 */
export function calcProgressiveThickness(
  sph: number,
  cyl: number,
  add: number,
  profile: LensIndexProfile
): ProgressiveZoneThickness {
  const absAdd = Math.abs(add);
  const readingPower = sph + absAdd;

  // Governing peak power: worst-case across all zones
  const fMax = Math.max(
    Math.abs(sph),
    Math.abs(sph + cyl),
    Math.abs(readingPower)
  );

  const s = sagitta(fMax, profile.n);
  const sDistance = sagitta(Math.abs(sph), profile.n);

  let distanceCenter: number;
  let distanceEdge: number;
  let readingCenter: number;

  const isPlusOrPresbyopia = sph >= 0 || add > 0;

  if (isPlusOrPresbyopia) {
    // Plus / presbyopia: center-thick lens
    distanceEdge = profile.minET - 0.3;
    distanceCenter = Math.max(profile.minCT, distanceEdge + sDistance + PROGRESSIVE_BLANK_MARGIN_MM);
    readingCenter = Math.max(profile.minCT, distanceEdge + s + PROGRESSIVE_BLANK_MARGIN_MM);
  } else {
    // Minus with ADD: edge-thick lens, reading zone mitigates thickness slightly
    distanceCenter = profile.minCT - 0.5;
    distanceEdge = Math.max(profile.minET, distanceCenter + sDistance + PROGRESSIVE_BLANK_MARGIN_MM);
    // Reading zone is thicker at center due to add power
    readingCenter = Math.max(profile.minCT, distanceCenter + sagitta(Math.abs(readingPower), profile.n));
  }

  return {
    mode: "progressive",
    distanceCenter: parseFloat(distanceCenter.toFixed(1)),
    distanceEdge: parseFloat(distanceEdge.toFixed(1)),
    readingCenter: parseFloat(readingCenter.toFixed(1)),
    fMax: parseFloat(fMax.toFixed(2)),
    readingPower: parseFloat(readingPower.toFixed(2)),
    add: parseFloat(absAdd.toFixed(2)),
    profile,
  };
}

// ─── Unified Entry Point ──────────────────────────────────────────────────────

export interface SimulatorInput {
  odSph: number;
  osSph: number;
  odCyl?: number;
  osCyl?: number;
  add?: number;
  visionType: "single_vision" | "progressive";
  /** B-tier key: "B1" | "B2" | "B3" | "B4" | "B5" */
  tier: string;
}

export function runLensSimulator(input: SimulatorInput): LensThicknessResult {
  const {
    odSph,
    osSph,
    odCyl = 0,
    osCyl = 0,
    add = 0,
    visionType,
    tier,
  } = input;

  const profile = INDEX_REGISTRY[tier] ?? INDEX_REGISTRY["B2"];

  // Dominant eye = stronger prescription
  const dominantSph = Math.abs(odSph) >= Math.abs(osSph) ? odSph : osSph;
  const dominantCyl = Math.abs(odSph) >= Math.abs(osSph) ? odCyl : osCyl;

  if (visionType === "progressive") {
    return calcProgressiveThickness(dominantSph, dominantCyl, add, profile);
  }

  return calcSingleVisionThickness(dominantSph, profile);
}

// ─── Legacy Compat Shim ───────────────────────────────────────────────────────
// Keeps existing import from prescription-pricing.ts working without modification

export function calculateLensThickness(
  sph: number,
  index: number
): { center: number; edge: number } {
  const profile = Object.values(INDEX_REGISTRY).find((p) => p.n === index) ?? INDEX_REGISTRY["B2"];
  const result = calcSingleVisionThickness(sph, profile);
  return { center: result.center, edge: result.edge };
}
