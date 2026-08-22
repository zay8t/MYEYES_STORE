import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = (formData.get("productId") as string) || "temp";

    if (!file) {
      return NextResponse.json({ error: "No 3D file received" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".glb")) {
      return NextResponse.json({ error: "Only .glb files are supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let modelUrl = "";

    if (cloudName && apiKey && apiSecret && apiSecret !== "**********" && apiSecret.trim() !== "") {
      const sanitizedId = (productId || "frame").replace(/[^a-zA-Z0-9_-]/g, "");
      const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "myeyes/3d-models",
            resource_type: "raw",
            public_id: `frame_${sanitizedId}_${Date.now()}.glb`,
            use_filename: true,
            unique_filename: false,
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("No response received from Cloudinary"));
          }
        );
        stream.end(buffer);
      });
      modelUrl = uploadResponse.secure_url;
    } else {
      // Fallback base64 data URI if Cloudinary credentials are not present in current env
      const base64Data = buffer.toString("base64");
      modelUrl = `data:model/gltf-binary;base64,${base64Data}`;
    }

    // Safely update database if a valid existing productId is provided
    if (productId && productId !== "temp" && productId.trim().length > 0) {
      try {
        const existing = await prisma.product.findUnique({
          where: { id: productId.trim() },
          select: { id: true },
        });
        if (existing) {
          await prisma.product.update({
            where: { id: productId.trim() },
            data: { modelGlbUrl: modelUrl },
          });
        }
      } catch (dbErr) {
        console.warn("Product record not found for auto-update, returning modelUrl directly:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      modelUrl,
    });
  } catch (error: any) {
    console.error("Cloudinary Raw 3D Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload 3D model to Cloudinary" },
      { status: 500 }
    );
  }
}
