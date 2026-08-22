import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET all products (optionally filtered by category)
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

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
  const session = await requireAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      stock,
      images,
      colors,
      featured,
      category,
      frameShape,
      material,
      gender,
      modelGlbUrl,
    } = body;

    if (!name || !price || !description) {
      return NextResponse.json(
        { error: "Name, price, and description are required fields." },
        { status: 400 }
      );
    }

    // Handle array or comma-separated string for multi-image
    const imageList: string[] = Array.isArray(images)
      ? images.filter((img: string) => img.trim() !== "")
      : typeof images === "string" && images.startsWith("[")
        ? JSON.parse(images)
        : typeof images === "string"
          ? images.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

    const uploadedUrls: string[] = [];
    let firstPublicId: string | null = null;
    let firstUrl: string | null = null;

    for (const img of imageList) {
      if (img.startsWith("data:image/")) {
        const uploadRes = await uploadToCloudinary(img, "myeyes/frames");
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

    const formattedImages = JSON.stringify(uploadedUrls);

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      return NextResponse.json(
        { error: "Invalid price value provided." },
        { status: 400 }
      );
    }

    const stockNum = parseInt(stock, 10);
    const finalStock = isNaN(stockNum) ? 0 : stockNum;

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        price: priceNum,
        stock: finalStock,
        frameShape: frameShape || "NILL",
        material: material || "NILL",
        gender: gender || "Unspecified",
        colors: Array.isArray(colors) ? colors : [],
        images: formattedImages,
        featured: featured ?? false,
        category: category || "EYEGLASSES",
        image_url: firstUrl || (uploadedUrls[0] || null),
        image_public_id: firstPublicId || null,
        modelGlbUrl: modelGlbUrl || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/products");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/kids");

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create product:", error);
    const msg = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
