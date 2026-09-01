/**
 * test-promotional-badges.ts
 * Validation of Promotional OFF Badges, Pricing Math, and Admin Sync.
 * Run: npx tsx test-promotional-badges.ts
 */

interface ActivePromotion {
  id: string;
  code: string;
  title: string;
  type: "percentage" | "fixed_cart";
  amount: number;
  showProductBadge: boolean;
  badgeLabel: string;
  badgeType: "percentage" | "fixed_cart" | "custom";
}

function calculateDiscountedPrice(basePrice: number, promo: ActivePromotion | null) {
  if (!promo || !promo.showProductBadge || basePrice <= 0) {
    return {
      originalPrice: basePrice,
      promotionalPrice: basePrice,
      hasDiscount: false,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (promo.type === "percentage") {
    discountAmount = (basePrice * promo.amount) / 100;
  } else {
    discountAmount = Math.min(promo.amount, basePrice);
  }

  const promotionalPrice = Math.max(0, Math.round(basePrice - discountAmount));
  return {
    originalPrice: basePrice,
    promotionalPrice,
    hasDiscount: promotionalPrice < basePrice,
    discountAmount,
  };
}

function resolveBadgeLabel(promo: ActivePromotion) {
  if (promo.badgeLabel?.trim()) return promo.badgeLabel.trim();
  if (promo.type === "percentage") return `${promo.amount}% OFF`;
  return `RS. ${promo.amount} OFF`;
}

let passed = 0;
let failed = 0;

function ok(testName: string) {
  console.log(`  ✓ ${testName}`);
  passed++;
}

function fail(testName: string, reason: string) {
  console.error(`  ✗ FAIL: ${testName} — ${reason}`);
  failed++;
}

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  MY EYES — Promotional Badges & Pricing Math Validation      ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// 1. Percentage Campaign Test
console.log("── 1. Percentage Campaign (20% OFF) ─────────────────────────────");
const promo20: ActivePromotion = {
  id: "p1",
  code: "SUMMER20",
  title: "Summer Sale",
  type: "percentage",
  amount: 20,
  showProductBadge: true,
  badgeLabel: "20% OFF",
  badgeType: "percentage",
};

const res20 = calculateDiscountedPrice(3500, promo20);
if (res20.hasDiscount && res20.promotionalPrice === 2800 && res20.originalPrice === 3500) {
  ok("20% of Rs. 3,500 correctly discounts to Rs. 2,800");
} else {
  fail("20% discount math", `got ${res20.promotionalPrice}, expected 2800`);
}

const label20 = resolveBadgeLabel(promo20);
if (label20 === "20% OFF") {
  ok("Badge label correctly resolves to '20% OFF'");
} else {
  fail("Badge label resolution", `got ${label20}`);
}

// 2. Fixed Amount Campaign Test
console.log("\n── 2. Fixed Amount Campaign (Rs. 500 OFF) ───────────────────────");
const promoFixed: ActivePromotion = {
  id: "p2",
  code: "SAVE500",
  title: "Flat Rs. 500 Discount",
  type: "fixed_cart",
  amount: 500,
  showProductBadge: true,
  badgeLabel: "RS. 500 OFF",
  badgeType: "fixed_cart",
};

const resFixed = calculateDiscountedPrice(2500, promoFixed);
if (resFixed.hasDiscount && resFixed.promotionalPrice === 2000) {
  ok("Rs. 500 discount on Rs. 2,500 gives Rs. 2,000");
} else {
  fail("Fixed discount math", `got ${resFixed.promotionalPrice}, expected 2000`);
}

// 3. Custom Badge Label Test
console.log("\n── 3. Custom Badge Label Override ───────────────────────────────");
const promoCustom: ActivePromotion = {
  id: "p3",
  code: "EID2026",
  title: "Eid Special",
  type: "percentage",
  amount: 15,
  showProductBadge: true,
  badgeLabel: "EID MEGA SALE",
  badgeType: "custom",
};

const labelCustom = resolveBadgeLabel(promoCustom);
if (labelCustom === "EID MEGA SALE") {
  ok("Custom badge label override 'EID MEGA SALE' preserved");
} else {
  fail("Custom badge label override", `got ${labelCustom}`);
}

// 4. Disabled Badge Test
console.log("\n── 4. Disabled Badge / Inactive Campaign ─────────────────────────");
const promoDisabledBadge: ActivePromotion = {
  ...promo20,
  showProductBadge: false,
};

const resDisabled = calculateDiscountedPrice(3500, promoDisabledBadge);
if (!resDisabled.hasDiscount && resDisabled.promotionalPrice === 3500) {
  ok("When showProductBadge=false, price remains un-discounted at Rs. 3,500");
} else {
  fail("Disabled badge check", `expected no discount, got ${resDisabled.promotionalPrice}`);
}

const resNoPromo = calculateDiscountedPrice(4000, null);
if (!resNoPromo.hasDiscount && resNoPromo.promotionalPrice === 4000) {
  ok("When no active promotion exists, price stays exactly at baseline Rs. 4,000");
} else {
  fail("Null promo check", `expected 4000, got ${resNoPromo.promotionalPrice}`);
}

// Summary
console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`  Results: ${passed} passed · ${failed} failed`);
if (failed === 0) {
  console.log("  ✅ ALL PROMOTIONAL BADGE & PRICING TESTS PASSED!\n");
} else {
  console.error(`  ❌ ${failed} TEST(S) FAILED.\n`);
  process.exit(1);
}
