import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No 3D file provided" }, { status: 400 });
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

    if (cloudName && apiKey && apiSecret && apiSecret !== "**********") {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "myeyes/3d-frames",
            resource_type: "raw",
            public_id: `frame_${productId || Date.now()}`,
            overwrite: true,
          },
          (err, res) => {
            if (err) reject(err);
            else if (res) resolve(res);
            else reject(new Error("No response from Cloudinary upload"));
          }
        );
        stream.end(buffer);
      });
      modelUrl = uploadResult.secure_url;
    } else {
      // Fallback base64 data URI if Cloudinary credentials are not present
      const base64Data = buffer.toString("base64");
      modelUrl = `data:model/gltf-binary;base64,${base64Data}`;
    }

    // Update database if productId provided
    if (productId && productId.trim()) {
      await prisma.product.update({
        where: { id: productId.trim() },
        data: { modelGlbUrl: modelUrl },
      });
    }

    return NextResponse.json({
      success: true,
      modelUrl,
    });
  } catch (error) {
    console.error("GLB Upload error:", error);
    return NextResponse.json({ error: "Failed to upload GLB model" }, { status: 500 });
  }
}
