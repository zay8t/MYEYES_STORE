import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, age, whatsapp, frameId } = body;

    if (!name || !age || !whatsapp) {
      return NextResponse.json(
        { error: "name, age, and whatsapp are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        age: parseInt(String(age), 10),
        whatsapp: String(whatsapp).trim(),
        frameId: frameId ? String(frameId) : null,
        status: "abandoned",
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
