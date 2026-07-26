import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET all products (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (category === "EYEGLASSES" || category === "SUNGLASSES") {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// CREATE a new product with multi-image array stringified in `images`
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      stock,
      frameShape,
      material,
      gender,
      images,
      featured,
      category,
    } = body;

    // Handle array or comma-separated string for multi-image
    let formattedImages = "";
    if (Array.isArray(images)) {
      formattedImages = JSON.stringify(images.filter((img: string) => img.trim() !== ""));
    } else if (typeof images === "string") {
      if (images.startsWith("[")) {
        formattedImages = images;
      } else {
        const splitUrls = images
          .split(",")
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0);
        formattedImages = JSON.stringify(splitUrls);
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        frameShape: frameShape || "NILL",
        material: material || "NILL",
        gender: gender || "Unspecified",
        images: formattedImages,
        featured: featured ?? false,
        category: category || "EYEGLASSES",
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
