/**
 * test-lens-simulator.ts
 * Inlined test — no @/ path aliases needed.
 * Run: npx tsx test-lens-simulator.ts
 */
export {};

// ─── Inline the engine (same logic, no imports) ──────────────────────────────

interface LensIndexProfile {
  tier: string;
  n: number;
  material: string;
  minCT: number;
  minET: number;
}

const INDEX_REGISTRY: Record<string, LensIndexProfile> = {
  B1: { tier: "B1", n: 1.56, material: "Standard Resin",        minCT: 2.0, minET: 1.5 },
  B2: { tier: "B2", n: 1.56, material: "Blue Guard Resin",      minCT: 2.0, minET: 1.5 },
  B3: { tier: "B3", n: 1.56, material: "Photochromic Matrix",   minCT: 2.0, minET: 1.5 },
  B4: { tier: "B4", n: 1.56, material: "Dual Shield Hybrid",    minCT: 2.0, minET: 1.5 },
  B5: { tier: "B5", n: 1.67, material: "High Index Thin Resin", minCT: 1.4, minET: 1.2 },
};

const BLANK_RADIUS_MM = 26;
const PROGRESSIVE_BLANK_MARGIN_MM = 0.5;

function sagitta(absDiopter: number, n: number, r = BLANK_RADIUS_MM): number {
  const deltaN = Math.max(0.01, n - 1);
  return (r * r * absDiopter) / (2000 * deltaN);
}

interface SVResult {
  mode: "single_vision";
  center: number;
  edge: number;
}

interface ProgResult {
  mode: "progressive";
  distanceCenter: number;
  distanceEdge: number;
  readingCenter: number;
  fMax: number;
  readingPower: number;
  add: number;
  profile: LensIndexProfile;
}

function calcSV(sph: number, profile: LensIndexProfile): SVResult {
  const s = sagitta(Math.abs(sph), profile.n);
  if (sph <= 0) {
    const center = profile.minCT - 0.5;
    const edge = Math.max(profile.minET, center + s);
    return { mode: "single_vision", center: +center.toFixed(1), edge: +edge.toFixed(1) };
  } else {
    const edge = profile.minET - 0.3;
    const center = Math.max(profile.minCT, edge + s);
    return { mode: "single_vision", center: +center.toFixed(1), edge: +edge.toFixed(1) };
  }
}

