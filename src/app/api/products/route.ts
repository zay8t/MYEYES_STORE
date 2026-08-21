import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category")?.trim().toUpperCase();
    const genderParam = searchParams.get("gender")?.trim();
    const slugParam = searchParams.get("slug")?.trim();

    // ── 1. Category filter normalization ──────────────────────────────────
    let categoryFilter: Category | undefined = undefined;
    if (categoryParam) {
      if (
        categoryParam.includes("EYEGLASS") ||
        categoryParam === "OPTICAL" ||
        categoryParam === "PRESCRIPTION"
      ) {
        categoryFilter = Category.EYEGLASSES;
      } else if (categoryParam.includes("SUN")) {
        categoryFilter = Category.SUNGLASSES;
      } else if (
        categoryParam === "CONTACT_LENSES" ||
        categoryParam === "ACCESSORIES" ||
        categoryParam === "NILL"
      ) {
        categoryFilter = categoryParam as Category;
      }
    }

    // ── 2. Build where clause ─────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    if (categoryFilter) {
      where.category = categoryFilter;
    }

    if (slugParam) {
      where.slug = slugParam;
    }

    if (genderParam) {
      const g = genderParam.toLowerCase();
      if (g === "men" || g === "women") {
        where.OR = [
          { gender: { equals: genderParam, mode: "insensitive" } },
          { gender: { equals: "Unisex", mode: "insensitive" } },
          { gender: { equals: "All", mode: "insensitive" } },
          { gender: null },
        ];
      } else if (g === "kids" || g === "juniors") {
        where.OR = [
          { gender: { equals: "Kids", mode: "insensitive" } },
          { gender: { equals: "Juniors", mode: "insensitive" } },
        ];
      }
    }

    // ── 3. Query Prisma Database Directly ─────────────────────────────────
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products || []);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json([]);
  }
}
