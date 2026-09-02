import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Normalizes Pakistani mobile phone numbers into standardized formats.
 * Accepts: "03001234567", "+923001234567", "923001234567", "0300-1234567", "0300 1234567"
 * Returns: { standardPhone: "03001234567", intlPhone: "+923001234567", coreDigits: "3001234567" }
 */
function normalizePakistaniPhone(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "");
  let coreDigits = digits;

  if (digits.startsWith("92") && digits.length >= 12) {
    coreDigits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length >= 11) {
    coreDigits = digits.slice(1);
  }

  // Ensure starts with 3 (Pakistani mobile operator prefix)
  if (coreDigits.startsWith("3") && coreDigits.length === 10) {
    return {
      standardPhone: `0${coreDigits}`,
      intlPhone: `+92${coreDigits}`,
      coreDigits,
      isValid: true,
    };
  }

  // Fallback for non-standard formats with at least 10 digits
  return {
    standardPhone: digits.startsWith("0") ? digits : `0${digits}`,
    intlPhone: digits.startsWith("92") ? `+${digits}` : `+92${digits}`,
    coreDigits: digits,
    isValid: digits.length >= 10,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || body.whatsapp || "").trim();
    const frameId = body.frameId ? String(body.frameId) : null;
    const frameName = String(body.frameName || "Selected Frame").trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "A valid customer name is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "A valid mobile number is required." },
        { status: 400 }
      );
    }

    const { standardPhone, intlPhone, coreDigits } = normalizePakistaniPhone(phone);

    // ─── Deduplication Logic ────────────────────────────────────────────────
    // Look for existing ACTIVE lead with this phone number across standard variants
    const existingLead = await prisma.lead.findFirst({
      where: {
        status: { in: ["ACTIVE", "active", "abandoned"] },
        OR: [
          { whatsapp: standardPhone },
          { whatsapp: intlPhone },
          { whatsapp: { contains: coreDigits } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existingLead) {
      // Update existing record with the latest frameName, frameId, customer name, and timestamp
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name,
          whatsapp: standardPhone,
          frameId: frameId || existingLead.frameId,
          frameName: frameName || existingLead.frameName,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        leadId: updatedLead.id,
        action: "updated",
      });
    }

    // Insert new Active Lead
    const newLead = await prisma.lead.create({
      data: {
        name,
        whatsapp: standardPhone,
        frameId,
        frameName,
        age: 0,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        leadId: newLead.id,
        action: "created",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Partial lead persistence failed:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
