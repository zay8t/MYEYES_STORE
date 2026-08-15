/**
 * Compresses/formats an image file using HTML5 Canvas in the browser with high-fidelity settings.
 * Preserves high resolution up to 2400px width/height and maintains high-DPI quality (0.92-0.95).
 */
export function compressImage(
  file: File,
  maxWidth = 2400,
  maxHeight = 2400,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("compressImage can only be executed in a client-side browser environment."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio without downscaling unless larger than bounds
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context."));
          return;
        }

        // Enable high-quality image smoothing for Retina displays
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as high-quality WebP / JPEG / PNG
        const targetMime = file.type === "image/png" ? "image/png" : "image/webp";
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL(targetMime, quality);
          // If browser didn't support webp, fallback to jpeg
          if (!dataUrl.startsWith(`data:${targetMime}`)) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
        } catch {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
