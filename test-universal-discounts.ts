/**
 * test-universal-discounts.ts
 * Validation of universal discount engine, getCardPricing helper, badges, and dual pricing sitewide.
 * Run: npx tsx test-universal-discounts.ts
 */

import { getCardPricing, calculateDiscountAmount } from "./src/lib/pricing/discountEngine";
import type { ActivePromotion } from "./src/types/discounts";

let passed = 0;
let failed = 0;

function ok(label: string) { console.log(`  ✓ ${label}`); passed++; }
function fail(label: string, reason: string) { console.error(`  ✗ FAIL: ${label} — ${reason}`); failed++; }

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  MY EYES — Universal Discount & Dual Pricing Engine Tests    ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// ── 1. Percentage Discounts ──────────────────────────────────────────────────
console.log("── 1. Percentage Campaign (20% OFF) ─────────────────────────────");
const percentagePromo: ActivePromotion = {
  id: "promo-1",
  code: "SUMMER20",
  title: "Summer Sale",
  type: "percentage",
  amount: 20,
  isActive: true,
  showProductBadge: true,
  badgeLabel: "20% OFF",
  badgeType: "percentage",
};

const res1 = getCardPricing(3500, percentagePromo);
if (res1.finalPrice === 2800 && res1.originalPrice === 3500 && res1.hasDiscount) {
  ok("20% off Rs. 3,500 calculates to Rs. 2,800 final price with Rs. 3,500 original price");
} else {
  fail("20% percentage discount calculation", `Got final: ${res1.finalPrice}, orig: ${res1.originalPrice}`);
}

if (res1.badgeText === "20% OFF") {
  ok("Badge label displays '20% OFF'");
} else {
  fail("Badge text", `Got ${res1.badgeText}`);
}

if (res1.formattedFinalPrice === "Rs. 2,800/-" && res1.formattedOriginalPrice === "Rs. 3,500/-") {
  ok("Formatted prices match standard store currency format (Rs. 2,800/- / Rs. 3,500/-)");
} else {
  fail("Formatted prices", `${res1.formattedFinalPrice} / ${res1.formattedOriginalPrice}`);
}

// ── 2. Fixed Amount Discounts ────────────────────────────────────────────────
console.log("\n── 2. Fixed Amount Campaign (Rs. 500 OFF) ───────────────────────");
const fixedPromo: ActivePromotion = {
  id: "promo-2",
  code: "FLAT500",
  title: "Flat Discount",
  type: "fixed_cart",
  amount: 500,
  isActive: true,
  showProductBadge: true,
  badgeLabel: "SAVE Rs. 500",
  badgeType: "fixed_cart",
};

const res2 = getCardPricing(2500, fixedPromo);
if (res2.finalPrice === 2000 && res2.originalPrice === 2500 && res2.hasDiscount) {
  ok("Rs. 500 off Rs. 2,500 calculates to Rs. 2,000 final price");
} else {
  fail("Fixed discount calculation", `Got final: ${res2.finalPrice}`);
}

if (res2.badgeText === "SAVE Rs. 500") {
  ok("Badge label displays 'SAVE Rs. 500'");
} else {
  fail("Badge text", `Got ${res2.badgeText}`);
}

// ── 3. Custom Badge Override ─────────────────────────────────────────────────
console.log("\n── 3. Custom Badge Override ─────────────────────────────────────");
const customPromo: ActivePromotion = {
  id: "promo-3",
  code: "EID2026",
  title: "Eid Mega Sale",
  type: "percentage",
  amount: 25,
  isActive: true,
  showProductBadge: true,
  badgeLabel: "EID SPECIAL",
  badgeType: "custom",
};

const res3 = getCardPricing(4000, customPromo);
if (res3.finalPrice === 3000 && res3.badgeText === "EID SPECIAL") {
  ok("Custom badge label 'EID SPECIAL' is preserved with 25% discount (Rs. 3,000)");
} else {
  fail("Custom badge override", `Got final: ${res3.finalPrice}, badge: ${res3.badgeText}`);
}

// ── 4. Inactive Campaign & Disabled Badge Toggle ──────────────────────────────
console.log("\n── 4. Admin Toggle / Inactive State ─────────────────────────────");
const inactivePromo: ActivePromotion = {
  ...percentagePromo,
  isActive: false,
};

const res4 = getCardPricing(3500, inactivePromo);
if (res4.finalPrice === 3500 && res4.originalPrice === null && res4.badgeText === null && !res4.hasDiscount) {
  ok("When campaign isActive=false, price remains baseline Rs. 3,500 with no strikethrough or badge");
} else {
  fail("Inactive campaign", JSON.stringify(res4));
}

const badgeDisabledPromo: ActivePromotion = {
  ...percentagePromo,
  showProductBadge: false,
};

const res5 = getCardPricing(3500, badgeDisabledPromo);
if (res5.finalPrice === 3500 && res5.originalPrice === null && res5.badgeText === null) {
  ok("When showProductBadge=false, price remains baseline with no catalog badge");
} else {
  fail("Badge disabled campaign", JSON.stringify(res5));
}

// ── 5. Null Promotion & Edge Cases ───────────────────────────────────────────
console.log("\n── 5. Null Promotion & Edge Cases ───────────────────────────────");
const res6 = getCardPricing(3000, null);
if (res6.finalPrice === 3000 && res6.originalPrice === null && !res6.hasDiscount) {
  ok("Null promotion cleanly preserves original price");
} else {
  fail("Null promo", JSON.stringify(res6));
}

const res7 = getCardPricing(0, percentagePromo);
if (res7.finalPrice === 0 && !res7.hasDiscount) {
  ok("Zero price product handled gracefully without discount badge");
} else {
  fail("Zero price", JSON.stringify(res7));
}

// ── 6. Cart & Checkout Summary Arithmetic ────────────────────────────────────
console.log("\n── 6. Cart & Checkout Order Summary Arithmetic ─────────────────");
const cartSubtotal = 7000;
const promoDeduction = calculateDiscountAmount(cartSubtotal, percentagePromo); // 20% of 7000 = 1400
const deliveryFee = 250;
const grandTotal = cartSubtotal - promoDeduction + deliveryFee; // 7000 - 1400 + 250 = 5850

if (promoDeduction === 1400) {
  ok("Cart promo deduction: 20% of Rs. 7,000 is Rs. 1,400");
} else {
  fail("Promo deduction", `Got ${promoDeduction}`);
}

if (grandTotal === 5850) {
  ok("Net Grand Total: Rs. 7,000 - Rs. 1,400 + Rs. 250 = Rs. 5,850");
} else {
  fail("Grand total", `Got ${grandTotal}`);
}

console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`  Results: ${passed} passed · ${failed} failed`);
if (failed === 0) {
  console.log("  ✅ ALL UNIVERSAL DISCOUNT & DUAL PRICING TESTS PASSED!\n");
} else {
  console.error(`  ❌ ${failed} TEST(S) FAILED.\n`);
  process.exit(1);
}
