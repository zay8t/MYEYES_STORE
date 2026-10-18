/**
 * Watermark Utility for myeyes.pk
 * 
 * Injects a permanent "myeyes.pk" watermark into Cloudinary delivery URLs.
 * Pure string transformation — completely safe for both Client and Server components.
 */

export type WatermarkSize = "sm" | "md" | "lg";

/**
 * Injects a "myeyes.pk" text-overlay watermark into any Cloudinary delivery URL.
 *
 * The watermark is composed of:
 *   1. "myeyes.pk" white bold text with opacity.
 *   2. Positioned at the bottom-right corner with balanced padding.
 *
 * Because the transformation is embedded in the Cloudinary CDN URL, the branding is
 * permanently baked into the image pixels served — it survives right-click -> Save As,
 * developer-tools network downloads, and screenshots.
 *
 * Non-Cloudinary URLs (local paths, placeholders, base64) are returned unchanged.
 *
 * @param url   - Original image URL
 * @param size  - 'sm' for catalog cards, 'md' for drawers/modals, 'lg' for PDP gallery (default: 'sm')
 * @returns     - Watermarked Cloudinary URL (or original URL if non-Cloudinary)
 */
export function applyWatermark(url: string, size: WatermarkSize = "sm"): string {
  if (
    !url ||
    typeof url !== "string" ||
    !url.includes("cloudinary.com") ||
    !url.includes("/upload/")
  ) {
    return url;
  }

  try {
    const uploadIdx = url.indexOf("/upload/");
    const base = url.substring(0, uploadIdx + 8); // everything up to and including "/upload/"
    const rest = url.substring(uploadIdx + 8);    // version + public_id + extension

    // Remove any existing watermark transforms to avoid stacking on re-renders
    const cleanRest = rest.replace(
      /l_text:[^/]+\/[^/]+\/co_[^/]+\/[^/]+\/fl_layer_apply[^/]*\//g,
      ""
    );

    // Responsive sizing: smaller font on catalog cards, larger on PDP gallery
    const fontSize = size === "lg" ? 22 : size === "md" ? 16 : 13;
    const paddingY = size === "lg" ? 14 : size === "md" ? 10 : 8;
    const padX = size === "lg" ? 18 : size === "md" ? 14 : 10;

    // "myeyes.pk" white bold text, bottom-right corner, soft shadow / high contrast
    const textTag = "myeyes.pk";
    const fontSpec = `Arial_${fontSize}_bold`;
    const textLayer = `l_text:${fontSpec}:${encodeURIComponent(
      textTag
    )},co_white,o_80,g_south_east,x_${padX},y_${paddingY}/fl_layer_apply/`;

    return `${base}${textLayer}${cleanRest}`;
  } catch {
    return url;
  }
}
