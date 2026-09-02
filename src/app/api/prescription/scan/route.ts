import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { uploadToCloudinary } from "@/lib/cloudinary";

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

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
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

    // Convert file arrayBuffer to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // Upload prescription slip to permanent Cloudinary storage
    let slipUrl: string | null = null;
    try {
      const uploadRes = await uploadToCloudinary(dataUri, "myeyes/prescriptions", ["prescription-slip"]);
      if (uploadRes?.secure_url && !uploadRes.secure_url.startsWith("data:")) {
        slipUrl = uploadRes.secure_url;
      }
    } catch (uploadErr) {
      console.warn("Cloudinary upload issue:", uploadErr);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // If API key is missing, return success with slipUrl so customer isn't blocked
      return NextResponse.json({
        success: true,
        slipUrl,
        data: null,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert optical laboratory optician analyzing an ophthalmologist/optometrist prescription slip.
Examine the doctor's handwriting or printed prescription carefully:
1. OD (Right Eye) and OS/O.S. (Left Eye).
2. SPH (Sphere/Power/Spherical): identify positive (+) or negative (-) signs. Preserve +/- signs with 2 decimal places (-16.00 to +16.00, or "0.00" for Plano/PL/Nil).
3. CYL (Cylinder/Astigmatism): identify sign. Preserve +/- signs with 2 decimal places (-4.00 to +4.00, or "0.00" for Nil/None/Plano).
4. AXIS: Integer between 1 and 180 degrees. If cylinder is 0.00/nil, output "180".
5. ADD (Addition/Near Vision/Reading): extract reading power (e.g. +1.50, +2.00, +2.50) if indicated for presbyopia/reading/bifocal/progressive. Otherwise null.
6. PD: Pupillary distance in mm if mentioned (e.g. 62, 64), otherwise null.

Return valid structured JSON matching the schema.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        od: {
          type: Type.OBJECT,
          description: "Right Eye (OD) optical prescription values",
          properties: {
            sph: { type: Type.STRING },
            cyl: { type: Type.STRING },
            axis: { type: Type.STRING },
          },
          required: ["sph", "cyl", "axis"],
        },
        os: {
          type: Type.OBJECT,
          description: "Left Eye (OS/O.S.) optical prescription values",
          properties: {
            sph: { type: Type.STRING },
            cyl: { type: Type.STRING },
            axis: { type: Type.STRING },
          },
          required: ["sph", "cyl", "axis"],
        },
        add: { type: Type.STRING, nullable: true },
        pd: { type: Type.STRING, nullable: true },
      },
      required: ["od", "os"],
    };

    let rawData: any = null;
    let lastError: any = null;

    // Attempt 1: Primary structured output with gemini-3-flash-preview
    try {
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          prompt,
        ],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const responseText = response.text || "";
      rawData = extractJsonObject(responseText);
    } catch (err: any) {
      console.warn(`Primary structured model (${PRIMARY_MODEL}) failed:`, err?.message);
      lastError = err;
    }

    // Attempt 2: Fallback across candidate models with relaxed JSON parsing
    if (!rawData) {
      for (const candidate of FALLBACK_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: candidate,
            contents: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              prompt,
            ],
            config: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          });

          const responseText = response.text || "";
          rawData = extractJsonObject(responseText);
          if (rawData) break;
        } catch (fbErr: any) {
          console.warn(`Fallback model (${candidate}) failed:`, fbErr?.message);
          lastError = fbErr;
        }
      }
    }

    if (!rawData) {
      throw lastError || new Error("Unable to parse prescription numbers.");
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
      slipUrl,
    });
  } catch (error: any) {
    console.error("Prescription Scan Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "We could not clearly detect all numbers. Please confirm or adjust them manually below.",
      },
      { status: 500 }
    );
  }
}
