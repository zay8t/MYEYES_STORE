import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper: Snap value to nearest 0.25 interval and format with sign
function snapToInterval(
  raw: string | number | null | undefined,
  min: number,
  max: number,
  defaultVal: string = "0.00"
): string {
  if (raw === null || raw === undefined || raw === "" || raw === "None" || raw === "PL" || raw === "Plano") {
    return defaultVal;
  }

  const str = String(raw).trim().replace(/^[+]/, "");
  const num = parseFloat(str);

  if (isNaN(num)) return defaultVal;

  // Round to nearest 0.25
  const rounded = Math.round(num * 4) / 4;
  const clamped = Math.max(min, Math.min(max, rounded));

  if (clamped === 0) return "0.00";
  if (clamped > 0) return `+${clamped.toFixed(2)}`;
  return clamped.toFixed(2);
}

function snapAxis(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined || raw === "") return "180";
  const num = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (isNaN(num) || num < 1) return "180";
  if (num > 180) return "180";
  return String(num);
}

function snapAdd(raw: string | number | null | undefined): string | null {
  if (!raw || raw === "null" || raw === "none" || raw === "0" || raw === "0.00") return null;
  const str = String(raw).trim().replace(/^[+]/, "");
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;
  const rounded = Math.round(num * 4) / 4;
  const clamped = Math.max(0.75, Math.min(3.50, rounded));
  return `+${clamped.toFixed(2)}`;
}

// Extract JSON object safely from LLM output
function extractJsonObject(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in model output.");
  }
}

const PRIMARY_MODEL = "gemini-1.5-flash";
const FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-pro-vision",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get("slip") || formData.get("file") || formData.get("image")) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No prescription slip image provided." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key is not configured on server." },
        { status: 500 }
      );
    }

    // Convert file arrayBuffer to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `You are an expert optical laboratory assistant analyzing an ophthalmologist/optometrist prescription slip.
Examine the doctor's handwriting or printed prescription carefully:
1. OD (Right Eye) and OS/O.S. (Left Eye).
2. SPH (Sphere/Power/Spherical): identify positive (+) or negative (-) signs. Round to the nearest 0.25 step between -16.00 and +16.00 (or "0.00" for Plano/PL/Nil).
3. CYL (Cylinder/Astigmatism): identify sign. Round to nearest 0.25 step between -4.00 and +4.00 (or "0.00" for Nil/None/Plano).
4. AXIS: Integer between 1 and 180 degrees. If cylinder is 0.00/nil, output "180".
5. ADD (Addition/Near Vision/Reading): extract reading power (e.g. +1.50, +2.00, +2.50) if indicated for presbyopia/reading/bifocal/progressive. Otherwise null.
6. PD: Pupillary distance in mm if mentioned (e.g. 62, 64), otherwise null.

Return ONLY a JSON object with this exact structure:
{
  "od": { "sph": "-1.25", "cyl": "-0.75", "axis": "170" },
  "os": { "sph": "-2.25", "cyl": "-1.00", "axis": "10" },
  "add": null,
  "pd": "64"
}`;

    let rawData: any = null;
    let lastError: any = null;

    // Attempt 1: Primary structured output with gemini-1.5-flash
    try {
      const model = genAI.getGenerativeModel({
        model: PRIMARY_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              od: {
                type: SchemaType.OBJECT,
                description: "Right Eye (OD) optical prescription values",
                properties: {
                  sph: { type: SchemaType.STRING },
                  cyl: { type: SchemaType.STRING },
                  axis: { type: SchemaType.STRING },
                },
                required: ["sph", "cyl", "axis"],
              },
              os: {
                type: SchemaType.OBJECT,
                description: "Left Eye (OS/O.S.) optical prescription values",
                properties: {
                  sph: { type: SchemaType.STRING },
                  cyl: { type: SchemaType.STRING },
                  axis: { type: SchemaType.STRING },
                },
                required: ["sph", "cyl", "axis"],
              },
              add: { type: SchemaType.STRING, nullable: true },
              pd: { type: SchemaType.STRING, nullable: true },
            },
            required: ["od", "os"],
          },
        },
      });

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ]);

      const text = result.response.text();
      rawData = extractJsonObject(text);
    } catch (err: any) {
      console.warn(`Primary structured model (${PRIMARY_MODEL}) failed:`, err?.message);
      lastError = err;
    }

    // Attempt 2: Fallback across candidate models with relaxed JSON parsing
    if (!rawData) {
      for (const candidate of FALLBACK_MODELS) {
        try {
          const fallbackModel = genAI.getGenerativeModel({
            model: candidate,
            generationConfig: {
              responseMimeType: "application/json",
            },
          });

          const result = await fallbackModel.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ]);

          const text = result.response.text();
          rawData = extractJsonObject(text);
          if (rawData) break;
        } catch (fbErr: any) {
          console.warn(`Fallback model (${candidate}) failed:`, fbErr?.message);
          lastError = fbErr;
        }
      }
    }

    if (!rawData) {
      throw lastError || new Error("Unable to parse prescription with available AI models.");
    }

    // Sanitize and snap to our exact 0.25 step interval arrays
    const sanitizedData = {
      od: {
        sph: snapToInterval(rawData.od?.sph, -16.0, 16.0, "0.00"),
        cyl: snapToInterval(rawData.od?.cyl, -4.0, 4.0, "0.00"),
        axis: snapAxis(rawData.od?.axis),
      },
      os: {
        sph: snapToInterval(rawData.os?.sph, -16.0, 16.0, "0.00"),
        cyl: snapToInterval(rawData.os?.cyl, -4.0, 4.0, "0.00"),
        axis: snapAxis(rawData.os?.axis),
      },
      add: snapAdd(rawData.add),
      pd: rawData.pd ? String(rawData.pd).trim() : null,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error: any) {
    console.error("Prescription AI Scan Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not auto-read prescription numbers clearly. Please tap the fields below to enter them manually.",
      },
      { status: 500 }
    );
  }
}
