import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      // Convert file stream to base64 for Cloudinary SDK upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type;
      const base64Data = buffer.toString("base64");
      const fileStr = `data:${mimeType};base64,${base64Data}`;
      
      const uploadRes = await uploadToCloudinary(fileStr);
      return NextResponse.json(uploadRes);
    } else {
      // Accept direct base64 encoded JSON body
      const body = await request.json();
      const { file } = body;
      if (!file) {
        return NextResponse.json({ error: "No base64 file data provided" }, { status: 400 });
      }
      
      const uploadRes = await uploadToCloudinary(file);
      return NextResponse.json(uploadRes);
    }
  } catch (error: unknown) {
    console.error("API upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file to Cloudinary";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
