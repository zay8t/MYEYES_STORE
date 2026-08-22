import { resolveTryOnImageUrl, ProductImageInput } from "@/lib/ar/textureLoader";

/**
 * Product Image Helper
 * Identifies and extracts front-facing product cutouts for 2D/3D AR Try-On mapping.
 */
export function getFrontFacingProductImage(product: ProductImageInput | null | undefined): string {
  return resolveTryOnImageUrl(product);
}
