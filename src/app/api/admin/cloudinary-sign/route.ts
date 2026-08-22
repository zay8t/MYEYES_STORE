import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { folder = "myeyes/3d-models", public_id } = body;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret || apiSecret === "**********" || apiSecret.trim() === "") {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured on server" },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    if (public_id) {
      paramsToSign.public_id = public_id;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
      public_id: public_id || undefined,
    });
  } catch (error: any) {
    console.error("Failed to generate Cloudinary signature:", error);
    return NextResponse.json(
      { error: error?.message || "Signature generation failed" },
      { status: 500 }
    );
  }
}
