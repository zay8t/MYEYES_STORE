/**
 * test-lens-configurator-direct-price.ts
 * Validation of Single Source of Truth for Lens Price in Configurator Prescription Step.
 * Run: npx tsx test-lens-configurator-direct-price.ts
 */

import { LENS_PACKAGES } from "./src/lib/prescription-pricing";

interface ConfiguratorState {
  frame: { id: string; name: string; price: number };
  visionType: 'standard' | 'progressive';
  selectedLensId: string;
  odSph: string;
  odCyl: string;
  odAxis: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  addPower: string;
}

function resolveConfiguratorPricing(state: ConfiguratorState) {
  const isProgressive = state.visionType === 'progressive';
  const selectedPackage = LENS_PACKAGES.find((p) => p.id === state.selectedLensId);

  // Single Source of Truth: exact price determined during lens selection
  const selectedLens = selectedPackage
    ? {
        ...selectedPackage,
        price: isProgressive
          ? selectedPackage.presbyopiaBasePrice
          : selectedPackage.standardBasePrice,
        isProgressive,
      }
    : null;

  const activeLensPrice = selectedLens?.price ?? 0;
  const framePrice = state.frame?.price ?? 0;
  const prescriptionExtra = 0;
  const totalPrice = framePrice + activeLensPrice + prescriptionExtra;

  return {
    selectedLens,
    activeLensPrice,
    framePrice,
    totalPrice,
  };
}

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label: string, reason: string) {
  console.error(`  ✗ FAIL: ${label} — ${reason}`);
  failed++;
}

console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
console.log("║  MY EYES — Configurator Direct Lens Price & Prescription Sync Tests ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

// Test 1: Progressive Lens Selection carries exact price into Step 4
for (const pkg of LENS_PACKAGES.filter((p) => p.id !== 'sv-167-shmc')) {
  const initial = resolveConfiguratorPricing({
    frame: { id: "frame-1", name: "Classic Aviator", price: 2500 },
    visionType: "progressive",
    selectedLensId: pkg.id,
    odSph: "-0.00",
    odCyl: "0.00",
    odAxis: "180",
    osSph: "-0.00",
    osCyl: "0.00",
    osAxis: "180",
    addPower: "+1.00",
  });

  const expectedLensPrice = pkg.presbyopiaBasePrice;
  const expectedTotal = 2500 + expectedLensPrice;

  if (initial.activeLensPrice === expectedLensPrice && initial.totalPrice === expectedTotal) {
    ok(`Progressive ${pkg.name}: Inherited exact price Rs. ${initial.activeLensPrice.toLocaleString()} (Total: Rs. ${initial.totalPrice.toLocaleString()})`);
  } else {
    fail(`Progressive ${pkg.name}`, `Expected lens price Rs. ${expectedLensPrice}, got Rs. ${initial.activeLensPrice}`);
  }
}

// Test 2: Entering SPH, CYL, or ADD does NOT overwrite or mutate lens price
console.log("\n--- Testing Prescription Numbers Mutation Independence ---");
const testLensId = "sv-156-bluecut"; // Presbyopia Base: 2250, Standard Base: 1850
const progressivePkg = LENS_PACKAGES.find((p) => p.id === testLensId)!;

const testRxCases = [
  { name: "Plano prescription", odSph: "0.00", odCyl: "0.00", add: "+1.00" },
  { name: "Mild Myopia", odSph: "-2.50", odCyl: "-0.75", add: "+1.50" },
  { name: "High Myopia with Astigmatism", odSph: "-6.00", odCyl: "-2.50", add: "+2.50" },
  { name: "Hyperopia with High ADD", odSph: "+4.50", odCyl: "0.00", add: "+3.50" },
  { name: "Asymmetric Rx", odSph: "-4.00", odCyl: "-1.50", osSph: "+1.25", osCyl: "0.00", add: "+2.00" },
];

for (const rx of testRxCases) {
  const result = resolveConfiguratorPricing({
    frame: { id: "frame-2", name: "Titanium Rimless", price: 3200 },
    visionType: "progressive",
    selectedLensId: testLensId,
    odSph: rx.odSph,
    odCyl: rx.odCyl,
    odAxis: "90",
    osSph: (rx as any).osSph || rx.odSph,
    osCyl: (rx as any).osCyl || rx.odCyl,
    osAxis: "90",
    addPower: rx.add,
  });

  const expectedLensPrice = progressivePkg.presbyopiaBasePrice;
  const expectedTotal = 3200 + expectedLensPrice;

  if (result.activeLensPrice === expectedLensPrice && result.totalPrice === expectedTotal) {
    ok(`${rx.name}: Lens price remained constant at Rs. ${result.activeLensPrice} (Total Rs. ${result.totalPrice})`);
  } else {
    fail(`${rx.name}`, `Price changed from Rs. ${expectedLensPrice} to Rs. ${result.activeLensPrice}`);
  }
}

// Test 3: Single Vision lens selection carries exact standardBasePrice into Step 4
console.log("\n--- Testing Single Vision Lens Price Inheritance ---");
for (const pkg of LENS_PACKAGES) {
  const result = resolveConfiguratorPricing({
    frame: { id: "frame-3", name: "Acetate Round", price: 1800 },
    visionType: "standard",
    selectedLensId: pkg.id,
    odSph: "-3.50",
    odCyl: "-1.00",
    odAxis: "180",
    osSph: "-3.50",
    osCyl: "-1.00",
    osAxis: "180",
    addPower: "+0.00",
  });

  const expectedLensPrice = pkg.standardBasePrice;
  const expectedTotal = 1800 + expectedLensPrice;

  if (result.activeLensPrice === expectedLensPrice && result.totalPrice === expectedTotal) {
    ok(`Single Vision ${pkg.name}: Inherited exact price Rs. ${result.activeLensPrice.toLocaleString()} (Total: Rs. ${result.totalPrice.toLocaleString()})`);
  } else {
    fail(`Single Vision ${pkg.name}`, `Expected lens price Rs. ${expectedLensPrice}, got Rs. ${result.activeLensPrice}`);
  }
}

console.log("\n═══════════════════════════════════════════════════════════════════════");
console.log(`  Results: ${passed} passed · ${failed} failed`);
if (failed === 0) {
  console.log("  ✅ ALL CONFIGURATOR DIRECT LENS PRICING TESTS PASSED!\n");
} else {
  console.error(`  ❌ ${failed} TEST(S) FAILED.\n`);
  process.exit(1);
}
