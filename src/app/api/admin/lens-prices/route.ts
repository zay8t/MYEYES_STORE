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
          price: lens.basePrice,
          type: lens.category,
          index: lens.index,
          description: lens.description,
        })),
      });
    }

    const lensOptions = await prisma.lensOption.findMany({
      orderBy: { type: "asc" },
    });

    // Map Prisma fields back to the SolexLensOption shape expected by the frontend
    const mapped = lensOptions.map((lens) => {
      // Find the matching static option to pull coating (not stored in DB)
      const staticMatch = SOLEX_LENS_OPTIONS.find((s) => s.id === lens.id);
      return {
        id: lens.id,
        name: lens.name,
        basePrice: lens.price,
        category: lens.type ?? staticMatch?.category ?? "single_vision",
        index: lens.index ?? staticMatch?.index ?? "1.56",
        description: lens.description ?? staticMatch?.description ?? "",
        coating: staticMatch?.coating ?? "Standard",
      };
    });

    return NextResponse.json(mapped);
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
      data: { price: parseFloat(basePrice) },
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
