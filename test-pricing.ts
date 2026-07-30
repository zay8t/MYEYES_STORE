import { calculateTotalLensPrice, DEFAULT_BASE_PRICES } from "./src/lib/pricingEngine";

console.log("=== TEST 1: SYMMETRIC EYES ===");
const result1 = calculateTotalLensPrice(
  "progressive-freeform",
  { sph: -2.00, cyl: -1.00 },
  { sph: -2.00, cyl: -1.00 },
  DEFAULT_BASE_PRICES
);
console.log(JSON.stringify(result1, null, 2));

console.log("\n=== TEST 2: ASYMMETRIC EYES ===");
const result2 = calculateTotalLensPrice(
  "progressive-freeform",
  { sph: -2.00, cyl: -1.00 },
  { sph: -5.00, cyl: -3.00 },
  DEFAULT_BASE_PRICES
);
console.log(JSON.stringify(result2, null, 2));
