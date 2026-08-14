// ============================================================
//  MY EYES — Style Quiz Data Layer
//  Maps each step's options directly to Prisma DB schema fields
// ============================================================

export type FrameShapeDB =
  | "WAYFARER"
  | "AVIATOR"
  | "RECTANGLE"
  | "ROUND"
  | "OVAL"
  | "SQUARE"
  | "CAT_EYE"
  | "GEOMETRIC"
  | "RIMLESS"
  | "SEMI_RIMLESS"
  | "NILL";

export type MaterialDB =
  | "ACETATE"
  | "METAL"
  | "TITANIUM"
  | "TR90"
  | "STAINLESS_STEEL"
  | "WOOD"
  | "HYBRID"
  | "NILL";

export type CategoryDB = "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES" | "NILL" | "all";

export interface QuizAnswers {
  category?: CategoryDB;
  gender?: string | string[];
  primaryUse?: string;
  material?: MaterialDB | "all";
  frameShapes?: FrameShapeDB[];
  frameSize?: "narrow" | "medium" | "wide" | "all";
  bridgeFit?: "standard" | "lowbridge" | "nosepads" | "all";
  colorPalette?: string[];
}

export interface QuizOption {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
  icon?: string; // lucide icon name
  svgPath?: string; // SVG path data for shape silhouettes
  swatchColors?: string[]; // CSS color values for swatch display
  dbValue: CategoryDB | string | string[] | MaterialDB | FrameShapeDB | FrameShapeDB[];
  dbField: keyof QuizAnswers;
  points?: number;
}

export interface QuizStep {
  step: number;
  title: string;
  subtitle: string;
  multiSelect?: boolean;
  options: QuizOption[];
}

// ============================================================
//  SVG PATH DATA — Frame Silhouettes (viewBox 0 0 120 60)
// ============================================================
export const FRAME_SVGS: Record<string, string> = {
  SQUARE: `
    <rect x="8" y="10" width="44" height="38" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="68" y="10" width="44" height="38" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="29" x2="68" y2="29" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="18" x2="118" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  GEOMETRIC: `
    <polygon points="10,48 30,8 50,48" fill="none" stroke="currentColor" stroke-width="3"/>
    <polygon points="70,48 90,8 110,48" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="50" y1="28" x2="70" y2="28" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="110" y1="20" x2="118" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  ROUND: `
    <ellipse cx="30" cy="30" rx="22" ry="22" fill="none" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="90" cy="30" rx="22" ry="22" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="18" x2="118" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  OVAL: `
    <ellipse cx="30" cy="30" rx="22" ry="18" fill="none" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="90" cy="30" rx="22" ry="18" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="20" x2="118" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  CAT_EYE: `
    <path d="M8,38 Q12,10 30,10 Q48,10 52,28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M8,38 Q10,44 20,44 Q38,44 52,28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M68,28 Q72,10 90,10 Q108,10 112,38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M68,28 Q72,44 82,44 Q100,44 112,38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="52" y1="34" x2="68" y2="34" stroke="currentColor" stroke-width="2.5"/>
    <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="20" x2="118" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  AVIATOR: `
    <path d="M8,14 Q10,8 30,8 Q44,8 52,30 Q44,52 30,50 Q10,50 8,14 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M68,14 Q70,8 90,8 Q104,8 112,30 Q104,52 90,50 Q70,50 68,14 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="26" x2="68" y2="26" stroke="currentColor" stroke-width="2.5"/>
    <line x1="1" y1="14" x2="8" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="14" x2="119" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  RECTANGLE: `
    <rect x="6" y="14" width="46" height="32" rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="68" y="14" width="46" height="32" rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="30" x2="68" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="1" y1="20" x2="6" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="114" y1="20" x2="119" y2="20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  WAYFARER: `
    <path d="M8,18 Q8,10 18,10 L42,10 Q52,10 52,20 L52,38 Q52,46 42,46 L18,46 Q8,46 8,38 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M68,18 Q68,10 78,10 L102,10 Q112,10 112,20 L112,38 Q112,46 102,46 L78,46 Q68,46 68,38 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="52" y1="28" x2="68" y2="28" stroke="currentColor" stroke-width="2.5"/>
    <line x1="1" y1="18" x2="8" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="112" y1="18" x2="119" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
};

