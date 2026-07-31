import { calculateTotalLensPrice, calculateTotalProgressivePrice, DEFAULT_BASE_PRICES } from "./src/lib/pricingEngine";

console.log("=== RUNNING PRICING ENGINE INTEGRITY TESTS ===\n");

// Test 1: B2 with high-power Tier A (SPH -9.00 / CYL -3.00)
// Multiplier: 3.00x, Base B2 = 1850. Expected: 1850 * 3.00 = 5550
const resultB2TierA = calculateTotalLensPrice(
  "sv-156-bluecut",
  { sph: -9.00, cyl: -3.00 },
  { sph: -9.00, cyl: -3.00 },
  DEFAULT_BASE_PRICES
);
console.log("Test 1 (B2 Tier A):", resultB2TierA);
if (resultB2TierA && resultB2TierA.finalPrice === 5550 && resultB2TierA.multiplier === 3.00) {
  console.log("✅ Test 1 Passed!");
} else {
  console.error("❌ Test 1 Failed!");
  process.exit(1);
}

// Test 2: B2 with high-power Tier B (SPH -10.00 / CYL -5.00)
// Multiplier: 3.15x, Base B2 = 1850. Expected: 1850 * 3.15 = 5827.5
const resultB2TierB = calculateTotalLensPrice(
  "sv-156-bluecut",
  { sph: -10.00, cyl: -5.00 },
  { sph: -10.00, cyl: -5.00 },
  DEFAULT_BASE_PRICES
);
console.log("\nTest 2 (B2 Tier B):", resultB2TierB);
if (resultB2TierB && resultB2TierB.finalPrice === 5827.5 && resultB2TierB.multiplier === 3.15) {
  console.log("✅ Test 2 Passed!");
} else {
  console.error("❌ Test 2 Failed!");
  process.exit(1);
}

// Test 3: B5 with standard power (SPH -2.00 / CYL -0.50)
// Multiplier: 1.00x, Base B5 = 1950. Expected: 1950
const resultB5 = calculateTotalLensPrice(
  "sv-167-shmc",
  { sph: -2.00, cyl: -0.50 },
  { sph: -2.00, cyl: -0.50 },
  DEFAULT_BASE_PRICES
);
console.log("\nTest 3 (B5 Standard):", resultB5);
if (resultB5 && resultB5.finalPrice === 1950 && resultB5.multiplier === 1.00) {
  console.log("✅ Test 3 Passed!");
} else {
  console.error("❌ Test 3 Failed!");
  process.exit(1);
}

// Test 4: Progressive Lens 2 (sv-156-bluecut), SPH -3.00 / CYL -3.00 + ADD 2.00 (Tier 4)
// Multiplier: 1.75x, Base P2_tier2 = 9850. Expected: 9850 * 1.75 = 17237.5
const resultProgTier4 = calculateTotalProgressivePrice(
  "sv-156-bluecut",
  { sph: -3.00, cyl: -3.00 },
  { sph: -3.00, cyl: -3.00 },
  2.00,
  DEFAULT_BASE_PRICES
);
console.log("\nTest 4 (Progressive Tier 4):", resultProgTier4);
if (resultProgTier4 && resultProgTier4.finalPrice === 17237.5 && resultProgTier4.multiplier === 1.75 && resultProgTier4.basePriceKey === "P2_tier2") {
  console.log("✅ Test 4 Passed!");
} else {
  console.error("❌ Test 4 Failed!");
  process.exit(1);
}

console.log("\n🎉 ALL PRICING INTEGRITY TESTS PASSED SUCCESSFULLY!");
