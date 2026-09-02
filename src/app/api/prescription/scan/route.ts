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
  if (raw === null || raw === undefined || raw === "" || raw === "None" || raw === "PL") {
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
  if (!raw || raw === "null" || raw === "none") return null;
  const str = String(raw).trim().replace(/^[+]/, "");
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;
  const rounded = Math.round(num * 4) / 4;
  const clamped = Math.max(0.75, Math.min(3.50, rounded));
  return `+${clamped.toFixed(2)}`;
}

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
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            od: {
              type: SchemaType.OBJECT,
              description: "Right Eye (OD) optical prescription values",
              properties: {
                sph: {
                  type: SchemaType.STRING,
                  description: "Sphere (SPH/SPHERICAL/PWR) power (e.g. +1.50, -0.25, 0.00, Plano/PL)",
                },
                cyl: {
                  type: SchemaType.STRING,
                  description: "Cylinder (CYL/CYLINDRICAL) power (e.g. -0.50, +1.00, 0.00, Nil/None)",
                },
                axis: {
                  type: SchemaType.STRING,
                  description: "Axis in degrees between 1 and 180 (e.g. 90, 180, 45)",
                },
              },
              required: ["sph", "cyl", "axis"],
            },
            os: {
              type: SchemaType.OBJECT,
              description: "Left Eye (OS/O.S.) optical prescription values",
              properties: {
                sph: {
                  type: SchemaType.STRING,
                  description: "Sphere (SPH/SPHERICAL/PWR) power (e.g. +1.50, -0.25, 0.00, Plano/PL)",
                },
                cyl: {
                  type: SchemaType.STRING,
                  description: "Cylinder (CYL/CYLINDRICAL) power (e.g. -0.50, +1.00, 0.00, Nil/None)",
                },
                axis: {
                  type: SchemaType.STRING,
                  description: "Axis in degrees between 1 and 180 (e.g. 90, 180, 45)",
                },
              },
              required: ["sph", "cyl", "axis"],
            },
            add: {
              type: SchemaType.STRING,
              nullable: true,
              description: "Reading Addition (ADD / NV / Near Vision / Bifocal Addition) e.g. +1.50, +2.00, or null if distance only",
            },
            pd: {
              type: SchemaType.STRING,
              nullable: true,
              description: "Pupillary distance (PD / IPD) in mm if listed, or null",
            },
          },
          required: ["od", "os"],
        },
      },
    });

    const prompt = `You are an expert optical laboratory assistant analyzing an ophthalmologist/optometrist prescription slip.
Examine the doctor's handwriting or printed prescription carefully:
1. OD (Right Eye) and OS/O.S. (Left Eye).
2. SPH (Sphere/Power/Spherical): identify positive (+) or negative (-) signs. Round to the nearest 0.25 step between -16.00 and +16.00 (or "0.00" for Plano/PL/Nil).
3. CYL (Cylinder/Astigmatism): identify sign. Round to nearest 0.25 step between -4.00 and +4.00 (or "0.00" for Nil/None/Plano).
4. AXIS: Integer between 1 and 180 degrees. If cylinder is 0.00/nil, output "180".
5. ADD (Addition/Near Vision/Reading): extract reading power (e.g. +1.50, +2.00, +2.50) if indicated for presbyopia/reading/bifocal/progressive. Otherwise null.
6. PD: Pupillary distance in mm if mentioned (e.g. 62, 64), otherwise null.

Format numbers with explicit signs (+ or -) and 2 decimal places (e.g. "+1.25", "-1.50", "0.00"). Return valid JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    const rawData = JSON.parse(responseText);

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
        error: error?.message || "Failed to scan prescription slip with AI.",
      },
      { status: 500 }
    );
  }
}
