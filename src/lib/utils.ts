import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(price: number): string {
  if (isNaN(price)) return "Rs. 0/-";
  return `Rs. ${Math.round(price).toLocaleString()}/-`;
}

export function formatFrameShape(shape?: string | null): string {
  if (!shape || shape.toUpperCase() === "NILL") return "Classic";
  const map: Record<string, string> = {
    WAYFARER: "Wayfarer",
    AVIATOR: "Aviator",
    RECTANGLE: "Rectangle",
    ROUND: "Round",
    OVAL: "Oval",
    SQUARE: "Square",
    CAT_EYE: "Cat-Eye",
    GEOMETRIC: "Geometric",
    RIMLESS: "Rimless",
    SEMI_RIMLESS: "Semi-Rimless",
  };
  return map[shape.toUpperCase()] || shape.replace("_", " ");
}

export function formatMaterial(material?: string | null): string {
  if (!material || material.toUpperCase() === "NILL") return "Standard Alloy";
  const map: Record<string, string> = {
    ACETATE: "Acetate",
    METAL: "Metal",
    TITANIUM: "Titanium",
    TR90: "TR90 Polymer",
    STAINLESS_STEEL: "Stainless Steel",
    WOOD: "Wood Finish",
    HYBRID: "Hybrid",
  };
  return map[material.toUpperCase()] || material.replace("_", " ");
}
