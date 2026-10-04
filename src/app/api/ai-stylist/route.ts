import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

interface StylistRequestBody {
  faceShape?: string;
  metalPreference?: string;
  prescriptionType?: string;
  lifestyle?: string;
  budget?: number;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
    description?: string;
    frameShape?: string;
    material?: string;
    colors?: string[] | string;
    images?: string[] | string;
  }>;
}

// Fallback heuristic recommendations if AI API key is missing or model call fails
function getHeuristicRecommendations(
  products: NonNullable<StylistRequestBody["products"]>,
  faceShape: string = "Oval",
  metalPreference: string = "Classic Matte Black",
  prescriptionType: string = "Single Vision Everyday",
  lifestyle: string = "Everyday",
  budget?: number
) {
  const shapeSuitability: Record<string, string[]> = {
    Oval: ["WAYFARER", "ROUND", "RECTANGLE", "CAT_EYE", "OVAL", "GEOMETRIC", "BROWLINE"],
    Round: ["RECTANGLE", "SQUARE", "GEOMETRIC", "WAYFARER", "BROWLINE"],
    Square: ["ROUND", "OVAL", "AVIATOR", "CAT_EYE", "ROUNDED"],
    Heart: ["OVAL", "ROUND", "CAT_EYE", "WAYFARER", "RIMLESS", "SEMI_RIMLESS"],
    Diamond: ["CAT_EYE", "OVAL", "ROUND", "BROWLINE", "RIMLESS"],
    Oblong: ["SQUARE", "WAYFARER", "ROUND", "OVERSIZED", "RECTANGLE"],
  };

  const allowedShapes = shapeSuitability[faceShape] || ["WAYFARER", "RECTANGLE", "ROUND"];

  // Sort and score products
  const scored = products.map((p) => {
    let score = 0;
    const pShape = (p.frameShape || "").toUpperCase();
    const pMaterial = (p.material || "").toUpperCase();
    const pDesc = (p.description || "").toLowerCase();
    const pName = (p.name || "").toLowerCase();

    // Shape match
    if (allowedShapes.includes(pShape)) score += 40;

    // Budget match
    if (budget) {
      if (p.price <= budget) score += 30;
      else if (p.price <= budget * 1.25) score += 15;
    } else {
      score += 20;
    }

    // Metal / finish match
    const pref = metalPreference.toLowerCase();
    if (pref.includes("gold") && (pDesc.includes("gold") || pName.includes("gold") || pMaterial.includes("METAL") || pMaterial.includes("TITANIUM"))) score += 15;
    if (pref.includes("silver") && (pDesc.includes("silver") || pName.includes("silver") || pMaterial.includes("STAINLESS") || pMaterial.includes("STEEL"))) score += 15;
    if (pref.includes("black") && (pDesc.includes("black") || pName.includes("black") || pMaterial.includes("ACETATE") || pMaterial.includes("TR90"))) score += 15;
    if (pref.includes("tortoise") && (pDesc.includes("tortoise") || pName.includes("tortoise") || pMaterial.includes("ACETATE"))) score += 15;

    // Prescription suitability
    if (prescriptionType.toLowerCase().includes("high-index") || prescriptionType.toLowerCase().includes("thin")) {
      if (pMaterial.includes("ACETATE") || pMaterial.includes("TR90") || !pMaterial.includes("RIMLESS")) score += 15;
    }

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, 3).map((item) => item.product);

  const rationales = [
    `The balanced frame proportions counteract the natural curves of your ${faceShape} face geometry, offering a refined silhouette in ${metalPreference} tones that supports ${prescriptionType.toLowerCase()} with all-day optical clarity.`,
    `Engineered with lightweight ergonomic bridges, this frame delivers premium structural balance for ${lifestyle.toLowerCase()}, perfectly aligning with your aesthetic taste and daily vision profile.`,
    `A signature classic design featuring resilient temple hinges and an optimal lens pocket depth, ideal for accommodating ${prescriptionType.toLowerCase()} while enhancing your facial contours.`,
  ];

  return selected.map((p, idx) => ({
    id: p.id,
    reason: rationales[idx] || `Handcrafted silhouette curated to accentuate your ${faceShape} facial geometry and optical profile.`,
    opticalFit: `Optimal balance for ${faceShape} profiles & ${lifestyle}`,
  }));
}

export async function POST(req: Request) {
  try {
    const body: StylistRequestBody = await req.json();
    const {
      faceShape = "Oval",
      metalPreference = "Classic Matte Black",
      prescriptionType = "Single Vision Everyday",
      lifestyle = "Heavy Screen Time (8+ hrs)",
      budget = 5000,
      products = [],
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = getHeuristicRecommendations(
        products,
        faceShape,
        metalPreference,
        prescriptionType,
        lifestyle,
        budget
      );
      return NextResponse.json({ recommendations: fallback });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an elite Master Optician and Luxury Eyewear Stylist for MY EYES (Pakistan's Premier Prescription Eyewear Atelier).

A customer has completed an in-depth optical styling consultation with the following deep profile metrics:
- Facial Geometry / Face Shape: ${faceShape}
- Skin Tone & Metal / Material Finish Preference: ${metalPreference}
- Lens Prescription & Optical Requirement: ${prescriptionType}
- Daily Lifestyle & Screen Exposure Habits: ${lifestyle}
- Preferred Budget Range: Up to Rs. ${budget}/- (Pakistani Rupees)

Here is our current active inventory of optical and sun frames:
${JSON.stringify(
  products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    frameShape: p.frameShape,
    material: p.material,
    description: p.description,
  }))
)}

INSTRUCTIONS:
1. Analyze the inventory and select EXACTLY 3 best-matching frames for this customer based on:
   - Facial Geometry balance (e.g. angular frames for round faces, curved/oval frames for square faces, versatile frames for oval faces).
   - Material & Finish harmony with the client's tone preference (${metalPreference}).
   - Frame thickness and lens pocket depth suitability for their prescription needs (${prescriptionType}).
   - Lifestyle comfort and weight balance for ${lifestyle}.
   - Budget alignment with Rs. ${budget}/-.
2. For each recommended frame, provide a bespoke, upscale Master Optician styling rationale (2-3 sentences) written in articulate, elegant, authoritative English.
3. Respond ONLY in valid JSON format matching this exact schema:
[
  {
    "id": "exact_product_id_from_inventory",
    "reason": "Master optician styling note explaining facial geometry balance, finish harmony, and prescription optical synergy.",
    "opticalFit": "Brief 3-6 word optical fit highlight (e.g. 'Ideal bridge balance for oval geometry')"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const textResponse = response.text || "[]";
    const cleanedJSON = textResponse
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    let recommendations: Array<{ id: string; reason: string; opticalFit?: string }> = [];
    try {
      recommendations = JSON.parse(cleanedJSON);
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("Invalid array returned by Gemini");
      }
    } catch {
      recommendations = getHeuristicRecommendations(
        products,
        faceShape,
        metalPreference,
        prescriptionType,
        lifestyle,
        budget
      );
    }

    // Ensure all returned product IDs actually exist in products
    const validRecommendations = recommendations
      .filter((rec) => products.some((p) => p.id === rec.id))
      .slice(0, 3);

    if (validRecommendations.length === 0) {
      return NextResponse.json({
        recommendations: getHeuristicRecommendations(
          products,
          faceShape,
          metalPreference,
          prescriptionType,
          lifestyle,
          budget
        ),
      });
    }

    return NextResponse.json({ recommendations: validRecommendations });
  } catch (error) {
    console.error("Gemini AI Stylist Error:", error);
    return NextResponse.json({ error: "Failed to generate AI recommendations" }, { status: 500 });
  }
}
