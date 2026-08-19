import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "myeyes/frames";
      const tag = formData.get("tag") as string | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      // Convert file stream to base64 for Cloudinary SDK upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type;
      const base64Data = buffer.toString("base64");
      const fileStr = `data:${mimeType};base64,${base64Data}`;
      
      const tags = tag ? [tag] : undefined;
      const uploadRes = await uploadToCloudinary(fileStr, folder, tags);
      return NextResponse.json({
        success: true,
        url: uploadRes.secure_url,
        secure_url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    } else {
      // Accept direct base64 encoded JSON body
      const body = await request.json();
      const { file, folder, tag } = body;
      if (!file) {
        return NextResponse.json({ error: "No base64 file data provided" }, { status: 400 });
      }
      
      const tags = tag ? [tag] : undefined;
      const uploadRes = await uploadToCloudinary(file, folder || "myeyes/frames", tags);
      return NextResponse.json({
        success: true,
        url: uploadRes.secure_url,
        secure_url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
      });
    }
  } catch (error: unknown) {
    console.error("API upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file to Cloudinary";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
