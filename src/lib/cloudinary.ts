import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Uploads a file to Cloudinary.
 * Accepts a base64 data URI or a local file path.
 * If Cloudinary is not configured or the upload fails, it falls back to the original string.
 */
export async function uploadToCloudinary(
  fileStr: string,
  folder: string = "myeyes/frames",
  tags?: string[]
): Promise<{ secure_url: string; public_id: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !apiKey || !apiSecret || apiSecret === "**********" || apiSecret.trim() === "") {
    console.warn("Cloudinary credentials not fully configured. Using fallback base64 string.");
    return {
      secure_url: fileStr,
      public_id: "fallback_base64_" + Date.now(),
    };
  }

  try {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: "auto",
      quality: "auto:best",
      fetch_format: "auto",
      flags: "preserve_transparency",
    };
    if (tags && tags.length > 0) {
      uploadOptions.tags = tags;
    }
    if (uploadPreset) {
      uploadOptions.upload_preset = uploadPreset;
    }

    const uploadResponse = await cloudinary.uploader.upload(fileStr, uploadOptions);
    return {
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to base64: Details:", error);
    return {
      secure_url: fileStr,
      public_id: "fallback_failed_" + Date.now(),
    };
  }
}

/**
 * Extracts the Cloudinary public_id from a full Cloudinary URL.
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;
    const pathAfterUpload = url.substring(uploadIndex + 8);
    const parts = pathAfterUpload.split("/");
    const cleanParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip version tag (e.g. v1712345678)
      if (part.startsWith("v") && /^\d+$/.test(part.substring(1))) {
        continue;
      }
      // Skip transformation segments (e.g. f_auto,q_auto, w_800, etc.)
      if (
        part.includes(",") ||
        (part.includes("_") &&
          (part.startsWith("f_") ||
            part.startsWith("q_") ||
            part.startsWith("c_") ||
            part.startsWith("w_") ||
            part.startsWith("h_") ||
            part.startsWith("b_") ||
            part.startsWith("dpr_")))
      ) {
        continue;
      }
      cleanParts.push(part);
    }

    const fullPath = cleanParts.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  } catch (err) {
    console.error("Error extracting public ID from URL:", err);
    return null;
  }
}

/**
 * Deletes a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("Cloudinary deletion error details:", error);
    return false;
  }
}
