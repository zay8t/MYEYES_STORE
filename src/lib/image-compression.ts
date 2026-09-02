/**
 * Client-Side Image Compression & Resizing Utility
 * Clamps max dimension to 1600px and exports JPEG at 0.82 quality.
 * Keeps payloads under 1.5MB to resolve mobile camera timeout and 413 payload errors.
 */
export async function compressPrescriptionImage(file: File): Promise<File> {
  // If PDF or non-image, return file as-is
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const MAX_DIM = 1600;
            let { width, height } = img;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              resolve(file);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }
                const cleanName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                const compressedFile = new File([blob], cleanName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              "image/jpeg",
              0.82
            );
          } catch {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}
