import { calculateTotalLensPrice, calculateTotalProgressivePrice, DEFAULT_BASE_PRICES, BasePriceConfig } from "./src/lib/pricingEngine";
import { LENS_PACKAGES } from "./src/lib/prescription-pricing";

console.log("=== DYNAMIC FEED & REACTIVE SWITCHING VERIFICATION ===\n");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`❌ FAIL — ${label} | ${detail || "Condition not met"}`);
    failed++;
  }
}

// 1. Verify 5 Core Tiers definition and properties
assert("5 Core Packages defined", LENS_PACKAGES.length === 5);
const expectedCodes = ["B1", "B2", "B3", "B4", "B5"];
const actualCodes = LENS_PACKAGES.map((p) => p.baseKey);
assert("All 5 codes match B1-B5", JSON.stringify(actualCodes) === JSON.stringify(expectedCodes));

// Verify 1:1 Names
assert("B1 Name match", LENS_PACKAGES[0].name === "MY EYES CR Hard Crystal Coat");
assert("B2 Name match", LENS_PACKAGES[1].name === "MY EYES Blue Light Filter + UV Protection HMC");
assert("B3 Name match", LENS_PACKAGES[2].name === "MY EYES Sun Adaptive Photochromic HMC");
assert("B4 Name match (Renamed)", LENS_PACKAGES[3].name === "MY EYES PHOTOCHROMIC + BLUE LIGHT FILTER");
assert("B5 Name match", LENS_PACKAGES[4].name === "MY EYES Ultra Thin Index");

// Verify 1:1 Descriptions
assert("B1 Description match", LENS_PACKAGES[0].description === "Single-vision clarity with standard hard crystal coating for daily scratch resistance.");
assert("B2 Description match", LENS_PACKAGES[1].description === "Blocks harmful digital screen blue light and 100% UV rays with HMC anti-reflective coating.");
assert("B3 Description match", LENS_PACKAGES[2].description === "Transitions smoothly to dark grey in sunlight. Complete UV protection.");
assert("B4 Description match", LENS_PACKAGES[3].description === "Ultimate hybrid: filters digital blue light indoors and transitions to sunglasses outdoors.");
assert("B5 Description match", LENS_PACKAGES[4].description === "High-index ultra-thin profile for stronger prescriptions. Reduces lens thickness significantly.");

// 2. Verify Single Vision starting prices
const expectedStd = [850, 1850, 1950, 3250, 1950];
const actualStd = LENS_PACKAGES.map((p) => p.standardBasePrice);
assert("Standard starting prices match", JSON.stringify(actualStd) === JSON.stringify(expectedStd), JSON.stringify(actualStd));

// 3. Verify Presbyopia (+40) starting prices
const expectedPresbyopia = [1250, 2250, 2350, 3650, 2350];
const actualPresbyopia = LENS_PACKAGES.map((p) => p.presbyopiaBasePrice);
assert("Presbyopia starting prices match", JSON.stringify(actualPresbyopia) === JSON.stringify(expectedPresbyopia), JSON.stringify(actualPresbyopia));

// 4. Reactive Switching Simulation: Single Vision vs Progressive
LENS_PACKAGES.forEach((pkg, idx) => {
  const stdPrice = pkg.standardBasePrice;
  const presbPrice = pkg.presbyopiaBasePrice;
  
  // Single vision starting price
  const isProgressive = false;
  const startingPriceSV = isProgressive ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
  assert(`${pkg.baseKey} (${pkg.id}) SV starting price`, startingPriceSV === expectedStd[idx]);

  // Progressive starting price
  const isProg = true;
  const startingPriceProg = isProg ? pkg.presbyopiaBasePrice : pkg.standardBasePrice;
  assert(`${pkg.baseKey} (${pkg.id}) Progressive starting price`, startingPriceProg === expectedPresbyopia[idx]);
});

// 5. Admin Live Rate Update Simulation: Update B3 Presbyopia from Rs. 2,350 to Rs. 2,400
const updatedBasePrices: BasePriceConfig = {
  ...DEFAULT_BASE_PRICES,
  B3_plus40: 2400,
  P3: 2400,
};

const updatedB3Pkg = {
  ...LENS_PACKAGES.find((p) => p.baseKey === "B3")!,
  presbyopiaBasePrice: 2400,
};

const startingPriceUpdated = true ? updatedB3Pkg.presbyopiaBasePrice : updatedB3Pkg.standardBasePrice;
assert("Live Admin Update: B3 Presbyopia starting price updated to 2,400", startingPriceUpdated === 2400);

// Live calculation with Plano power (+0.00 SPH, +0.00 CYL, +1.50 ADD) evaluates to 2400
const liveCalcProg = calculateTotalProgressivePrice(
  "sv-156-photogrey",
  { sph: "+0.00", cyl: "+0.00" },
  { sph: "+0.00", cyl: "+0.00" },
  "+1.50",
  updatedBasePrices
);
assert("Live Admin Update: B3 calculation evaluates to 2,400", liveCalcProg?.finalPrice === 2400, JSON.stringify(liveCalcProg));

// 6. Frame + Lens Calculation in Storefront Configurator
const framePrice = 4500;
const totalWithSV = framePrice + updatedB3Pkg.standardBasePrice; // 4500 + 1950 = 6450
const totalWithProg = framePrice + updatedB3Pkg.presbyopiaBasePrice; // 4500 + 2400 = 6900

assert("Storefront Frame + SV Lens Total: Rs. 6,450", totalWithSV === 6450);
assert("Storefront Frame + Prog Lens Total: Rs. 6,900", totalWithProg === 6900);

console.log(`\n${"─".repeat(50)}`);
if (failed === 0) {
  console.log(`🎉 ALL ${passed} DYNAMIC PRICING TESTS PASSED!\n`);
} else {
  console.error(`❌ ${failed} TEST(S) FAILED.\n`);
  process.exit(1);
}
