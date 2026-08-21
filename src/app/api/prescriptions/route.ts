import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { z } from "zod";

const PrescriptionSchema = z.object({
  title: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  odSph: z.number().optional(),
  odCyl: z.number().optional(),
  odAxis: z.number().int().min(0).max(180).optional(),
  osSph: z.number().optional(),
  osCyl: z.number().optional(),
  osAxis: z.number().int().min(0).max(180).optional(),
  pd: z.number().optional(),
  addPower: z.number().optional(),
  prescriptionType: z.enum(["SINGLE_VISION", "PROGRESSIVE", "BIFOCAL"]).optional(),
  slipImageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prescriptions = await prisma.savedPrescription.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ prescriptions });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const validation = PrescriptionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid data", details: validation.error.flatten() }, { status: 400 });
  }

  const data = validation.data;

  // If setting as default, unset all others first
  if (data.isDefault) {
    await prisma.savedPrescription.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    });
  }

  const prescription = await prisma.savedPrescription.create({
    data: {
      userId: session.userId,
      title: data.title || "My Everyday Prescription",
      isDefault: data.isDefault ?? false,
      odSph: data.odSph,
      odCyl: data.odCyl,
      odAxis: data.odAxis,
      osSph: data.osSph,
      osCyl: data.osCyl,
      osAxis: data.osAxis,
      pd: data.pd,
      addPower: data.addPower,
      prescriptionType: data.prescriptionType || "SINGLE_VISION",
      slipImageUrl: data.slipImageUrl || null,
      notes: data.notes,
    },
  });

  return NextResponse.json({ prescription }, { status: 201 });
}
