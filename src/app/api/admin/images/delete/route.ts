import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary, getPublicIdFromUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, publicId, imageUrl } = body;

    if (!publicId && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Either publicId or imageUrl is required." },
        { status: 400 }
      );
    }

    // Determine publicId for Cloudinary deletion
    const targetPublicId = publicId || (imageUrl ? getPublicIdFromUrl(imageUrl) : null);
    let cloudinaryDeleted = false;

    if (targetPublicId) {
      cloudinaryDeleted = await deleteFromCloudinary(targetPublicId);
    }

    let remainingImages: string[] = [];

    // If productId is provided, update product record in database
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (product) {
        // Parse current images
        let currentImages: string[] = [];
        if (product.images) {
          if (product.images.startsWith("[")) {
            try {
              currentImages = JSON.parse(product.images);
            } catch {
              currentImages = [];
            }
          } else {
            currentImages = product.images.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }

        // Filter out the image
        remainingImages = currentImages.filter((img) => {
          if (imageUrl && img === imageUrl) return false;
          if (targetPublicId) {
            const imgPid = getPublicIdFromUrl(img);
            if (imgPid === targetPublicId) return false;
          }
          return true;
        });

        const newFirstImage = remainingImages.length > 0 ? remainingImages[0] : null;
        const newFirstPublicId = newFirstImage ? getPublicIdFromUrl(newFirstImage) : null;

        await prisma.product.update({
          where: { id: productId },
          data: {
            images: JSON.stringify(remainingImages),
            image_url: newFirstImage,
            image_public_id: newFirstPublicId,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      cloudinaryDeleted,
      publicId: targetPublicId,
      remainingImages,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    const message = error instanceof Error ? error.message : "Failed to delete image";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
