import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || body.whatsapp || "").trim();
    const age = body.age ? parseInt(String(body.age), 10) : 0;
    const frameId = body.frameId ? String(body.frameId) : null;
    const frameName = body.frameName ? String(body.frameName).trim() : null;
    const status = body.status ? String(body.status).toUpperCase() : "ACTIVE";

    if (!name || !phone) {
      return NextResponse.json(
        { error: "name and mobile number (phone/whatsapp) are required" },
        { status: 400 }
      );
    }

    const cleanDigits = phone.replace(/\D/g, "");
    const coreDigits = cleanDigits.startsWith("92") && cleanDigits.length >= 12
      ? cleanDigits.slice(2)
      : (cleanDigits.startsWith("0") && cleanDigits.length >= 11 ? cleanDigits.slice(1) : cleanDigits);
    const standardPhone = cleanDigits.startsWith("0") ? cleanDigits : `0${coreDigits}`;

    // Deduplication check
    const existing = await prisma.lead.findFirst({
      where: {
        status: { in: ["ACTIVE", "active", "abandoned"] },
        OR: [
          { whatsapp: standardPhone },
          { whatsapp: { contains: coreDigits } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          name,
          whatsapp: standardPhone,
          frameId: frameId || existing.frameId,
          frameName: frameName || existing.frameName,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        age,
        whatsapp: standardPhone,
        frameId,
        frameName,
        status,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create lead:", error);
    const msg = error instanceof Error ? error.message : "Failed to create lead";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error: unknown) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    const updated = await prisma.lead.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }
    await prisma.lead.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
