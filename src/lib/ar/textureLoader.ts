import * as THREE from "three";

export interface ProductImageInput {
  images?: string[] | string | null;
  frontImage?: string | null;
  imageUrl?: string | null;
}

/**
 * Resolves the cleanest front-facing eyewear frame image, filtering out
 * accessories, cases, packaging, covers, and lifestyle photos.
 */
export function resolveTryOnImageUrl(product: ProductImageInput | null | undefined): string {
  if (!product) return "/placeholder-glasses.png";

  // 1. Prioritize explicit front image or cutout
  if (product.frontImage && typeof product.frontImage === "string" && product.frontImage.trim()) {
    return product.frontImage.trim();
  }

  // 2. Parse images array or string
  let list: string[] = [];
  if (Array.isArray(product.images)) {
    list = product.images.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
  } else if (typeof product.images === "string" && product.images.trim()) {
    const raw = product.images.trim();
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
        }
      } catch {
        list = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  // Filter out cases, packaging, boxes, covers, logos
  const sanitizedList = list.filter((url) => {
    const isExcluded = /(case|box|pack|cover|lifestyle|logo\.png|logo\.svg)/i.test(url);
    return !isExcluded && url.trim().length > 0;
  });

  // Check for frontal keywords first
  const frontal = sanitizedList.find((url) =>
    /(front|cutout|face_on|angle_0|thumb|glasses|frame)/i.test(url)
  );
  if (frontal) return frontal;

  if (sanitizedList.length > 0) return sanitizedList[0];
  if (list.length > 0) return list[0];
  if (product.imageUrl && typeof product.imageUrl === "string" && product.imageUrl.trim()) {
    return product.imageUrl.trim();
  }

  return "/placeholder-glasses.png";
}

/**
 * Loads a frame texture using Three.js TextureLoader with CORS support,
 * with off-screen canvas chroma-key enhancement and automatic fallback.
 */
export function loadFrameTexture(
  url: string,
  onLoaded: (texture: THREE.Texture, aspectRatio: number) => void
): void {
  if (!url) {
    url = "/placeholder-glasses.png";
  }

  // Attempt 1: Try HTML5 Canvas with chroma-key for studio white-background removal
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    try {
      const width = img.naturalWidth || img.width || 512;
      const height = img.naturalHeight || img.height || 240;
      const aspectRatio = width / Math.max(height, 1);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Chroma-key: Remove solid white / studio background pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            if (r > 242 && g > 242 && b > 242) {
              data[i + 3] = 0;
            } else if (r > 225 && g > 225 && b > 225) {
              const brightness = (r + g + b) / 3;
              data[i + 3] = Math.round(a * Math.max(0, (242 - brightness) / 17));
            }
          }
          ctx.putImageData(imgData, 0, 0);

          const canvasTexture = new THREE.CanvasTexture(canvas);
          canvasTexture.colorSpace = THREE.SRGBColorSpace;
          canvasTexture.minFilter = THREE.LinearFilter;
          canvasTexture.magFilter = THREE.LinearFilter;
          canvasTexture.generateMipmaps = false;
          canvasTexture.needsUpdate = true;

          onLoaded(canvasTexture, aspectRatio);
          return;
        } catch {
          // CORS security limitation with pixel reading; proceed with direct image texture
        }
      }
    } catch {
      // Ignore canvas errors and fall through to direct loader
    }

    // Direct image texture fallback
    const directTex = new THREE.Texture(img);
    directTex.colorSpace = THREE.SRGBColorSpace;
    directTex.minFilter = THREE.LinearFilter;
    directTex.magFilter = THREE.LinearFilter;
    directTex.needsUpdate = true;
    const aspect = (img.naturalWidth || 512) / (img.naturalHeight || 240);
    onLoaded(directTex, aspect);
  };

  img.onerror = () => {
    // Attempt 2: Fallback to Three.js TextureLoader
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        const imgEl = tex.image as HTMLImageElement | undefined;
        const aspect = imgEl && imgEl.width && imgEl.height ? imgEl.width / imgEl.height : 2.3;
        onLoaded(tex, aspect);
      },
      undefined,
      (err) => {
        console.warn("Direct texture load failed for:", url, err);
      }
    );
  };

  img.src = url;
}
