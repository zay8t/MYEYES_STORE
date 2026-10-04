import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { faceShape, lifestyle, budget, products } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback heuristics if API key is not configured
      const filtered = products
        .filter((p: { price: number }) => (budget ? p.price <= budget * 1.3 : true))
        .slice(0, 3)
        .map((p: { id: string }) => ({
          id: p.id,
          reason: `Complementary geometry tailored to accentuate ${faceShape || "balanced"} face contours for ${lifestyle || "everyday"} wear.`,
        }));

      return NextResponse.json({ recommendations: filtered.length > 0 ? filtered : products.slice(0, 3).map((p: { id: string }) => ({ id: p.id, reason: "Signature luxury frame curated for optimal comfort." })) });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a high-end luxury optical stylist for MY EYES, an elite eyewear store in Pakistan.
A customer is looking for prescription glasses with the following preferences:
- Face Shape: ${faceShape || "Oval"}
- Lifestyle/Use Case: ${lifestyle || "Everyday prescription wear"}
- Max Budget: Rs. ${budget || 5000}/-

Here is our current inventory of available frames:
${JSON.stringify(
  products.map((p: { id: string; name: string; price: number; category?: string; description?: string; frameShape?: string; material?: string }) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    frameShape: p.frameShape,
    material: p.material,
    description: p.description,
  }))
)}

Select the top 3 best matching frames from this exact list. Respond ONLY in valid JSON format with an array of objects containing the product id and a short, sophisticated style reason why it fits them:
[
  { "id": "product_id_here", "reason": "Styling note explaining why this frame suits their face shape and lifestyle." }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const textResponse = response.text || "[]";
    const cleanedJSON = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    let recommendations = [];
    try {
      recommendations = JSON.parse(cleanedJSON);
    } catch {
      recommendations = products.slice(0, 3).map((p: { id: string }) => ({
        id: p.id,
        reason: `Handcrafted silhouette curated to enhance ${faceShape || "your"} facial profile.`,
      }));
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Gemini AI Stylist Error:", error);
    return NextResponse.json({ error: "Failed to generate AI recommendations" }, { status: 500 });
  }
}
