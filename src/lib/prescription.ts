/**
 * Optical Prescription Diopter & Format Utilities
 * Standardizes clinical signage (+ / -) and formatting for SPH, CYL, ADD, AXIS, and PD.
 */

export function formatDiopter(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = parseFloat(String(val));
  if (isNaN(num)) return String(val);
  if (num === 0) return "0.00";
  const formatted = num.toFixed(2);
  return num > 0 ? `+${formatted}` : formatted; // negative numbers retain "-" automatically
}

export function formatAxis(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "" || String(val).trim() === "-") return "-";
  const str = String(val).trim().replace(/[^\d]/g, "");
  if (!str) return "-";
  return `${str}°`;
}

export function formatPupillaryDistance(val: string | number | null | undefined): string {
  if (!val) return "63 mm";
  const str = String(val).trim();
  return str.endsWith("mm") ? str : `${str} mm`;
}
