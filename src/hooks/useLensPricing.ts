"use client";

import { useState, useEffect, useCallback } from "react";
import { LENS_PACKAGES, LensPackageDefinition } from "@/lib/prescription-pricing";
import { DEFAULT_BASE_PRICES, BasePriceConfig } from "@/lib/pricingEngine";

export interface LensPricingTier {
  id: string;
  code: "B1" | "B2" | "B3" | "B4" | "B5";
  name: string;
  cleanName: string;
  standardBasePrice: number;
  presbyopiaBasePrice: number;
  index: string;
  indexNumber: number;
  badge: string;
  description: string;
  idealRange: string;
  abbeValue: string;
  reductionTag: string;
  coating: string;
}

export interface UseLensPricingReturn {
  packages: LensPricingTier[];
  basePrices: BasePriceConfig;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStartingPrice: (codeOrId: string, isProgressive?: boolean) => number;
  getPackage: (codeOrId: string) => LensPricingTier | undefined;
}

const DEFAULT_TIERS: LensPricingTier[] = LENS_PACKAGES.map((pkg) => ({
  id: pkg.id,
  code: pkg.baseKey,
  name: pkg.name,
  cleanName: pkg.name,
  standardBasePrice: pkg.standardBasePrice,
  presbyopiaBasePrice: pkg.presbyopiaBasePrice,
  index: pkg.index,
  indexNumber: pkg.indexNumber,
  badge: pkg.badge,
  description: pkg.description,
  idealRange: pkg.idealRange,
  abbeValue: pkg.abbeValue,
  reductionTag: pkg.reductionTag,
  coating: pkg.coating,
}));

export function useLensPricing(): UseLensPricingReturn {
  const [packages, setPackages] = useState<LensPricingTier[]>(DEFAULT_TIERS);
  const [basePrices, setBasePrices] = useState<BasePriceConfig>(DEFAULT_BASE_PRICES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/lens-pricing", {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch live lens pricing: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.packages) && data.packages.length > 0) {
        setPackages(data.packages);
      }
      if (data && data.basePrices) {
        setBasePrices(data.basePrices);
      }
    } catch (err: any) {
      console.warn("useLensPricing network fallback:", err);
      setError(err?.message || "Failed to load dynamic pricing");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getPackage = useCallback(
    (codeOrId: string): LensPricingTier | undefined => {
      return packages.find((p) => p.code === codeOrId || p.id === codeOrId);
    },
    [packages]
  );

  const getStartingPrice = useCallback(
    (codeOrId: string, isProgressive: boolean = false): number => {
      const pkg = packages.find((p) => p.code === codeOrId || p.id === codeOrId);
      if (!pkg) {
        const fallback = DEFAULT_TIERS.find((p) => p.code === codeOrId || p.id === codeOrId);
        if (!fallback) return 0;
        return isProgressive ? fallback.presbyopiaBasePrice : fallback.standardBasePrice;
      }
      return isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
    },
    [packages]
  );

  return {
    packages,
    basePrices,
    isLoading,
    error,
    refresh,
    getStartingPrice,
    getPackage,
  };
}

export default useLensPricing;
