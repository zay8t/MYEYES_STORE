/**
 * Laboratory Optical Vector Engine
 * ISO/IEC 7810 ID-1 datum reference geometry
 * Card width: 85.60 mm  |  Sub-millimeter glazing tolerance: <= 0.25 mm
 */

// ─── Physical Constants ────────────────────────────────────────────────────────

/** ISO/IEC 7810 ID-1 credit card physical width in mm */
export const CARD_WIDTH_MM = 85.60;

/** Maximum acceptable PD measurement error in mm */
export const MAX_TOLERANCE_MM = 0.25;

/** Typical adult human PD range (mm) */
export const PD_MIN_MM = 52;
export const PD_MAX_MM = 74;

/** Monocular PD range per eye (mm) */
export const MONO_PD_MIN_MM = 25;
export const MONO_PD_MAX_MM = 38;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RawLandmarks {
  /** Pixel X of left pupil centre */
  leftPupilX: number;
  /** Pixel X of right pupil centre */
  rightPupilX: number;
  /** Pixel X of left card edge (card starts here) */
  cardLeftX: number;
  /** Pixel X of right card edge */
  cardRightX: number;
}

export interface PDResult {
  /** Binocular pupillary distance in mm */
  binocularPD: number;
  /** Right monocular PD in mm */
  rightPD: number;
  /** Left monocular PD in mm */
  leftPD: number;
  /** Pixels per mm derived from card reference */
  pixelsPerMm: number;
  /** Whether result is within acceptable tolerance */
  withinTolerance: boolean;
  /** Computed measurement confidence 0–1 */
  confidence: number;
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

/**
 * Computes pupillary distance from raw pixel landmarks using the
 * ISO/IEC 7810 ID-1 card as the sub-pixel calibration datum.
 *
 * @param landmarks – Raw pixel coordinates detected on the captured frame
 * @returns PDResult with binocular/monocular measurements
 */
export function calculatePDFromLandmarks(landmarks: RawLandmarks): PDResult {
  const { leftPupilX, rightPupilX, cardLeftX, cardRightX } = landmarks;

  // Guard: card width must be positive and non-degenerate
  const cardWidthPx = Math.abs(cardRightX - cardLeftX);
  if (cardWidthPx < 10) {
    throw new Error("Card reference geometry too small — ensure the card is fully visible.");
  }

  // Guard: pupils must be separated
  const pupilSpanPx = Math.abs(rightPupilX - leftPupilX);
  if (pupilSpanPx < 5) {
    throw new Error("Pupils appear too close together — please ensure face is centred.");
  }

  // Derive scale factor
  const pixelsPerMm = cardWidthPx / CARD_WIDTH_MM;

  // Binocular PD
  const binocularPD = round2(pupilSpanPx / pixelsPerMm);

  // Midpoint of the face in pixel space (nose bridge estimate)
  const faceMidX = (leftPupilX + rightPupilX) / 2;

  // Monocular distances from nose bridge
  const rightPD = round2(Math.abs(faceMidX - rightPupilX) / pixelsPerMm);
  const leftPD  = round2(Math.abs(leftPupilX - faceMidX) / pixelsPerMm);

  // Validate ranges
  const withinTolerance =
    binocularPD >= PD_MIN_MM &&
    binocularPD <= PD_MAX_MM &&
    rightPD >= MONO_PD_MIN_MM &&
    rightPD <= MONO_PD_MAX_MM &&
    leftPD  >= MONO_PD_MIN_MM &&
    leftPD  <= MONO_PD_MAX_MM;

  // Confidence: based on asymmetry (closer to symmetric = higher confidence)
  const asymmetry = Math.abs(rightPD - leftPD);
  const confidence = Math.max(0, Math.min(1, 1 - asymmetry / 6));

  return { binocularPD, rightPD, leftPD, pixelsPerMm, withinTolerance, confidence };
}

/**
 * Validates a manually entered PD value.
 * Returns null if valid, or an error string.
 */
export function validateManualPD(value: number | string): string | null {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "Please enter a numeric value.";
  if (n < PD_MIN_MM || n > PD_MAX_MM) {
    return `PD must be between ${PD_MIN_MM} mm and ${PD_MAX_MM} mm.`;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
