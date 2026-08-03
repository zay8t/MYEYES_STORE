"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, Category, FrameShape, Material } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price: number;
  stock: number;
  frameShape: FrameShape;
  material: Material;
  gender: string;
  images: string[] | string;
  category: Category;
  featured?: boolean;
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function updatePaymentStatusAction(orderId: string, paymentStatus: string) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}

export async function updateProductStockAction(productId: string, newStock: number) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

export async function adjustStockDeltaAction(productId: string, delta: number) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Product not found" };

    const newStock = Math.max(0, product.stock + delta);
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error adjusting stock delta:", error);
    return { success: false, error: "Failed to adjust stock" };
  }
}

export async function createProductAction(input: ProductInput) {
  try {
    let formattedImages = "";
    if (Array.isArray(input.images)) {
      formattedImages = JSON.stringify(input.images.filter((img) => img.trim() !== ""));
    } else if (typeof input.images === "string") {
      if (input.images.startsWith("[")) {
        formattedImages = input.images;
      } else {
        const splitUrls = input.images
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);
        formattedImages = JSON.stringify(splitUrls);
      }
    }

    const slug =
      input.slug && input.slug.trim() !== ""
        ? input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        price: Number(input.price),
        stock: Number(input.stock),
        frameShape: input.frameShape,
        material: input.material,
        gender: input.gender,
        images: formattedImages,
        category: input.category,
        featured: input.featured ?? false,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProductAction(productId: string, input: Partial<ProductInput>) {
  try {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = Number(input.price);
    if (input.stock !== undefined) updateData.stock = Number(input.stock);
    if (input.frameShape !== undefined) updateData.frameShape = input.frameShape;
    if (input.material !== undefined) updateData.material = input.material;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.featured !== undefined) updateData.featured = input.featured;

    if (input.images !== undefined) {
      if (Array.isArray(input.images)) {
        updateData.images = JSON.stringify(input.images.filter((img) => img.trim() !== ""));
      } else if (typeof input.images === "string") {
        updateData.images = input.images;
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    // Delete associated OrderItem records first to avoid foreign key constraint errors
    await prisma.orderItem.deleteMany({
      where: { productId },
    });

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
