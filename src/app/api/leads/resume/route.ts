import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId") || searchParams.get("resumeLeadId");

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId parameter" }, { status: 400 });
  }

  try {
    // Look up the lead in the Lead model
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Look up associated frame product if frameId exists
    let frame = null;
    if (lead.frameId) {
      frame = await prisma.product.findUnique({
        where: { id: lead.frameId },
      });
      // Fallback search by slug or name if ID didn't match directly
      if (!frame) {
        frame = await prisma.product.findFirst({
          where: {
            OR: [
              { slug: lead.frameId },
              { name: lead.frameName || undefined },
            ],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: lead.id,
        customerName: lead.name,
        mobileNumber: lead.whatsapp,
        frameId: lead.frameId,
        frameName: lead.frameName || frame?.name || "Selected Frame",
        frame: frame
          ? {
              id: frame.id,
              name: frame.name,
              slug: frame.slug,
              price: frame.price,
              images: frame.images,
              image_url: frame.image_url,
              colors: frame.colors,
              material: frame.material,
              frameShape: frame.frameShape,
            }
          : null,
        step: "prescription_upload",
      },
    });
  } catch (error) {
    console.error("Failed to restore lead cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
