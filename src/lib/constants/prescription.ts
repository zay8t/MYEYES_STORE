/**
 * Exact Optical Prescription Range Constants
 * Defined with 0.25 D step intervals for high-precision optical dispensing.
 */

// Sphere (SPH): -0.25 to +16.00 in 0.25 steps including 0.00
export const SPH_OPTIONS: string[] = [
  "-0.25",
  "0.00",
  ...Array.from({ length: 64 }, (_, i) => {
    const val = (i + 1) * 0.25;
    return `+${val.toFixed(2)}`;
  }),
];

// Cylinder (CYL): -0.25 to +4.00 in 0.25 steps including 0.00
export const CYL_OPTIONS: string[] = [
  "-0.25",
  "0.00",
  ...Array.from({ length: 16 }, (_, i) => {
    const val = (i + 1) * 0.25;
    return `+${val.toFixed(2)}`;
  }),
];

// Axis: Integer values from 1 to 180
export const AXIS_OPTIONS: string[] = Array.from(
  { length: 180 },
  (_, i) => String(i + 1)
);

// ADD (Reading Addition): +0.75 to +3.50 in 0.25 steps (Progressive / Multi-Focal)
export const ADD_OPTIONS: string[] = Array.from(
  { length: 12 },
  (_, i) => {
    const val = 0.75 + i * 0.25;
    return `+${val.toFixed(2)}`;
  }
);

export const DEFAULT_SPH = "0.00";
export const DEFAULT_CYL = "0.00";
export const DEFAULT_AXIS = "180";
export const DEFAULT_ADD = "+1.50";
