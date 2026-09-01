import type { Metadata } from "next";
import DiscountsClient from "@/components/admin/DiscountsClient";

export const metadata: Metadata = {
  title: "Discounts & Offers | MY EYES Admin",
  description: "Manage promo codes and announcement banners for the MY EYES storefront.",
};

export default function AdminDiscountsPage() {
  return <DiscountsClient />;
}
