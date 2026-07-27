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
 */
export async function uploadToCloudinary(
  fileStr: string,
  folder: string = "myeyes_eyewear"
): Promise<{ secure_url: string; public_id: string }> {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder,
      resource_type: "auto",
    });
    return {
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error details:", error);
    throw new Error("Failed to upload image to Cloudinary CDN.");
  }
}

/**
 * Deletes a file from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary deletion error details:", error);
    return false;
  }
}
