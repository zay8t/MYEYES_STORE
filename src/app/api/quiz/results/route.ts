import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QuizAnswers, SCORING_WEIGHTS, COLOR_PALETTES } from "@/lib/quizData";
import { safeProduct, SafeProduct } from "@/lib/data-guards";

export interface ScoredProduct extends SafeProduct {
  matchScore: number;
  matchPercent: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Score a single product against the quiz answers
// ─────────────────────────────────────────────────────────────────────────────
function scoreProduct(
  product: SafeProduct,
  answers: QuizAnswers,
  relaxed = false
): number {
  let score = 0;
  const maxScore =
    SCORING_WEIGHTS.category +
    SCORING_WEIGHTS.gender +
    SCORING_WEIGHTS.frameShape +
    SCORING_WEIGHTS.material +
    SCORING_WEIGHTS.color +
    SCORING_WEIGHTS.frameSize;

  // 1. CATEGORY (25pts) — hard filter, always evaluated
  if (answers.category && answers.category !== "all") {
    if (product.category === answers.category) {
      score += SCORING_WEIGHTS.category;
    }
  } else {
    score += SCORING_WEIGHTS.category; // No preference → full points
  }

  // 2. GENDER (20pts) — hard filter, always evaluated
  if (answers.gender && answers.gender !== "all") {
    const productGender = (product.gender || "").toLowerCase();
    const preferred = Array.isArray(answers.gender)
      ? answers.gender.map((g) => g.toLowerCase())
      : [String(answers.gender).toLowerCase()];
    const isMatch =
      preferred.some((g) => productGender.includes(g)) ||
      productGender.includes("unisex");
    if (isMatch) score += SCORING_WEIGHTS.gender;
  } else {
    score += SCORING_WEIGHTS.gender;
  }

  // 3. FRAME SHAPE (20pts) — preserved even in relaxed mode
  if (answers.frameShapes && answers.frameShapes.length > 0) {
    const productShape = (product.frameShape || "NILL").toUpperCase();
    const shapeMatch = answers.frameShapes.some(
      (s) => s.toUpperCase() === productShape
    );
    if (shapeMatch) score += SCORING_WEIGHTS.frameShape;
  } else {
    score += SCORING_WEIGHTS.frameShape;
  }

  // 4. MATERIAL (15pts) — relaxed in fallback mode
  if (!relaxed && answers.material && answers.material !== "all") {
    const productMat = (product.material || "NILL").toUpperCase();
    const mat = answers.material.toUpperCase();
    // Titanium matches Metal too; Hybrid matches both
    const materialMatch =
      productMat === mat ||
      (mat === "TITANIUM" && productMat === "METAL") ||
      (mat === "HYBRID" && (productMat === "ACETATE" || productMat === "METAL" || productMat === "TITANIUM"));
    if (materialMatch) score += SCORING_WEIGHTS.material;
  } else {
    score += SCORING_WEIGHTS.material;
  }

  // 5. COLOR PALETTE (10pts) — scored via direct colors array or keyword match on name+description
  if (answers.colorPalette && answers.colorPalette.length > 0) {
    const productText = `${product.name} ${product.description}`.toLowerCase();
    const colorMatch = answers.colorPalette.some((paletteKey) => {
      // 1. Direct match with product.colors
      if (product.colors && Array.isArray(product.colors)) {
        if (product.colors.map(c => c.toLowerCase()).includes(paletteKey.toLowerCase())) {
          return true;
        }
      }
      // 2. Fallback keyword match in product text
      const palette = COLOR_PALETTES[paletteKey];
      if (!palette) return false;
      return palette.keywords.some((kw) => productText.includes(kw));
    });
    if (colorMatch) score += SCORING_WEIGHTS.color;
    else score += Math.round(SCORING_WEIGHTS.color * 0.4); // partial credit
  } else {
    score += SCORING_WEIGHTS.color;
  }

  // 6. FRAME SIZE (10pts) — soft match (no DB field, heuristic by shape)
  if (!relaxed && answers.frameSize && answers.frameSize !== "all") {
    const shape = (product.frameShape || "NILL").toUpperCase();
    const narrowShapes = ["OVAL", "ROUND", "RIMLESS"];
    const wideShapes = ["AVIATOR", "WAYFARER", "GEOMETRIC"];
    let sizeCategory = "medium";
    if (narrowShapes.includes(shape)) sizeCategory = "narrow";
    else if (wideShapes.includes(shape)) sizeCategory = "wide";
    if (sizeCategory === answers.frameSize) score += SCORING_WEIGHTS.frameSize;
    else score += Math.round(SCORING_WEIGHTS.frameSize * 0.3);
  } else {
    score += SCORING_WEIGHTS.frameSize;
  }

  return Math.round((score / maxScore) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/quiz/results
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers: QuizAnswers = body;

    // Build Prisma where clause (category + gender hard filters only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {};

    if (answers.category && answers.category !== "all") {
      whereClause.category = answers.category;
    }

    if (answers.gender && answers.gender !== "all") {
      const genderValues = Array.isArray(answers.gender)
        ? answers.gender
        : [answers.gender];
      whereClause.OR = genderValues.map((g) => ({
        gender: { contains: g, mode: "insensitive" },
      }));
      // Also allow unisex
      whereClause.OR = [
        ...whereClause.OR,
        { gender: { contains: "unisex", mode: "insensitive" } },
        { gender: { contains: "all", mode: "insensitive" } },
      ];
    }

    // Fetch products from DB
    const rawProducts = await prisma.product.findMany({
      where: whereClause,
      take: 200,
    });

    // Map to safe products
    const safeProducts = rawProducts.map((p) =>
      safeProduct(p as unknown as Record<string, unknown>)
    );

    // Score each product
    let scored: ScoredProduct[] = safeProducts.map((p) => ({
      ...p,
      matchScore: scoreProduct(p, answers),
      matchPercent: scoreProduct(p, answers),
    }));

    // Sort descending by score
    scored.sort((a, b) => b.matchPercent - a.matchPercent);

    // ── RELAXATION FALLBACK ──────────────────────────────────────────────────
    // If fewer than 3 products score above 50%, relax secondary filters
    const highScorers = scored.filter((p) => p.matchPercent >= 50);
    if (highScorers.length < 3) {
      scored = safeProducts.map((p) => ({
        ...p,
        matchScore: scoreProduct(p, answers, true),
        matchPercent: scoreProduct(p, answers, true),
      }));
      scored.sort((a, b) => b.matchPercent - a.matchPercent);
    }

    // Return top 24 results
    return NextResponse.json({
      success: true,
      total: scored.length,
      results: scored.slice(0, 24),
    });
  } catch (err) {
    console.error("[QUIZ RESULTS API ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Failed to compute quiz results" },
      { status: 500 }
    );
  }
}