function calcProg(sph: number, cyl: number, add: number, profile: LensIndexProfile): ProgResult {
  const absAdd = Math.abs(add);
  const readingPower = sph + absAdd;
  const fMax = Math.max(Math.abs(sph), Math.abs(sph + cyl), Math.abs(readingPower));
  const s = sagitta(fMax, profile.n);
  const sDistance = sagitta(Math.abs(sph), profile.n);

  let distanceCenter: number, distanceEdge: number, readingCenter: number;
  if (sph >= 0 || add > 0) {
    distanceEdge = profile.minET - 0.3;
    distanceCenter = Math.max(profile.minCT, distanceEdge + sDistance + PROGRESSIVE_BLANK_MARGIN_MM);
    readingCenter = Math.max(profile.minCT, distanceEdge + s + PROGRESSIVE_BLANK_MARGIN_MM);
  } else {
    distanceCenter = profile.minCT - 0.5;
    distanceEdge = Math.max(profile.minET, distanceCenter + sDistance + PROGRESSIVE_BLANK_MARGIN_MM);
    readingCenter = Math.max(profile.minCT, distanceCenter + sagitta(Math.abs(readingPower), profile.n));
  }

  return {
    mode: "progressive",
    distanceCenter: +distanceCenter.toFixed(1),
    distanceEdge: +distanceEdge.toFixed(1),
    readingCenter: +readingCenter.toFixed(1),
    fMax: +fMax.toFixed(2),
    readingPower: +readingPower.toFixed(2),
    add: +absAdd.toFixed(2),
    profile,
  };
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

const PACKAGES = [
  { tier: "B1", name: "MY EYES CR Hard Crystal Coat",               expectedN: 1.56 },
  { tier: "B2", name: "MY EYES Blue Light Filter + UV HMC",         expectedN: 1.56 },
  { tier: "B3", name: "MY EYES Sun Adaptive Photochromic HMC",      expectedN: 1.56 },
  { tier: "B4", name: "MY EYES PHOTOCHROMIC + BLUE LIGHT FILTER",   expectedN: 1.56 },
  { tier: "B5", name: "MY EYES Ultra Thin Index",                   expectedN: 1.67 },
];

const PROG_CASES = [
  { label: "A — Pure Reading Presbyopia",        odSph: 0.0,  odCyl: 0.0,   add: 2.00 },
  { label: "B — Compound Astigmatic Progressive", odSph: -2.50, odCyl: -1.00, add: 1.75 },
  { label: "C — High Plus Multifocal",            odSph: 2.00, odCyl: 0.0,   add: 2.50 },
];

let passed = 0;
let failed = 0;

function ok(label: string) { console.log(`  ✓ ${label}`); passed++; }
function fail(label: string) { console.error(`  ✗ FAIL: ${label}`); failed++; }

// ── 1. Index Registry Verification ──────────────────────────────────────────
console.log("\n═══ Index Registry ═════════════════════════════════════════════");
for (const pkg of PACKAGES) {
  const p = INDEX_REGISTRY[pkg.tier];
  if (!p) { fail(`${pkg.tier} missing from registry`); continue; }
  if (p.n !== pkg.expectedN) { fail(`${pkg.tier}: expected n=${pkg.expectedN} got n=${p.n}`); continue; }
  if (p.minCT <= 0 || p.minET <= 0) { fail(`${pkg.tier}: invalid minCT/minET`); continue; }
  ok(`${pkg.tier} n=${p.n} · ${p.material} · minCT=${p.minCT} · minET=${p.minET}`);
}

// ── 2. Progressive Multi-Zone Tests ─────────────────────────────────────────
for (const tc of PROG_CASES) {
  console.log(`\n═══ Progressive Test ${tc.label} ════════════════════════════`);
  console.log(`    SPH=${tc.odSph} · CYL=${tc.odCyl} · ADD=+${tc.add}\n`);

  for (const pkg of PACKAGES) {
    const profile = INDEX_REGISTRY[pkg.tier];
    const r = calcProg(tc.odSph, tc.odCyl, tc.add, profile);

    const issues: string[] = [];
    if (r.distanceCenter <= 0) issues.push(`dCT=${r.distanceCenter}`);
    if (r.distanceEdge <= 0) issues.push(`dET=${r.distanceEdge}`);
    if (r.readingCenter <= 0) issues.push(`nearCT=${r.readingCenter}`);
    if (r.fMax < 0) issues.push(`fMax=${r.fMax}`);
    if (r.profile.n !== pkg.expectedN) issues.push(`n=${r.profile.n}≠${pkg.expectedN}`);
    if (r.distanceCenter < profile.minCT - 0.05) issues.push(`CT below minCT`);

    if (issues.length) {
      fail(`[${pkg.tier}] ${issues.join(", ")}`);
    } else {
      ok(`[${pkg.tier}] n=${r.profile.n} · dCT=${r.distanceCenter}mm · dET=${r.distanceEdge}mm · nearCT=${r.readingCenter}mm · Fmax=${r.fMax}D · Near=${r.readingPower}D`);
    }
  }
}

// ── 3. Single Vision Cross-Check ─────────────────────────────────────────────
console.log("\n═══ Single Vision Cross-Check ═══════════════════════════════════");
const SV_CASES = [
  { sph: 0.0,  label: "Plano (0.00 D)" },
  { sph: -3.0, label: "Myopia (-3.00 D)" },
  { sph: 2.5,  label: "Hyperopia (+2.50 D)" },
  { sph: -6.0, label: "High Myopia (-6.00 D)" },
];

for (const sv of SV_CASES) {
  for (const pkg of PACKAGES) {
    const profile = INDEX_REGISTRY[pkg.tier];
    const r = calcSV(sv.sph, profile);
    if (r.center <= 0 || r.edge <= 0) {
      fail(`[SV ${pkg.tier}] ${sv.label}: CT=${r.center} ET=${r.edge}`);
    } else {
      ok(`[SV ${pkg.tier}] ${sv.label}: CT=${r.center}mm · ET=${r.edge}mm`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`  ${passed} passed · ${failed} failed`);
if (failed === 0) {
  console.log("  ✅ ALL TESTS PASSED — Progressive lens simulator validated.\n");
} else {
  console.error(`  ❌ ${failed} test(s) FAILED.\n`);
  process.exit(1);
}
