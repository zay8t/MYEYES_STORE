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
          "Welcome to MY EYES! We offer custom prescription eyewear with flat-rate nationwide delivery (Rs. 250) across Pakistan. How can I assist you with frame styles or lenses today?",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert optical assistant for MY EYES, an elite custom prescription eyewear store in Pakistan (https://myeyes.pk).
A customer is asking: "${message}"

Here is our active store product inventory:
${JSON.stringify((products || []).map((p: { id?: string; name?: string; price?: number; category?: string; description?: string }) => ({ id: p.id, name: p.name, price: p.price, category: p.category })))}

Provide a helpful, polite, and detailed answer regarding frame fit, face shapes, lens types, or prices. Keep it conversational and professional.`;

    let replyText = "";
    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response && response.text) {
          replyText = response.text.trim();
          break;
        }
      } catch (err) {
        console.warn(`Attempt with ${model} encountered an issue, checking fallback...`);
      }
    }

    const reply = replyText || "How else can I assist you with your eyewear today?";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat AI Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