// ============================================================
//  COLOR SWATCH DATA
// ============================================================
export const COLOR_PALETTES: Record<string, { label: string; colors: string[]; keywords: string[] }> = {
  black: {
    label: "Solid Black & Midnight",
    colors: ["#18181B"],
    keywords: ["black", "midnight", "onyx", "noir", "dark"],
  },
  tortoise: {
    label: "Classic Tortoise & Havana",
    colors: ["#6B3E11"],
    keywords: ["tortoise", "havana", "brown", "amber", "cognac", "demi"],
  },
  crystal: {
    label: "Crystal Clear & Ice",
    colors: ["#E2E8F0"],
    keywords: ["crystal", "clear", "transparent", "ice"],
  },
  grey: {
    label: "Smoked Slate & Grey",
    colors: ["#64748B"],
    keywords: ["grey", "gray", "slate", "smoke", "charcoal"],
  },
  amber: {
    label: "Warm Amber & Honey Brown",
    colors: ["#D97706"],
    keywords: ["amber", "honey", "brown", "yellow"],
  },
  gold: {
    label: "Classic Gold & Champagne",
    colors: ["#EAB308"],
    keywords: ["gold", "champagne", "bronze", "brass"],
  },
  silver: {
    label: "Silver & Gunmetal Steel",
    colors: ["#94A3B8"],
    keywords: ["silver", "gunmetal", "steel", "metal", "platinum"],
  },
  rose_gold: {
    label: "Rose Gold & Warm Copper",
    colors: ["#FB7185"],
    keywords: ["rose gold", "copper", "blush", "pink gold"],
  },
  red: {
    label: "Crimson & Bold Red",
    colors: ["#DC2626"],
    keywords: ["red", "crimson", "scarlet", "ruby", "burgundy", "wine"],
  },
  blue: {
    label: "Electric Cobalt & Deep Navy",
    colors: ["#2563EB"],
    keywords: ["blue", "cobalt", "navy", "indigo", "azure"],
  },
  teal: {
    label: "Bright Cyan & Tropical Teal",
    colors: ["#06B6D4"],
    keywords: ["teal", "cyan", "turquoise", "aqua"],
  },
  green: {
    label: "Emerald & Olive Green",
    colors: ["#16A34A"],
    keywords: ["green", "emerald", "olive", "forest", "sage"],
  },
  orange: {
    label: "Vivid Orange & Sunburst",
    colors: ["#EA580C"],
    keywords: ["orange", "sunburst", "tangerine", "coral"],
  },
  pink: {
    label: "Bubblegum & Pastel Pink",
    colors: ["#EC4899"],
    keywords: ["pink", "bubblegum", "rose", "pastel pink"],
  },
  purple: {
    label: "Lilac & Royal Purple",
    colors: ["#9333EA"],
    keywords: ["purple", "lilac", "violet", "plum", "lavender", "royal purple"],
  },
};

// ============================================================
//  SCORING WEIGHTS
// ============================================================
export const SCORING_WEIGHTS = {
  category: 25,
  gender: 20,
  frameShape: 20,
  material: 15,
  color: 10,
  frameSize: 10,
};

