/**
 * Product Image Helper
 * Identifies and extracts front-facing product cutouts for 2D/3D AR Try-On mapping.
 */

export function getFrontFacingProductImage(product: {
  images?: string[] | string | null;
  frontImage?: string | null;
  imageUrl?: string | null;
}): string {
  // 1. Explicit front image field
  if (product.frontImage && typeof product.frontImage === "string" && product.frontImage.trim()) {
    return product.frontImage.trim();
  }

  // 2. Parse images array, JSON array, or comma-separated string
  let images: string[] = [];

  if (Array.isArray(product.images)) {
    images = product.images.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
  } else if (typeof product.images === "string" && product.images.trim()) {
    const raw = product.images.trim();
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          images = parsed.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
        }
      } catch {
        images = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      images = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  // Sanitize: filter out logo or invalid placeholders if other images exist
  const validImages = images
    .map((img) => img.trim())
    .filter((img) => img && img !== "/logo.png" && img !== "/logo.svg");

  if (validImages.length > 0) {
    // 3. Match frontal keywords in file names or URLs
    const frontCandidate = validImages.find((url) =>
      /(front|main|primary|cutout|face_on|angle_0|thumb|preview|transparent)/i.test(url)
    );

    if (frontCandidate) return frontCandidate;

    // 4. Default to first valid image
    return validImages[0];
  }

  // 5. Fallback to product.imageUrl or default asset
  if (product.imageUrl && typeof product.imageUrl === "string" && product.imageUrl.trim()) {
    return product.imageUrl.trim();
  }

  return "/placeholder-frame.png";
}
