"use client";

import { useTransition, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface CatalogFilterState {
  gender: string[];
  shape: string[];
  fit: string[];
  material: string[];
  prescription: string[];
  color: string[];
  vibe: string[];
  minPrice: number;
  maxPrice: number;
  sort: string;
  search: string;
}

export const DEFAULT_MIN_PRICE = 0;
export const DEFAULT_MAX_PRICE = 100000;
export const DEFAULT_SORT = "featured";

export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse state from URL search params
  const filters: CatalogFilterState = useMemo(() => {
    const parseArray = (key: string): string[] => {
      const val = searchParams.get(key);
      if (!val) return [];
      return val
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    };

    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");

    const minPrice =
      minPriceRaw && !isNaN(Number(minPriceRaw))
        ? Math.max(0, Number(minPriceRaw))
        : DEFAULT_MIN_PRICE;

    const maxPrice =
      maxPriceRaw && !isNaN(Number(maxPriceRaw))
        ? Math.min(100000, Number(maxPriceRaw))
        : DEFAULT_MAX_PRICE;

    return {
      gender: parseArray("gender"),
      shape: parseArray("shape"),
      fit: parseArray("fit"),
      material: parseArray("material"),
      prescription: parseArray("prescription"),
      color: parseArray("color"),
      vibe: parseArray("vibe"),
      minPrice,
      maxPrice,
      sort: searchParams.get("sort") || DEFAULT_SORT,
      search: searchParams.get("search") || "",
    };
  }, [searchParams]);

  // Compute active filter count (excluding default sort and search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.gender.length;
    count += filters.shape.length;
    count += filters.fit.length;
    count += filters.material.length;
    count += filters.prescription.length;
    count += filters.color.length;
    count += filters.vibe.length;
    if (filters.minPrice > DEFAULT_MIN_PRICE || filters.maxPrice < DEFAULT_MAX_PRICE) {
      count += 1;
    }
    return count;
  }, [filters]);

  // Helper to push updated search params
  const updateUrl = useCallback(
    (newParams: URLSearchParams) => {
      startTransition(() => {
        const queryString = newParams.toString();
        const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
        router.push(targetUrl, { scroll: false });
      });
    },
    [pathname, router]
  );

  // Toggle a single value in a multi-select filter key
  const toggleFilter = useCallback(
    (key: keyof Omit<CatalogFilterState, "minPrice" | "maxPrice" | "sort" | "search">, value: string) => {
      const normalizedValue = value.trim().toLowerCase();
      const currentValues = filters[key];
      const nextValues = currentValues.includes(normalizedValue)
        ? currentValues.filter((v) => v !== normalizedValue)
        : [...currentValues, normalizedValue];

      const params = new URLSearchParams(searchParams.toString());
      if (nextValues.length > 0) {
        params.set(key, nextValues.join(","));
      } else {
        params.delete(key);
      }
      updateUrl(params);
    },
    [filters, searchParams, updateUrl]
  );

  // Set entire array for a key
  const setFilter = useCallback(
    (key: keyof Omit<CatalogFilterState, "minPrice" | "maxPrice" | "sort" | "search">, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      const cleanValues = values.map((v) => v.trim().toLowerCase()).filter(Boolean);
      if (cleanValues.length > 0) {
        params.set(key, cleanValues.join(","));
      } else {
        params.delete(key);
      }
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  // Set price range
  const setPriceRange = useCallback(
    (min: number, max: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (min > DEFAULT_MIN_PRICE) {
        params.set("minPrice", min.toString());
      } else {
        params.delete("minPrice");
      }

      if (max < DEFAULT_MAX_PRICE) {
        params.set("maxPrice", max.toString());
      } else {
        params.delete("maxPrice");
      }
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  // Set sort
  const setSort = useCallback(
    (sortValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sortValue && sortValue !== DEFAULT_SORT) {
        params.set("sort", sortValue);
      } else {
        params.delete("sort");
      }
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  // Remove specific filter value
  const removeFilterValue = useCallback(
    (key: keyof Omit<CatalogFilterState, "minPrice" | "maxPrice" | "sort" | "search">, value: string) => {
      const normalizedValue = value.trim().toLowerCase();
      const currentValues = filters[key];
      const nextValues = currentValues.filter((v) => v !== normalizedValue);

      const params = new URLSearchParams(searchParams.toString());
      if (nextValues.length > 0) {
        params.set(key, nextValues.join(","));
      } else {
        params.delete(key);
      }
      updateUrl(params);
    },
    [filters, searchParams, updateUrl]
  );

  // Clear entire filter key
  const clearFilterKey = useCallback(
    (key: keyof CatalogFilterState) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "minPrice" || key === "maxPrice") {
        params.delete("minPrice");
        params.delete("maxPrice");
      } else {
        params.delete(key);
      }
      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  // Reset all filters except category
  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    const cat = searchParams.get("category");
    if (cat) params.set("category", cat);
    updateUrl(params);
  }, [searchParams, updateUrl]);

  return {
    filters,
    isPending,
    activeFilterCount,
    toggleFilter,
    setFilter,
    setPriceRange,
    setSort,
    removeFilterValue,
    clearFilterKey,
    resetFilters,
  };
}
