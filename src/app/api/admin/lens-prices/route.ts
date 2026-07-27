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
          pricePlus40: lens.pricePlus40 ?? (lens.basePrice + 400),
          type: lens.category,
          index: lens.index,
          description: lens.description,
          isConfiguratorVisible: !["bifocal-round-top", "bifocal-flat-top", "sv-159-pc", "sv-156-hmc"].includes(lens.id),
        })),
      });
    }

    const lensOptions = await prisma.lensOption.findMany({
      orderBy: { type: "asc" },
    });

    // Map Prisma fields back to the SolexLensOption shape expected by the frontend
    const mapped = lensOptions.map((lens) => {
      const staticMatch = SOLEX_LENS_OPTIONS.find((s) => s.id === lens.id);
      return {
        id: lens.id,
        name: lens.name,
        basePrice: lens.price,
        pricePlus40: lens.pricePlus40 && lens.pricePlus40 > 0 ? lens.pricePlus40 : lens.price + 400,
        category: lens.type ?? staticMatch?.category ?? "single_vision",
        index: lens.index ?? staticMatch?.index ?? "1.56",
        description: lens.description ?? staticMatch?.description ?? "",
        coating: staticMatch?.coating ?? "Standard",
        isConfiguratorVisible: lens.isConfiguratorVisible,
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
    const { id, basePrice, pricePlus40 } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const updateData: { price?: number; pricePlus40?: number } = {};
    if (basePrice !== undefined && basePrice !== null) {
      updateData.price = parseFloat(basePrice);
    }
    if (pricePlus40 !== undefined && pricePlus40 !== null) {
      updateData.pricePlus40 = parseFloat(pricePlus40);
    }

    const updated = await prisma.lensOption.update({
      where: { id },
      data: updateData,
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