// ============================================================
//  ALL 8 QUIZ STEPS
// ============================================================
export const QUIZ_STEPS: QuizStep[] = [
  // ─────────────────────────────────────────────────────────
  //  STEP 1: Frame Category
  // ─────────────────────────────────────────────────────────
  {
    step: 1,
    title: "What type of eyewear are you looking for today?",
    subtitle: "Select the primary function you need.",
    multiSelect: false,
    options: [
      {
        id: "cat-eyeglasses",
        label: "Eyeglasses",
        sublabel: "Prescription optical frames",
        hint: "SPH, CYL, and bifocal lenses",
        icon: "Glasses",
        dbField: "category",
        dbValue: "EYEGLASSES",
      },
      {
        id: "cat-sunglasses",
        label: "Sunglasses",
        sublabel: "UV-protective tinted frames",
        hint: "Fashion + lifestyle + photochromic",
        icon: "Sun",
        dbField: "category",
        dbValue: "SUNGLASSES",
      },
      {
        id: "cat-all",
        label: "Both / Not Sure",
        sublabel: "Show me everything",
        hint: "We'll prioritize bestsellers",
        icon: "Sparkles",
        dbField: "category",
        dbValue: "all",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 2: Audience & Gender Preference
  // ─────────────────────────────────────────────────────────
  {
    step: 2,
    title: "Who will be wearing these frames?",
    subtitle:
      "We'll filter frames tailored to your preferred aesthetic and proportion.",
    multiSelect: false,
    options: [
      {
        id: "gender-men",
        label: "Men",
        sublabel: "Masculine aesthetics",
        hint: "Bold silhouettes & wider fits",
        icon: "User",
        dbField: "gender",
        dbValue: ["Men", "Unisex"],
      },
      {
        id: "gender-women",
        label: "Women",
        sublabel: "Feminine aesthetics",
        hint: "Elegant, delicate proportions",
        icon: "UserCircle",
        dbField: "gender",
        dbValue: ["Women", "Unisex"],
      },
      {
        id: "gender-kids",
        label: "Kids / Juniors",
        sublabel: "Smaller bridge, flexible durable frames",
        hint: "Lightweight & extra impact-resistant",
        icon: "Sparkles",
        dbField: "gender",
        dbValue: ["Kids", "Unisex"],
      },
      {
        id: "gender-unisex",
        label: "Unisex / Everyone",
        sublabel: "Gender-neutral",
        hint: "Universal shapes that look great on all",
        icon: "Users",
        dbField: "gender",
        dbValue: "all",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 3: Primary Use & Lifestyle
  // ─────────────────────────────────────────────────────────
  {
    step: 3,
    title: "How will you be using your glasses most?",
    subtitle:
      "Helps us recommend optimal lens and frame resilience.",
    multiSelect: false,
    options: [
      {
        id: "use-everyday",
        label: "Everyday Wear",
        sublabel: "General prescription & daily use",
        hint: "Versatile shapes, lightweight build",
        icon: "Clock",
        dbField: "primaryUse",
        dbValue: "everyday",
      },
      {
        id: "use-screen",
        label: "Screen & Digital Work",
        sublabel: "Blue-light protection frames",
        hint: "Anti-fatigue + coating recommendations",
        icon: "Monitor",
        dbField: "primaryUse",
        dbValue: "screen",
      },
      {
        id: "use-reading",
        label: "Reading & Close-Up Work",
        sublabel: "Compact, light reading frames",
        hint: "Narrow-to-medium widths prioritized",
        icon: "BookOpen",
        dbField: "primaryUse",
        dbValue: "reading",
      },
      {
        id: "use-outdoor",
        label: "Outdoor & Statement Wear",
        sublabel: "Photochromic / sunglass frames",
        hint: "Bold shapes, UV protection priority",
        icon: "Mountain",
        dbField: "primaryUse",
        dbValue: "outdoor",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 4: Frame Material & Weight
  // ─────────────────────────────────────────────────────────
  {
    step: 4,
    title: "Which material do you feel most comfortable wearing?",
    subtitle: "Choose based on feel, durability, and texture.",
    multiSelect: false,
    options: [
      {
        id: "mat-acetate",
        label: "Acetate & Hand-Crafted Resin",
        sublabel: "Bold, sturdy, rich depth",
        hint: "Excellent for vibrant colors & patterns",
        icon: "Layers",
        dbField: "material",
        dbValue: "ACETATE",
      },
      {
        id: "mat-metal",
        label: "Lightweight Metal & Titanium",
        sublabel: "Sleek, feather-light, minimal",
        hint: "Ideal for sensitive skin & all-day wear",
        icon: "Zap",
        dbField: "material",
        dbValue: "TITANIUM",
      },
      {
        id: "mat-hybrid",
        label: "Mixed Media",
        sublabel: "Acetate rims & metal temples",
        hint: "Best of both worlds — bold yet lightweight",
        icon: "Blend",
        dbField: "material",
        dbValue: "HYBRID",
      },
      {
        id: "mat-all",
        label: "No Preference",
        sublabel: "Include all materials",
        hint: "We'll show the full catalog",
        icon: "Star",
        dbField: "material",
        dbValue: "all",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 5: Frame Shape & Face Geometry (SVG Silhouettes)
  // ─────────────────────────────────────────────────────────
  {
    step: 5,
    title: "Which frame shapes do you like best?",
    subtitle: "Select one or more silhouettes you feel confident wearing.",
    multiSelect: true,
    options: [
      {
        id: "shape-square-geo",
        label: "Square & Geometric",
        sublabel: "Angular, structured frames",
        hint: "✦ Best for Round & Oval faces",
        dbField: "frameShapes",
        dbValue: ["SQUARE", "GEOMETRIC"] as FrameShapeDB[],
        svgPath: FRAME_SVGS.SQUARE,
      },
      {
        id: "shape-round-oval",
        label: "Round & Oval",
        sublabel: "Soft, classic curves",
        hint: "✦ Best for Square & Angular faces",
        dbField: "frameShapes",
        dbValue: ["ROUND", "OVAL"] as FrameShapeDB[],
        svgPath: FRAME_SVGS.ROUND,
      },
      {
        id: "shape-cateye",
        label: "Cat-Eye & Browline",
        sublabel: "Lifted outer edge accent",
        hint: "✦ Best for Heart & Oval faces",
        dbField: "frameShapes",
        dbValue: ["CAT_EYE", "WAYFARER"] as FrameShapeDB[],
        svgPath: FRAME_SVGS.CAT_EYE,
      },
      {
        id: "shape-aviator",
        label: "Aviator & Pilot",
        sublabel: "Classic teardrop silhouette",
        hint: "✦ Universally flattering",
        dbField: "frameShapes",
        dbValue: ["AVIATOR"] as FrameShapeDB[],
        svgPath: FRAME_SVGS.AVIATOR,
      },
      {
        id: "shape-rectangle",
        label: "Rectangle & Sleek",
        sublabel: "Subtle horizontal framing",
        hint: "✦ Classic professional aesthetic",
        dbField: "frameShapes",
        dbValue: ["RECTANGLE"] as FrameShapeDB[],
        svgPath: FRAME_SVGS.RECTANGLE,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 6: Frame Width & Fit
  // ─────────────────────────────────────────────────────────
  {
    step: 6,
    title: "What is your preferred frame width?",
    subtitle:
      "We'll match frames that sit comfortably on your temple width.",
    multiSelect: false,
    options: [
      {
        id: "size-narrow",
        label: "Narrow / Petite",
        sublabel: "Frame width < 130mm",
        hint: "Ideal for petite or narrow faces",
        icon: "Minimize2",
        dbField: "frameSize",
        dbValue: "narrow",
      },
      {
        id: "size-medium",
        label: "Medium / Standard",
        sublabel: "Universal fit, 131mm – 138mm",
        hint: "Suits most face widths",
        icon: "AlignCenter",
        dbField: "frameSize",
        dbValue: "medium",
      },
      {
        id: "size-wide",
        label: "Wide / Oversized",
        sublabel: "Generous width, > 139mm",
        hint: "Bold statement pieces",
        icon: "Maximize2",
        dbField: "frameSize",
        dbValue: "wide",
      },
      {
        id: "size-all",
        label: "Don't Know",
        sublabel: "Include all standard fits",
        hint: "Our best-sellers span all sizes",
        icon: "HelpCircle",
        dbField: "frameSize",
        dbValue: "all",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 7: Bridge Fit & Nose Pads
  // ─────────────────────────────────────────────────────────
  {
    step: 7,
    title: "Do you require a specific nose bridge fit?",
    subtitle: "Ensures your glasses never slide or pinch.",
    multiSelect: false,
    options: [
      {
        id: "bridge-standard",
        label: "Standard Bridge",
        sublabel: "Traditional acetate/metal fit",
        hint: "Works for most nose bridges",
        icon: "Minus",
        dbField: "bridgeFit",
        dbValue: "standard",
      },
      {
        id: "bridge-lowbridge",
        label: "Low Bridge Fit",
        sublabel: "Higher cheekbones or flatter bridges",
        hint: "Anti-slip design for Asian fit",
        icon: "ChevronDown",
        dbField: "bridgeFit",
        dbValue: "lowbridge",
      },
      {
        id: "bridge-nosepads",
        label: "Adjustable Nose Pads",
        sublabel: "Metal arm pads for custom comfort",
        hint: "Fully customizable fit",
        icon: "Settings2",
        dbField: "bridgeFit",
        dbValue: "nosepads",
      },
      {
        id: "bridge-all",
        label: "Either Works",
        sublabel: "Include all bridge types",
        hint: "No preference — show everything",
        icon: "CheckCircle",
        dbField: "bridgeFit",
        dbValue: "all",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  //  STEP 8: Color Palette & Finish (with CSS swatches)
  // ─────────────────────────────────────────────────────────
  {
    step: 8,
    title: "Which color tones do you gravitate toward?",
    subtitle: "Pick your favorite finish palette.",
    multiSelect: true,
    options: [
      {
        id: "color-black",
        label: "Solid Black & Midnight",
        sublabel: "Bold, minimalist finish",
        dbField: "colorPalette",
        dbValue: "black",
        swatchColors: COLOR_PALETTES.black.colors,
      },
      {
        id: "color-tortoise",
        label: "Classic Tortoise & Havana",
        sublabel: "Warm earthy tortoiseshell",
        dbField: "colorPalette",
        dbValue: "tortoise",
        swatchColors: COLOR_PALETTES.tortoise.colors,
      },
      {
        id: "color-crystal",
        label: "Crystal Clear & Ice",
        sublabel: "Modern light-catching clear",
        dbField: "colorPalette",
        dbValue: "crystal",
        swatchColors: COLOR_PALETTES.crystal.colors,
      },
      {
        id: "color-grey",
        label: "Smoked Slate & Grey",
        sublabel: "Cool muted slate grey",
        dbField: "colorPalette",
        dbValue: "grey",
        swatchColors: COLOR_PALETTES.grey.colors,
      },
      {
        id: "color-amber",
        label: "Warm Amber & Honey Brown",
        sublabel: "Rich vintage honey amber",
        dbField: "colorPalette",
        dbValue: "amber",
        swatchColors: COLOR_PALETTES.amber.colors,
      },
      {
        id: "color-gold",
        label: "Classic Gold & Champagne",
        sublabel: "Warm luxury champagne gold",
        dbField: "colorPalette",
        dbValue: "gold",
        swatchColors: COLOR_PALETTES.gold.colors,
      },
      {
        id: "color-silver",
        label: "Silver & Gunmetal Steel",
        sublabel: "Sleek professional steel",
        dbField: "colorPalette",
        dbValue: "silver",
        swatchColors: COLOR_PALETTES.silver.colors,
      },
      {
        id: "color-rose_gold",
        label: "Rose Gold & Warm Copper",
        sublabel: "Delicate blush copper tones",
        dbField: "colorPalette",
        dbValue: "rose_gold",
        swatchColors: COLOR_PALETTES.rose_gold.colors,
      },
      {
        id: "color-red",
        label: "Crimson & Bold Red",
        sublabel: "Vibrant statement crimson",
        dbField: "colorPalette",
        dbValue: "red",
        swatchColors: COLOR_PALETTES.red.colors,
      },
      {
        id: "color-blue",
        label: "Electric Cobalt & Deep Navy",
        sublabel: "Vivid royal cobalt blue",
        dbField: "colorPalette",
        dbValue: "blue",
        swatchColors: COLOR_PALETTES.blue.colors,
      },
      {
        id: "color-teal",
        label: "Bright Cyan & Tropical Teal",
        sublabel: "Lively splash of tropical cyan",
        dbField: "colorPalette",
        dbValue: "teal",
        swatchColors: COLOR_PALETTES.teal.colors,
      },
      {
        id: "color-green",
        label: "Emerald & Olive Green",
        sublabel: "Deep organic olive green",
        dbField: "colorPalette",
        dbValue: "green",
        swatchColors: COLOR_PALETTES.green.colors,
      },
      {
        id: "color-orange",
        label: "Vivid Orange & Sunburst",
        sublabel: "Radiant electric sunburst orange",
        dbField: "colorPalette",
        dbValue: "orange",
        swatchColors: COLOR_PALETTES.orange.colors,
      },
      {
        id: "color-pink",
        label: "Bubblegum & Pastel Pink",
        sublabel: "Playful bubblegum pastel",
        dbField: "colorPalette",
        dbValue: "pink",
        swatchColors: COLOR_PALETTES.pink.colors,
      },
      {
        id: "color-purple",
        label: "Lilac & Royal Purple",
        sublabel: "Regal lilac & velvet purple",
        dbField: "colorPalette",
        dbValue: "purple",
        swatchColors: COLOR_PALETTES.purple.colors,
      },
    ],
  },
];

// Util: Get step by number
export function getQuizStep(step: number): QuizStep | undefined {
  return QUIZ_STEPS.find((s) => s.step === step);
}

// Util: Total steps
export const TOTAL_STEPS = QUIZ_STEPS.length;
