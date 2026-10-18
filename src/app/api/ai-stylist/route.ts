import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ProductInput {
  id?: string;
  name?: string;
  price?: number;
  category?: string;
  frameShape?: string;
  material?: string;
  gender?: string;
  description?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message: string = (body?.message || "").trim();
    const history: ChatHistoryItem[] = Array.isArray(body?.history) ? body.history : [];
    let products: ProductInput[] = Array.isArray(body?.products) ? body.products : [];

    if (!message) {
      return NextResponse.json({
        reply: "Hello! How can I assist you with your eyewear today?",
        productIds: [],
        suggestedQuestions: [
          "What frames look best on a round face?",
          "Which lenses are best for long screen time?",
          "What are the best frames for high prescription?",
        ],
      });
    }

    // 1. If products list is empty, fetch active catalog from Prisma
    if (products.length === 0) {
      try {
        const dbProducts = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            frameShape: true,
            material: true,
            gender: true,
            images: true,
            slug: true,
          },
          take: 30,
        });
        products = dbProducts as any;
      } catch (dbErr) {
        console.warn("Could not load products from DB fallback:", dbErr);
      }
    }

    // 2. Resolve Gemini API Key from environment
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      const fallbackProducts = products.slice(0, 2);
      return NextResponse.json({
        reply:
          "Welcome to MY EYES! We offer custom prescription eyewear with flat-rate nationwide delivery (Rs. 250) across Pakistan. You can browse our catalog for stylish frames or consult our team directly via WhatsApp for personalized lens fitting.",
        productIds: fallbackProducts.map((p) => p.id).filter(Boolean),
        recommendedProducts: fallbackProducts,
        suggestedQuestions: [
          "What frames look best on an oval face?",
          "Tell me about Blue-Cut lenses",
          "How long does delivery take in Pakistan?",
        ],
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Slim down products representation for prompt efficiency
    const catalogSummary = products.slice(0, 35).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      shape: p.frameShape || p.category,
      material: p.material,
      gender: p.gender,
    }));

    const formattedHistory = history
      .slice(-4)
      .map((h) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.content}`)
      .join("\n");

    const prompt = `You are the expert optical stylist and customer assistant for MY EYES (https://myeyes.pk), a premier prescription eyewear boutique in Pakistan.
Our details:
- Flat-rate nationwide courier delivery across Pakistan: Rs. 250.
- Lenses available: Single Vision (Anti-Glare), Blue-Cut Computer Protection, Hi-Index Thin (for high power), Photochromic Transition.
- Premium crafted frames for men, women, and unisex styles.

Recent Conversation:
${formattedHistory ? formattedHistory + "\n" : ""}
Customer: "${message}"

Active Store Frames:
${JSON.stringify(catalogSummary)}

Instructions:
1. Provide a warm, professional, and knowledgeable response tailored to the customer's question.
2. If discussing face shapes (round, oval, square, heart, diamond), suggest frame shapes that balance their features (e.g. rectangular or geometric frames for round faces; round or aviator frames for square faces).
3. If relevant frames from the store inventory match the customer's needs, include their matching "id" strings in "productIds" (up to 3 maximum).
4. Provide 2-3 engaging, relevant follow-up questions in "suggestedQuestions".

Respond ONLY in valid JSON matching this structure:
{
  "reply": "Conversational, clear, friendly response with markdown line breaks or bullet points where appropriate.",
  "productIds": ["id1", "id2"],
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}`;

    let replyData: { reply?: string; productIds?: string[]; suggestedQuestions?: string[] } | null = null;
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3-flash-preview",
    ];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response && response.text) {
          try {
            const parsed = JSON.parse(response.text.trim());
            if (parsed && typeof parsed.reply === "string") {
              replyData = {
                reply: parsed.reply,
                productIds: Array.isArray(parsed.productIds) ? parsed.productIds : [],
                suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
                  ? parsed.suggestedQuestions
                  : [],
              };
              break;
            }
          } catch {
            // Text was not pure JSON, use text as reply
            replyData = {
              reply: response.text.trim(),
              productIds: [],
              suggestedQuestions: [
                "Which frame colors do you prefer?",
                "Do you need prescription or blue-light lenses?",
              ],
            };
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[AI-Stylist] Model ${model} failed:`, err?.message || err);
      }
    }

    if (replyData && replyData.reply) {
      const matchedProducts = (replyData.productIds || [])
        .map((id) => products.find((p) => p.id === id || (p as any).slug === id))
        .filter(Boolean);

      return NextResponse.json({
        ...replyData,
        recommendedProducts: matchedProducts,
      });
    }

    // Graceful fallback response
    const fallbackProducts = products.slice(0, 2);
    return NextResponse.json({
      reply:
        "Welcome to MY EYES! We offer custom prescription eyewear with flat-rate nationwide delivery (Rs. 250) across Pakistan. You can explore our frames collection or ask for face shape and lens recommendations.",
      productIds: fallbackProducts.map((p) => p.id).filter(Boolean),
      recommendedProducts: fallbackProducts,
      suggestedQuestions: [
        "What frames look best on a round face?",
        "What are the best lenses for screen work?",
        "How do I choose the right frame size?",
      ],
    });
  } catch (error) {
    console.error("Chat AI Error:", error);
    return NextResponse.json(
      {
        reply:
          "Welcome to MY EYES! How can I assist you with your eyewear selection, frame sizing, or lens options today?",
        productIds: [],
        suggestedQuestions: [
          "What frames look best on an oval face?",
          "Tell me about Blue-Cut lenses",
        ],
      },
      { status: 200 } // Always return 200 with fallback so chat UI never breaks
    );
  }
}
