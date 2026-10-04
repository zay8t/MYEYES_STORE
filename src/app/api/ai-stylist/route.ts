import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { message, products = [] } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Welcome to MY EYES! For custom prescription eyewear in Pakistan, we offer nationwide flat-rate delivery (Rs. 250), single vision, blue light blocking, high-index, and progressive lenses. How can I help you choose the right frame or lenses?",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const inventoryList = Array.isArray(products)
      ? products.map((p: { id?: string; name?: string; price?: number; category?: string; description?: string }) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
        }))
      : [];

    const prompt = `You are an expert optical assistant for MY EYES, an elite custom prescription eyewear store in Pakistan.
A customer is asking: "${message}"

Here is our active store product inventory:
${JSON.stringify(inventoryList)}

Provide a helpful, polite, and detailed answer regarding frame fit, face shapes, lens types, or prices. Keep it conversational and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text || "How else can I assist you with your eyewear today?";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat AI Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
