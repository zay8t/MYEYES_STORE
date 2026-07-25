import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SOLEX_LENS_OPTIONS } from "@/lib/solex-lens-pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const count = await prisma.lensOption.count();
    if (count === 0) {
      // Seed initial lens options list from static constant
      await prisma.lensOption.createMany({
        data: SOLEX_LENS_OPTIONS.map((lens) => ({
          id: lens.id,
          name: lens.name,
          coating: lens.coating,
          index: lens.index,
          description: lens.description,
          category: lens.category,
          basePrice: lens.basePrice,
        })),
      });
    }

    const lensOptions = await prisma.lensOption.findMany({
      orderBy: { category: "asc" },
    });

    return NextResponse.json(lensOptions);
  } catch (error) {
    console.error("Failed to fetch lens options:", error);
    return NextResponse.json(
      { error: "Failed to fetch lens options" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, basePrice } = body;

    if (!id || basePrice === undefined) {
      return NextResponse.json(
        { error: "ID and basePrice are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.lensOption.update({
      where: { id },
      data: { basePrice: parseFloat(basePrice) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update lens option price:", error);
    return NextResponse.json(
      { error: "Failed to update lens option price" },
      { status: 500 }
    );
  }
}
