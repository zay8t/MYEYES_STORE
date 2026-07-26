import { formatFrameShape, formatMaterial, formatPrice } from "./utils";

export interface SafeProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  formattedPrice: string;
  stock: number;
  frameShape: string;
  formattedShape: string;
  material: string;
  formattedMaterial: string;
  gender: string;
  images: string[];
  firstImage: string;
  category: "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES" | "NILL";
  featured: boolean;
  createdAt: string;
}

function cleanImageString(img: string): string {
  const trimmed = img.trim();
  if (!trimmed || trimmed === "/logo.png") {
    return "/placeholder-frame.png";
  }
  return trimmed;
}

export function parseProductImages(imagesData: unknown): string[] {
  if (!imagesData) return ["/placeholder-frame.png"];

  let list: string[] = [];

  if (Array.isArray(imagesData)) {
    list = imagesData.map((img) => (typeof img === "string" ? cleanImageString(img) : "/placeholder-frame.png"));
  } else if (typeof imagesData === "string") {
    const trimmed = imagesData.trim();
    if (!trimmed) return ["/placeholder-frame.png"];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = parsed.map((img) => (typeof img === "string" ? cleanImageString(img) : "/placeholder-frame.png"));
        }
      } catch {
        list = trimmed.split(",").map((s) => cleanImageString(s));
      }
    } else {
      list = trimmed.split(",").map((s) => cleanImageString(s));
    }
  }

  const sanitized = list.filter((img) => img && img.trim() !== "");
  return sanitized.length > 0 ? sanitized : ["/placeholder-frame.png"];
}

export function safeFormatPrice(price: unknown): string {
  const num = typeof price === "number" ? price : parseFloat(String(price || 0));
  if (isNaN(num) || num < 0) return formatPrice(0);
  return formatPrice(num);
}

export function safeProduct(product: Record<string, unknown> | null | undefined): SafeProduct {
  if (!product || typeof product !== "object") {
    return {
      id: "unknown-id",
      name: "Standard Eyewear Frame",
      slug: "eyewear-frame",
      description: "High quality optical prescription frame.",
      price: 0,
      formattedPrice: formatPrice(0),
      stock: 0,
      frameShape: "NILL",
      formattedShape: "Classic",
      material: "NILL",
      formattedMaterial: "Standard Alloy",
      gender: "Unspecified",
      images: ["/placeholder-frame.png"],
      firstImage: "/placeholder-frame.png",
      category: "EYEGLASSES",
      featured: false,
      createdAt: new Date().toISOString(),
    };
  }

  const rawPrice = typeof product.price === "number" ? product.price : parseFloat(String(product.price || 0)) || 0;
  const rawStock = typeof product.stock === "number" ? product.stock : parseInt(String(product.stock || 0), 10) || 0;
  const images = parseProductImages(product.images);

  return {
    id: String(product.id || `prod-${Date.now()}`),
    name: String(product.name || "Standard Eyewear Frame"),
    slug: String(product.slug || "eyewear-frame"),
    description: String(product.description || "High quality optical frame."),
    price: rawPrice,
    formattedPrice: formatPrice(rawPrice),
    stock: Math.max(0, rawStock),
    frameShape: String(product.frameShape || "NILL"),
    formattedShape: formatFrameShape(typeof product.frameShape === "string" ? product.frameShape : null),
    material: String(product.material || "NILL"),
    formattedMaterial: formatMaterial(typeof product.material === "string" ? product.material : null),
    gender: String(product.gender || "Unspecified"),
    images,
    firstImage: images[0] || "/placeholder-frame.png",
    category: (product.category === "SUNGLASSES" || 
               product.category === "CONTACT_LENSES" || 
               product.category === "ACCESSORIES" || 
               product.category === "NILL") 
              ? (product.category as SafeProduct["category"]) 
              : "EYEGLASSES",
    featured: Boolean(product.featured),
    createdAt:
      product.createdAt && (typeof product.createdAt === "string" || typeof product.createdAt === "number" || product.createdAt instanceof Date)
        ? new Date(product.createdAt).toISOString()
        : new Date().toISOString(),
  };
}

export function safeProductList(products: unknown): SafeProduct[] {
  if (!Array.isArray(products)) return [];
  return products.map((p) => safeProduct(p));
}
