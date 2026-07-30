import React from "react";
import { prisma } from "@/lib/prisma";
import { SOLEX_LENS_OPTIONS, CORE_FIVE_LENS_IDS } from "@/lib/solex-lens-pricing";
import LensPricingClient from "./LensPricingClient";

export const revalidate = 0;

const CORE_SET = new Set<string>(CORE_FIVE_LENS_IDS);

export default async function AdminLensPricingPage() {
  let lensOptions: {
    id: string;
    name: string;
    price: number;
    pricePlus40: number;
    type: string;
    index: string | null;
    description: string;
    isConfiguratorVisible: boolean;
  }[] = [];

  try {
    const count = await prisma.lensOption.count();
    if (count === 0) {
      await prisma.lensOption.createMany({
        data: SOLEX_LENS_OPTIONS.map(lens => ({
          id: lens.id,
          name: lens.name,
          price: lens.basePrice,
          pricePlus40: lens.pricePlus40 ?? (lens.basePrice + 400),
          type: lens.category,
          index: lens.index,
          description: lens.description,
          isConfiguratorVisible: CORE_SET.has(lens.id),
        })),
      });
    }

    const dbOptions = await prisma.lensOption.findMany({
      orderBy: [{ type: "asc" }, { price: "asc" }],
      select: {
        id: true,
        name: true,
        price: true,
        pricePlus40: true,
        type: true,
        index: true,
        description: true,
        isConfiguratorVisible: true
      },
    });

    lensOptions = dbOptions.map(l => {
      const staticMatch = SOLEX_LENS_OPTIONS.find(s => s.id === l.id);
      return {
        ...l,
        name: l.name || staticMatch?.name || "",
        description: l.description || staticMatch?.description || "",
        isConfiguratorVisible: CORE_SET.has(l.id),
      };
    });
  } catch (error) {
    console.error("Lens pricing page DB error:", error);
  }

  return <LensPricingClient initialOptions={lensOptions} />;
}
