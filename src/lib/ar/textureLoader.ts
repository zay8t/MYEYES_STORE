import * as THREE from "three";

export interface LoadedFrameTextureResult {
  texture: THREE.CanvasTexture | THREE.Texture;
  aspectRatio: number;
  width: number;
  height: number;
}

/**
 * Loads a product frame image onto an offscreen canvas, applies chroma-key background
 * removal (converting white/near-white studio backdrops to full alpha transparency),
 * and returns a Three.js CanvasTexture ready for AR projection.
 */
export async function loadTransparentFrameTexture(
  imageUrl: string
): Promise<LoadedFrameTextureResult> {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      return reject(new Error("Image URL is required for texture loading"));
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 512;
        const height = img.naturalHeight || img.height || 256;
        const aspectRatio = width / Math.max(height, 1);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          // Fallback to standard Three.js texture if canvas 2D context fails
          const fallbackTex = new THREE.Texture(img);
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          fallbackTex.needsUpdate = true;
          return resolve({
            texture: fallbackTex,
            aspectRatio,
            width,
            height,
          });
        }

        ctx.drawImage(img, 0, 0, width, height);

        let imgData: ImageData;
        try {
          imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Chroma-key background removal:
          // Convert near-white and studio background pixels (RGB > 235) to transparent
          // With subtle edge feathering for smooth frame boundaries
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // If already fully transparent, skip
            if (a === 0) continue;

            // Strict white & near-white studio backdrop
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Alpha = 0 (Transparent)
            } else if (r > 225 && g > 225 && b > 225) {
              // Smooth boundary transition
              const brightness = (r + g + b) / 3;
              const alphaRatio = Math.max(0, (240 - brightness) / 15);
              data[i + 3] = Math.round(a * alphaRatio);
            }
          }

          ctx.putImageData(imgData, 0, 0);
        } catch (securityErr) {
          // If tainted canvas due to cross-origin security, proceed with drawn canvas image
          console.warn("Chroma-key pixel access restricted by CORS; using raw canvas:", securityErr);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;

        resolve({
          texture,
          aspectRatio,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      // Fallback: try loading with standard Three.js TextureLoader
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        imageUrl,
        (fallbackTexture) => {
          fallbackTexture.colorSpace = THREE.SRGBColorSpace;
          fallbackTexture.minFilter = THREE.LinearFilter;
          fallbackTexture.magFilter = THREE.LinearFilter;
          fallbackTexture.needsUpdate = true;
          resolve({
            texture: fallbackTexture,
            aspectRatio: 2.4, // standard eyewear aspect ratio
            width: 512,
            height: 213,
          });
        },
        undefined,
        (fallbackErr) => reject(fallbackErr || err)
      );
    };

    img.src = imageUrl;
  });
}
