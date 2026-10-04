import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StylistRequestBody {
  message?: string;
  messages?: ChatMessage[];
  // Legacy / Structured fallback properties
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

// Fallback heuristic for chat responses if API key is not present or Gemini fails
function getHeuristicChatResponse(
  query: string,
  products: NonNullable<StylistRequestBody["products"]>
) {
  const q = query.toLowerCase();
  let reply = "";
  let matchedIds: string[] = [];
  let suggestedQuestions = [
    "What frames suit round face shapes?",
    "Which lenses block digital screen glare?",
    "What are your delivery & payment options?",
  ];

  if (q.includes("round") || q.includes("circle")) {
    reply =
      "For round face shapes, angular and geometric silhouettes such as Rectangle, Square, or Wayfarer frames provide sharp structural definition and balance soft facial curves.";
    matchedIds = products
      .filter((p) => {
        const shape = (p.frameShape || "").toUpperCase();
        return shape.includes("RECTANGLE") || shape.includes("SQUARE") || shape.includes("WAYFARER");
      })
      .slice(0, 3)
      .map((p) => p.id);
    suggestedQuestions = ["What about square face shapes?", "Do you have metal rectangle frames?"];
  } else if (q.includes("square") || q.includes("jaw")) {
    reply =
      "For square face shapes with defined jawlines, soft curved frames such as Round, Oval, or subtle Cat-Eye styles add harmonious balance and soften angular contours.";
    matchedIds = products
      .filter((p) => {
        const shape = (p.frameShape || "").toUpperCase();
        return shape.includes("ROUND") || shape.includes("OVAL") || shape.includes("CAT_EYE");
      })
      .slice(0, 3)
      .map((p) => p.id);
    suggestedQuestions = ["Can I get thin round titanium frames?", "How do I order prescription lenses?"];
  } else if (q.includes("oval")) {
    reply =
      "Oval face shapes have balanced proportions and can effortlessly wear almost any silhouette, including classic Wayfarers, sleek Ovals, and bold Geometric frames.";
    matchedIds = products.slice(0, 3).map((p) => p.id);
    suggestedQuestions = ["What finish looks best on warm skin tones?", "Do you offer blue light protection?"];
  } else if (q.includes("screen") || q.includes("computer") || q.includes("blue") || q.includes("work")) {
    reply =
      "For long hours at digital monitors, we recommend our Anti-Blue Light (Blue Shield) lenses paired with ultra-lightweight TR90 or Titanium frames to eliminate eye fatigue and bridge pressure.";
    matchedIds = products
      .filter((p) => {
        const mat = (p.material || "").toUpperCase();
        return mat.includes("TR90") || mat.includes("TITANIUM") || mat.includes("ACETATE");
      })
      .slice(0, 3)
      .map((p) => p.id);
    suggestedQuestions = ["What are the lens prices for blue light?", "How fast is delivery in Pakistan?"];
  } else if (q.includes("price") || q.includes("cost") || q.includes("cheap") || q.includes("budget") || q.includes("pkr") || q.includes("rs")) {
    reply =
      "Our frames start from Rs. 1,500 with complete premium optical frames up to luxury handcrafted titanium models. Single vision and blue-cut lenses are made to your exact prescription numbers.";
    matchedIds = products.slice(0, 3).map((p) => p.id);
    suggestedQuestions = ["How do I submit my prescription?", "What payment methods are accepted?"];
  } else if (q.includes("delivery") || q.includes("shipping") || q.includes("lahore") || q.includes("karachi") || q.includes("islamabad")) {
    reply =
      "We deliver custom prescription eyewear across all cities and towns in Pakistan with a flat Rs. 250 delivery fee. We accept EasyPaisa, JazzCash, Bank Transfers, and Card payments.";
    matchedIds = products.slice(0, 3).map((p) => p.id);
  } else {
    reply =
      "Welcome to MY EYES! I can help you find frames that complement your face shape, recommend lenses for your prescription or screen use, and assist with any eyewear questions.";
    matchedIds = products.slice(0, 3).map((p) => p.id);
  }

  if (matchedIds.length === 0 && products.length > 0) {
    matchedIds = products.slice(0, 3).map((p) => p.id);
  }

  return {
    reply,
    recommendedProductIds: matchedIds,
    suggestedQuestions,
  };
}

export async function POST(req: Request) {
  try {
    const body: StylistRequestBody = await req.json();
    const {
      message = "",
      messages = [],
      products = [],
      faceShape,
      metalPreference,
      prescriptionType,
      lifestyle,
      budget,
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        reply: "Welcome to MY EYES! Please explore our collection or ask any question about frame styling and lenses.",
        recommendedProductIds: [],
        suggestedQuestions: [],
      });
    }

    // Determine the user's latest query
    const lastUserMessage = message || (messages.length > 0 ? messages[messages.length - 1].content : "") || (faceShape ? `Help me find frames for a ${faceShape} face shape` : "Recommend top frames for me");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = getHeuristicChatResponse(lastUserMessage, products);
      return NextResponse.json(fallback);
    }

    const ai = new GoogleGenAI({ apiKey });

    const conversationHistoryText = messages
      .map((m) => `${m.role === "user" ? "Customer" : "MY EYES Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are the virtual optical consultant for MY EYES, Pakistan's premier prescription eyewear atelier and store (https://myeyes.pk).

STORE DETAILS & POLICIES:
- Products: Prescription eyeglasses, sunglasses, blue-light blocking lenses, high-index lenses, progressive/bifocal lenses.
- Delivery: Nationwide flat-rate delivery in Pakistan (Rs. 250). Custom prescription glasses delivered to doorsteps in Karachi, Lahore, Islamabad, and across Pakistan.
- Payment methods: EasyPaisa, JazzCash, Direct Bank Transfer, Credit/Debit Cards.
- Lenses: Made in precision optical labs according to exact prescription numbers (SPH, CYL, AXIS, ADD).
- Tone: Friendly, elegant, professional, and helpful in clear, natural English without technical AI jargon.

CURRENT LIVE INVENTORY OF FRAMES:
${JSON.stringify(
  products.slice(0, 20).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    frameShape: p.frameShape,
    material: p.material,
    description: p.description,
  }))
)}

CONVERSATION HISTORY:
${conversationHistoryText}

LATEST CUSTOMER QUESTION:
"${lastUserMessage}"

INSTRUCTIONS:
1. Provide a direct, polite, helpful response answering the customer's question with expert optical and styling guidance.
2. If the user is asking for frame suggestions, styling advice, or specific frame types, select 1 to 3 best matching product IDs from the inventory list above and include them in "recommendedProductIds". If not asking about products, this can be an empty array.
3. Provide 2-3 short, relevant follow-up questions in "suggestedQuestions".
4. Output strictly valid JSON matching this schema:
{
  "reply": "Your helpful conversational response here.",
  "recommendedProductIds": ["matching_id_1", "matching_id_2"],
  "suggestedQuestions": ["Suggested follow-up 1", "Suggested follow-up 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const textResponse = response.text || "{}";
    const cleanedJSON = textResponse
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    let parsedResult: {
      reply?: string;
      recommendedProductIds?: string[];
      suggestedQuestions?: string[];
    } = {};

    try {
      parsedResult = JSON.parse(cleanedJSON);
    } catch {
      parsedResult = getHeuristicChatResponse(lastUserMessage, products);
    }

    const reply =
      parsedResult.reply ||
      "I'd be delighted to help you select the ideal frame and lenses for your vision needs. How can I assist you further?";

    // Validate recommended IDs
    const validProductIds = (parsedResult.recommendedProductIds || []).filter((id) =>
      products.some((p) => p.id === id)
    );

    const suggestedQuestions = parsedResult.suggestedQuestions || [
      "What frames fit my face shape?",
      "Which lenses are best for computer screens?",
      "What are the lens prices?",
    ];

    return NextResponse.json({
      reply,
      recommendedProductIds: validProductIds.length > 0 ? validProductIds : products.slice(0, 3).map((p) => p.id),
      suggestedQuestions,
    });
  } catch (error) {
    console.error("Gemini AI Chat Error:", error);
    const fallback = getHeuristicChatResponse("help", []);
    return NextResponse.json(fallback);
  }
}
