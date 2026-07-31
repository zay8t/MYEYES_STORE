import { calculateTotalLensPrice, calculateTotalProgressivePrice, DEFAULT_BASE_PRICES } from "./src/lib/pricingEngine";

console.log("=== PRICING ENGINE INTEGRITY TESTS (v2 — Post Bug-Fix) ===\n");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`❌ FAIL — ${label} | ${detail}`);
    failed++;
  }
}

// ────────── STANDARD SINGLE VISION TESTS ──────────

const b2TierA = calculateTotalLensPrice("sv-156-bluecut", { sph: -9.00, cyl: -3.00 }, { sph: -9.00, cyl: -3.00 }, DEFAULT_BASE_PRICES);
assert("B2 Tier A (SPH -9, CYL -3)", b2TierA?.multiplier === 3.00 && b2TierA?.finalPrice === 5550, JSON.stringify(b2TierA));

const b2TierB = calculateTotalLensPrice("sv-156-bluecut", { sph: -10.00, cyl: -5.00 }, { sph: -10.00, cyl: -5.00 }, DEFAULT_BASE_PRICES);
assert("B2 Tier B (SPH -10, CYL -5)", b2TierB?.multiplier === 3.15 && b2TierB?.finalPrice === 5827.5, JSON.stringify(b2TierB));

const b5Std = calculateTotalLensPrice("sv-167-shmc", { sph: -2.00, cyl: -0.50 }, { sph: -2.00, cyl: -0.50 }, DEFAULT_BASE_PRICES);
assert("B5 Standard (SPH -2, CYL -0.5)", b5Std?.multiplier === 1.00 && b5Std?.finalPrice === 1950, JSON.stringify(b5Std));

// ────────── PROGRESSIVE MATRIX TESTS ──────────

// Tier 1: SPH +1.00, CYL 0, ADD +1.50 — must use P2 base (2850) × 1.00
const progTier1 = calculateTotalProgressivePrice("sv-156-bluecut", { sph: 1.00, cyl: 0 }, { sph: 1.00, cyl: 0 }, 1.50, DEFAULT_BASE_PRICES);
assert("Progressive Tier 1 (SPH +1, CYL 0, ADD +1.5)", progTier1?.basePriceKey === "P2" && progTier1?.finalPrice === 2850, JSON.stringify(progTier1));

// NEW: Tier 1 with ADD +0.75 (widened range from 0.50) — was previously returning null (Bug 3 fixed)
const progTier1LowAdd = calculateTotalProgressivePrice("progressive-freeform", { sph: 1.00, cyl: 0 }, { sph: 1.00, cyl: 0 }, 0.75, DEFAULT_BASE_PRICES);
assert("Progressive Tier 1 low ADD fix (SPH +1, CYL 0, ADD +0.75)", progTier1LowAdd?.basePriceKey === "P1" && progTier1LowAdd?.finalPrice === 2250, JSON.stringify(progTier1LowAdd));

// NEW: Tier 1 with OCR-noisy CYL 0.05 — must still route to Tier 1 (Bug 5 fixed)
const progTier1OcrNoise = calculateTotalProgressivePrice("sv-156-bluecut", { sph: 1.00, cyl: 0.05 }, { sph: 1.00, cyl: 0.05 }, 1.50, DEFAULT_BASE_PRICES);
assert("Progressive Tier 1 OCR-noise CYL (CYL 0.05)", progTier1OcrNoise?.basePriceKey === "P2" && progTier1OcrNoise?.finalPrice === 2850, JSON.stringify(progTier1OcrNoise));

// Tier 2: SPH +4.00, CYL 0, ADD +2.00 — P1 tier2 base (5850) × 1.00
const progTier2 = calculateTotalProgressivePrice("progressive-freeform", { sph: 4.00, cyl: 0 }, { sph: 4.00, cyl: 0 }, 2.00, DEFAULT_BASE_PRICES);
assert("Progressive Tier 2 (SPH +4, CYL 0, ADD +2)", progTier2?.basePriceKey === "P1_tier2" && progTier2?.finalPrice === 5850, JSON.stringify(progTier2));

// Tier 3: SPH -3.00, CYL -1.50, ADD +2.00 — P2 tier2 (9850) × 1.25 = 12312.5
const progTier3 = calculateTotalProgressivePrice("sv-156-bluecut", { sph: -3.00, cyl: -1.50 }, { sph: -3.00, cyl: -1.50 }, 2.00, DEFAULT_BASE_PRICES);
assert("Progressive Tier 3 (SPH -3, CYL -1.5, ADD +2)", progTier3?.multiplier === 1.25 && progTier3?.finalPrice === 12312.5, JSON.stringify(progTier3));

// Tier 4: SPH -3.00, CYL -3.00, ADD +2.00 — P2 tier2 (9850) × 1.75 = 17237.5
const progTier4 = calculateTotalProgressivePrice("sv-156-bluecut", { sph: -3.00, cyl: -3.00 }, { sph: -3.00, cyl: -3.00 }, 2.00, DEFAULT_BASE_PRICES);
assert("Progressive Tier 4 (SPH -3, CYL -3, ADD +2)", progTier4?.multiplier === 1.75 && progTier4?.finalPrice === 17237.5, JSON.stringify(progTier4));

// Tier 5: SPH -6.00, CYL -3.00, ADD +2.00 — P1 tier2 (5850) × 2.25 = 13162.5
const progTier5 = calculateTotalProgressivePrice("progressive-freeform", { sph: -6.00, cyl: -3.00 }, { sph: -6.00, cyl: -3.00 }, 2.00, DEFAULT_BASE_PRICES);
assert("Progressive Tier 5 (SPH -6, CYL -3, ADD +2)", progTier5?.multiplier === 2.25 && progTier5?.finalPrice === 13162.5, JSON.stringify(progTier5));

// Out of range: SPH -10, CYL -5, ADD +2 — should return null
const progNull = calculateTotalProgressivePrice("progressive-freeform", { sph: -10.00, cyl: -5.00 }, { sph: -10.00, cyl: -5.00 }, 2.00, DEFAULT_BASE_PRICES);
assert("Progressive Out-of-Range returns null", progNull === null, JSON.stringify(progNull));

// Ultra Thin blocked in progressive mode
const progUltraThin = calculateTotalProgressivePrice("sv-167-shmc", { sph: 1.00, cyl: 0 }, { sph: 1.00, cyl: 0 }, 1.50, DEFAULT_BASE_PRICES);
assert("Progressive Ultra Thin (sv-167-shmc) returns null", progUltraThin === null, JSON.stringify(progUltraThin));

// ────────── SUMMARY ──────────
console.log(`\n${"─".repeat(50)}`);
if (failed === 0) {
  console.log(`🎉 ALL ${passed} TESTS PASSED SUCCESSFULLY!\n`);
} else {
  console.error(`\n⚠️  ${failed} TEST(S) FAILED — Review output above.\n`);
  process.exit(1);
}
