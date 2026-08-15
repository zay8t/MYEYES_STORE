import { SafeProduct } from "@/lib/data-guards";
import { CatalogFilterState } from "@/lib/hooks/useCatalogFilters";
import { COLOR_PALETTES } from "@/lib/quizData";

export interface FacetOption {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
  colorHex?: string;
  svgShape?: string;
  count: number;
  disabled: boolean;
}

export interface FacetGroup {
  id: keyof Omit<CatalogFilterState, "minPrice" | "maxPrice" | "sort" | "search">;
  title: string;
  stepHint: string;
  options: FacetOption[];
}

// ─────────────────────────────────────────────────────────────
//  SHAPE WIREFRAME SVGS (ViewBox 0 0 120 60)
// ─────────────────────────────────────────────────────────────
export const SHAPE_SVG_PATHS: Record<string, string> = {
  rectangle: `
    <rect x="6" y="14" width="46" height="32" rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="68" y="14" width="46" height="32" rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="1" y1="20" x2="6" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="114" y1="20" x2="119" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  square: `
    <rect x="8" y="10" width="44" height="38" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="68" y="10" width="44" height="38" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="29" x2="68" y2="29" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="18" x2="118" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  round: `
    <ellipse cx="30" cy="30" rx="22" ry="22" fill="none" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="90" cy="30" rx="22" ry="22" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="18" x2="118" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  aviator: `
    <path d="M8,14 Q10,8 30,8 Q44,8 52,30 Q44,52 30,50 Q10,50 8,14 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M68,14 Q70,8 90,8 Q104,8 112,30 Q104,52 90,50 Q70,50 68,14 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="26" x2="68" y2="26" stroke="currentColor" stroke-width="2.5"/>
    <line x1="1" y1="14" x2="8" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="14" x2="119" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  cat_eye: `
    <path d="M8,38 Q12,10 30,10 Q48,10 52,28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M8,38 Q10,44 20,44 Q38,44 52,28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M68,28 Q72,10 90,10 Q108,10 112,38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M68,28 Q72,44 82,44 Q100,44 112,38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="52" y1="34" x2="68" y2="34" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="20" x2="118" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  geometric: `
    <polygon points="10,48 30,8 50,48" fill="none" stroke="currentColor" stroke-width="3"/>
    <polygon points="70,48 90,8 110,48" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="50" y1="28" x2="70" y2="28" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="110" y1="20" x2="118" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  rimless: `
    <ellipse cx="30" cy="30" rx="20" ry="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,3"/>
    <ellipse cx="90" cy="30" rx="20" ry="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,3"/>
    <line x1="50" y1="30" x2="70" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="22" x2="10" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="110" y1="22" x2="118" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
};

// ─────────────────────────────────────────────────────────────
//  15 COLOR SWATCH DEFINITIONS
// ─────────────────────────────────────────────────────────────
export const COLOR_SWATCH_DEFINITIONS = [
  { id: "black", label: "Solid Black", category: "Neutrals", colorHex: "#18181B" },
  { id: "tortoise", label: "Classic Tortoise", category: "Neutrals", colorHex: "#6B3E11" },
  { id: "crystal", label: "Crystal Clear", category: "Neutrals", colorHex: "#E2E8F0" },
  { id: "grey", label: "Smoked Slate", category: "Neutrals", colorHex: "#64748B" },
  { id: "amber", label: "Amber Honey", category: "Neutrals", colorHex: "#D97706" },
  { id: "gold", label: "Classic Gold", category: "Metals", colorHex: "#EAB308" },
  { id: "silver", label: "Silver & Steel", category: "Metals", colorHex: "#94A3B8" },
  { id: "rose_gold", label: "Rose Gold", category: "Metals", colorHex: "#FB7185" },
  { id: "red", label: "Crimson Red", category: "Vibrant", colorHex: "#DC2626" },
  { id: "blue", label: "Electric Cobalt", category: "Vibrant", colorHex: "#2563EB" },
  { id: "teal", label: "Tropical Teal", category: "Vibrant", colorHex: "#06B6D4" },
  { id: "green", label: "Emerald Green", category: "Vibrant", colorHex: "#16A34A" },
  { id: "orange", label: "Vivid Orange", category: "Vibrant", colorHex: "#EA580C" },
  { id: "pink", label: "Bubblegum Pink", category: "Vibrant", colorHex: "#EC4899" },
  { id: "purple", label: "Lilac Purple", category: "Vibrant", colorHex: "#9333EA" },
];

// ─────────────────────────────────────────────────────────────
//  FACET MATCHING HELPERS
// ─────────────────────────────────────────────────────────────

export function matchesGender(product: SafeProduct, genderVal: string): boolean {
  const pGen = (product.gender || "").toLowerCase().trim();
  const val = genderVal.toLowerCase().trim();
  if (val === "all" || val === "unisex") return true;
  if (val === "men") return pGen === "men" || pGen === "unisex" || pGen === "";
  if (val === "women") return pGen === "women" || pGen === "unisex" || pGen === "";
  if (val === "kids") return pGen === "kids" || pGen === "juniors";
  return pGen === val;
}

export function matchesShape(product: SafeProduct, shapeVal: string): boolean {
  const pShape = (product.frameShape || "").toLowerCase().replace(/[-_]/g, "");
  const target = shapeVal.toLowerCase().replace(/[-_]/g, "");

  if (target === "cateye" && (pShape === "cateye" || pShape === "cat_eye")) return true;
  if (target === "wayfarer" && (pShape === "wayfarer" || pShape === "square")) return true;
  if (target === "geometric" && (pShape === "geometric" || pShape === "hexagonal" || pShape === "octagonal")) return true;
  if (target === "rimless" && (pShape === "rimless" || pShape === "semirimless" || pShape === "semi_rimless")) return true;

  return pShape === target || pShape.includes(target) || target.includes(pShape);
}

export function matchesFit(product: SafeProduct, fitVal: string): boolean {
  const target = fitVal.toLowerCase();
  const desc = ((product.description || "") + " " + (product.name || "")).toLowerCase();
  const idHash = (product.id || "").charCodeAt(0) || 0;

  if (desc.includes(target)) return true;
  if (target === "narrow" && (desc.includes("small") || desc.includes("petite") || desc.includes("narrow"))) return true;
  if (target === "wide" && (desc.includes("large") || desc.includes("wide"))) return true;
  if (target === "extra_wide" && (desc.includes("extra wide") || desc.includes("xl") || desc.includes("oversized"))) return true;
  if (target === "medium") {
    if (!desc.includes("narrow") && !desc.includes("extra wide") && !desc.includes("oversized")) return true;
  }

  // Fallback realistic distribution for catalog demo
  const fits = ["medium", "wide", "narrow", "medium", "extra_wide", "medium"];
  return fits[idHash % fits.length] === target;
}

export function matchesMaterial(product: SafeProduct, materialVal: string): boolean {
  const pMat = (product.material || "").toLowerCase();
  const target = materialVal.toLowerCase();

  if (target === "acetate") return pMat.includes("acetate") || pMat.includes("plastic") || pMat.includes("celluloid");
  if (target === "metal") return pMat.includes("metal") || pMat.includes("titanium") || pMat.includes("steel") || pMat.includes("stainless");
  if (target === "tr90") return pMat.includes("tr90") || pMat.includes("flexible") || pMat.includes("lightweight") || pMat.includes("nylon");
  if (target === "mixed") return pMat.includes("hybrid") || pMat.includes("mixed") || pMat.includes("wood") || pMat === "" || pMat === "nill";

  return pMat.includes(target);
}

export function matchesPrescription(product: SafeProduct, rxVal: string): boolean {
  const target = rxVal.toLowerCase();
  const pCat = (product.category || "").toLowerCase();
  const pShape = (product.frameShape || "").toLowerCase();

  // All opticals are compatible with Single Vision & Non-Prescription Blue Light
  if (target === "single_vision" || target === "non_prescription") {
    return pCat !== "accessories";
  }

  // Progressives require taller lens frame (Rectangle, Square, Round, Aviator, Wayfarer)
  if (target === "progressives") {
    return !pShape.includes("slim") && !pShape.includes("micro") && pShape !== "narrow";
  }

  // High Index requires acetate or durable full-rim frames
  if (target === "high_index") {
    const pMat = (product.material || "").toLowerCase();
    return pMat.includes("acetate") || pMat.includes("tr90") || pShape.includes("full");
  }

  return true;
}

export function matchesColor(product: SafeProduct, colorVal: string): boolean {
  const target = colorVal.toLowerCase();
  const rawColors = product.colors || [];
  const colorArray: string[] = Array.isArray(rawColors)
    ? rawColors
    : typeof rawColors === "string"
    ? [rawColors]
    : [];

  const text = (colorArray.join(" ") + " " + product.name + " " + product.description).toLowerCase();

  const palette = COLOR_PALETTES[target];
  if (palette) {
    if (palette.keywords.some((kw) => text.includes(kw))) return true;
  }

  return text.includes(target);
}

export function matchesVibe(product: SafeProduct, vibeVal: string): boolean {
  const target = vibeVal.toLowerCase();
  const text = (product.name + " " + product.description + " " + product.frameShape + " " + product.material).toLowerCase();

  if (target === "bestsellers") return product.featured || product.price > 4500 || text.includes("classic");
  if (target === "minimalist") return text.includes("metal") || text.includes("rimless") || text.includes("titanium") || text.includes("slim");
  if (target === "bold") return text.includes("acetate") || text.includes("geometric") || text.includes("chunky") || text.includes("thick");
  if (target === "vintage") return text.includes("round") || text.includes("aviator") || text.includes("tortoise") || text.includes("retro");
  if (target === "new_arrivals") return true;

  return true;
}

// ─────────────────────────────────────────────────────────────
//  SINGLE PRODUCT MATCH CHECK (Given filters, optionally ignoring 1 key)
// ─────────────────────────────────────────────────────────────
export function productMatchesFilters(
  product: SafeProduct,
  filters: CatalogFilterState,
  ignoreKey?: keyof CatalogFilterState
): boolean {
  // Price check
  if (ignoreKey !== "minPrice" && ignoreKey !== "maxPrice") {
    if (product.price < filters.minPrice || product.price > filters.maxPrice) {
      return false;
    }
  }

  // Search check
  if (ignoreKey !== "search" && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    const str = `${product.name} ${product.description} ${product.frameShape} ${product.material}`.toLowerCase();
    if (!str.includes(q)) return false;
  }

  // Gender check
  if (ignoreKey !== "gender" && filters.gender.length > 0) {
    const match = filters.gender.some((g) => matchesGender(product, g));
    if (!match) return false;
  }

  // Shape check
  if (ignoreKey !== "shape" && filters.shape.length > 0) {
    const match = filters.shape.some((s) => matchesShape(product, s));
    if (!match) return false;
  }

  // Fit check
  if (ignoreKey !== "fit" && filters.fit.length > 0) {
    const match = filters.fit.some((f) => matchesFit(product, f));
    if (!match) return false;
  }

  // Material check
  if (ignoreKey !== "material" && filters.material.length > 0) {
    const match = filters.material.some((m) => matchesMaterial(product, m));
    if (!match) return false;
  }

  // Prescription check
  if (ignoreKey !== "prescription" && filters.prescription.length > 0) {
    const match = filters.prescription.some((rx) => matchesPrescription(product, rx));
    if (!match) return false;
  }

  // Color check
  if (ignoreKey !== "color" && filters.color.length > 0) {
    const match = filters.color.some((c) => matchesColor(product, c));
    if (!match) return false;
  }

  // Vibe check
  if (ignoreKey !== "vibe" && filters.vibe.length > 0) {
    const match = filters.vibe.some((v) => matchesVibe(product, v));
    if (!match) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
//  REAL-TIME FACET AGGREGATOR
// ─────────────────────────────────────────────────────────────
export function aggregateFacets(
  products: SafeProduct[],
  filters: CatalogFilterState
): FacetGroup[] {
  // 1. Gender Facet Options (Step 2)
  const rawGenderOptions = [
    { id: "men", label: "Men", hint: "Engineered for broader jawlines" },
    { id: "women", label: "Women", hint: "Tailored petite & statement silhouettes" },
    { id: "kids", label: "Kids / Juniors", hint: "Ultra-durable, flexible fit for youth" },
    { id: "unisex", label: "Unisex / All", hint: "Universally flattering designs" },
  ];

  const genderOptions: FacetOption[] = rawGenderOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesGender(p, opt.id) && productMatchesFilters(p, filters, "gender")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      hint: opt.hint,
      count,
      disabled: count === 0,
    };
  });

  // 2. Shape Facet Options (Step 3/4)
  const rawShapeOptions = [
    { id: "rectangle", label: "Rectangle", hint: "Sharp & modern structure" },
    { id: "square", label: "Square", hint: "Bold, defined architectural lines" },
    { id: "round", label: "Round", hint: "Timeless retro & intellectual vibe" },
    { id: "aviator", label: "Aviator", hint: "Iconic teardrop heritage design" },
    { id: "cat_eye", label: "Cat-Eye", hint: "Vintage upswept glamour" },
    { id: "geometric", label: "Geometric", hint: "Octagonal & avant-garde angles" },
    { id: "rimless", label: "Rimless", hint: "Ultra-lightweight minimalist profile" },
  ];

  const shapeOptions: FacetOption[] = rawShapeOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesShape(p, opt.id) && productMatchesFilters(p, filters, "shape")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      hint: opt.hint,
      svgShape: SHAPE_SVG_PATHS[opt.id],
      count,
      disabled: count === 0,
    };
  });

  // 3. Fit Facet Options (Step 5)
  const rawFitOptions = [
    { id: "narrow", label: "Narrow", sublabel: "<130mm", hint: "Petite temples & bridges" },
    { id: "medium", label: "Medium", sublabel: "130–138mm", hint: "Standard universal fit" },
    { id: "wide", label: "Wide", sublabel: "139–145mm", hint: "Comfortable spacious width" },
    { id: "extra_wide", label: "Extra Wide", sublabel: ">145mm", hint: "Maximum temple clearance" },
  ];

  const fitOptions: FacetOption[] = rawFitOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesFit(p, opt.id) && productMatchesFilters(p, filters, "fit")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      sublabel: opt.sublabel,
      hint: opt.hint,
      count,
      disabled: count === 0,
    };
  });

  // 4. Color Swatches (Step 8 - 15 Swatches)
  const colorOptions: FacetOption[] = COLOR_SWATCH_DEFINITIONS.map((opt) => {
    const count = products.filter(
      (p) => matchesColor(p, opt.id) && productMatchesFilters(p, filters, "color")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      sublabel: opt.category,
      colorHex: opt.colorHex,
      count,
      disabled: count === 0,
    };
  });

  // 5. Material Options (Step 6)
  const rawMaterialOptions = [
    { id: "acetate", label: "Handcrafted Acetate", hint: "Rich organic cotton polymer lustre" },
    { id: "metal", label: "Titanium & Metal", hint: "Featherlight aerospace-grade resilience" },
    { id: "tr90", label: "TR90 Lightweight Flexible", hint: "Flexible thermoplastic memory memory" },
    { id: "mixed", label: "Mixed Material", hint: "Acetate front with titanium temples" },
  ];

  const materialOptions: FacetOption[] = rawMaterialOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesMaterial(p, opt.id) && productMatchesFilters(p, filters, "material")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      hint: opt.hint,
      count,
      disabled: count === 0,
    };
  });

  // 6. Prescription Compatibility (Step 7)
  const rawRxOptions = [
    { id: "single_vision", label: "Single Vision", hint: "Distance or reading focus" },
    { id: "progressives", label: "Progressive / Bifocal", hint: "Seamless multi-distance corridor" },
    { id: "high_index", label: "High Index (Thin & Light)", hint: "For strong prescriptions (-4.00+)" },
    { id: "non_prescription", label: "Non-Prescription / Blue Light", hint: "Zero-power screen protection" },
  ];

  const rxOptions: FacetOption[] = rawRxOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesPrescription(p, opt.id) && productMatchesFilters(p, filters, "prescription")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      hint: opt.hint,
      count,
      disabled: count === 0,
    };
  });

  // 7. Collection & Vibe (Step 9)
  const rawVibeOptions = [
    { id: "bestsellers", label: "Bestsellers & Timeless", hint: "Customer-favorite flagship designs" },
    { id: "minimalist", label: "Modern Minimalist", hint: "Ultra-thin profiles & clean lines" },
    { id: "bold", label: "Bold & Statement", hint: "Thick bevels & distinctive presence" },
    { id: "vintage", label: "Vintage & Retro Classic", hint: "Mid-century acetate craftsmanship" },
    { id: "new_arrivals", label: "New Arrivals", hint: "Latest seasonal runway drops" },
  ];

  const vibeOptions: FacetOption[] = rawVibeOptions.map((opt) => {
    const count = products.filter(
      (p) => matchesVibe(p, opt.id) && productMatchesFilters(p, filters, "vibe")
    ).length;
    return {
      id: opt.id,
      label: opt.label,
      hint: opt.hint,
      count,
      disabled: count === 0,
    };
  });

  return [
    { id: "gender", title: "Audience & Gender", stepHint: "Quiz Step 2", options: genderOptions },
    { id: "shape", title: "Frame Shape & Style", stepHint: "Quiz Step 3 & 4", options: shapeOptions },
    { id: "fit", title: "Frame Width & Fit", stepHint: "Quiz Step 5", options: fitOptions },
    { id: "color", title: "Color & Aesthetic Palette", stepHint: "Quiz Step 8", options: colorOptions },
    { id: "material", title: "Material Preference", stepHint: "Quiz Step 6", options: materialOptions },
    { id: "prescription", title: "Prescription & Lens Compatibility", stepHint: "Quiz Step 7", options: rxOptions },
    { id: "vibe", title: "Collection & Vibe", stepHint: "Quiz Step 9", options: vibeOptions },
  ];
}

// ─────────────────────────────────────────────────────────────
//  FILTER AND SORT PRODUCTS
// ─────────────────────────────────────────────────────────────
export function filterAndSortProducts(
  products: SafeProduct[],
  filters: CatalogFilterState
): SafeProduct[] {
  const filtered = products.filter((p) => productMatchesFilters(p, filters));

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "newest":
        return b.name.localeCompare(a.name);
      case "featured":
      default:
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.price - b.price;
    }
  });
}
