import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Max size: 8 MB
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body as { imageData?: string };

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { success: false, error: "No image data provided." },
        { status: 400 }
      );
    }

    if (!imageData.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "Invalid image format." },
        { status: 400 }
      );
    }

    // Rough size check on base64 payload
    const base64Part = imageData.split(",")[1] ?? "";
    const byteLength = Math.ceil((base64Part.length * 3) / 4);
    if (byteLength > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image exceeds maximum allowed size." },
        { status: 413 }
      );
    }

    const result = await uploadToCloudinary(
      imageData,
      "myeyes/pd-measurements",
      ["pd-capture", "optical-analysis"]
    );

    return NextResponse.json({
      success: true,
      assetUrl: result.secure_url,
      assetId: result.public_id,
    });
  } catch (error: unknown) {
    console.error("[PD Upload] Internal error:", error);
    return NextResponse.json(
      { success: false, error: "Optical frame processing failed. Please try again." },
      { status: 500 }
    );
  }
}
