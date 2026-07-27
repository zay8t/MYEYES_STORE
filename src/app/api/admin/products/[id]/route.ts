import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// UPDATE a product (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { image_public_id: true, images: true }
    });

    const updateData: Record<string, unknown> = {};
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock, 10);
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.frameShape !== undefined) updateData.frameShape = body.frameShape;
    if (body.material !== undefined) updateData.material = body.material;
    if (body.gender !== undefined) updateData.gender = body.gender;
    
    if (body.images !== undefined) {
      const imageList: string[] = Array.isArray(body.images)
        ? body.images.filter((img: string) => img.trim() !== "")
        : typeof body.images === "string" && body.images.startsWith("[")
          ? JSON.parse(body.images)
          : typeof body.images === "string"
            ? body.images.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

      const uploadedUrls: string[] = [];
      let firstPublicId: string | null = null;
      let firstUrl: string | null = null;

      for (const img of imageList) {
        if (img.startsWith("data:image/")) {
          const uploadRes = await uploadToCloudinary(img);
          uploadedUrls.push(uploadRes.secure_url);
          if (!firstPublicId) {
            firstPublicId = uploadRes.public_id;
            firstUrl = uploadRes.secure_url;
          }
        } else {
          uploadedUrls.push(img);
          if (!firstUrl && img.startsWith("http")) {
            firstUrl = img;
          }
        }
      }

      updateData.images = JSON.stringify(uploadedUrls);
      updateData.image_url = firstUrl || (uploadedUrls[0] || null);
      if (firstPublicId) {
        updateData.image_public_id = firstPublicId;

        // Delete the old main image if it was replaced
        if (currentProduct?.image_public_id && currentProduct.image_public_id !== firstPublicId) {
          await deleteFromCloudinary(currentProduct.image_public_id);
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/kids");

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch product to retrieve Cloudinary image public ID
    const product = await prisma.product.findUnique({
      where: { id },
      select: { image_public_id: true }
    });

    if (product?.image_public_id) {
      await deleteFromCloudinary(product.image_public_id);
    }

    // Delete associated OrderItem records first to avoid foreign key constraint errors
    await prisma.orderItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/kids");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
