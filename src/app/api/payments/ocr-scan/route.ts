import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─────────────────────────────────────────────────────────────────────────────
//  Pakistani Banking TID Regex Patterns
// ─────────────────────────────────────────────────────────────────────────────
interface TidPattern {
  name: string;
  regex: RegExp;
  confidence: number;
}

const TID_PATTERNS: TidPattern[] = [
  // EasyPaisa: "Trx ID: 1234567890" / "Transaction ID: 123456789012"
  {
    name: "EasyPaisa",
    regex: /(?:Trx\s*ID|Transaction\s*ID|TID|Trans\s*ID)[\s:#]*([0-9]{10,15})/gi,
    confidence: 90,
  },
  // JazzCash: "TID: 1234567890"
  {
    name: "JazzCash",
    regex: /(?:TID|Transaction\s*(?:ID|No\.?|Number))[\s:#]*([0-9]{10,15})/gi,
    confidence: 88,
  },
  // HBL / Meezan / Allied — alphanumeric Ref No
  {
    name: "BankRef",
    regex: /(?:Ref(?:erence)?(?:\s*No\.?|\s*Num(?:ber)?|\s*ID)?[\s:#]*)([A-Z0-9]{8,18})/gi,
    confidence: 75,
  },
  // Generic TID label
  {
    name: "GenericTID",
    regex: /(?:T\.?I\.?D\.?|TXNID|Transaction)[\s:#]*([A-Z0-9]{8,20})/gi,
    confidence: 60,
  },
  // Standalone 11-13 digit number (typical Pakistan mobile TID)
  {
    name: "StandaloneDigits",
    regex: /\b([0-9]{11,13})\b/g,
    confidence: 40,
  },
];

async function extractTextFromImageUrl(imageUrl: string): Promise<string> {
  // Attempt Cloudinary OCR transformation (requires OCR addon on account)
  try {
    const ocrUrl = imageUrl.replace(/\/upload\//, "/upload/fl_attachment,e_ocr_text/");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(ocrUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json, text/plain, */*" },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = await res.text();
      if (text.startsWith("{")) {
        try {
          const parsed = JSON.parse(text);
          const ocrData = parsed?.info?.ocr?.adv_ocr?.data;
          if (Array.isArray(ocrData)) {
            return ocrData
              .map((d: { textAnnotations?: { description: string }[] }) =>
                d.textAnnotations?.[0]?.description || ""
              )
              .join("\n");
          }
        } catch { /* not JSON */ }
      }
      if (text.length > 10) return text;
    }
  } catch { /* timeout or network error */ }

  // Fallback: parse URL path for clues
  try {
    const urlPath = new URL(imageUrl).pathname;
    return decodeURIComponent((urlPath.split("/").pop() || "").replace(/[_-]/g, " "));
  } catch {
    return "";
  }
}

interface TidMatch { tid: string; method: string; confidence: number }

function extractTidFromText(text: string): {
  tid: string | null;
  confidence: number;
  method: string;
  allMatches: TidMatch[];
} {
  const allMatches: TidMatch[] = [];
  for (const pattern of TID_PATTERNS) {
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      const candidate = m[1].trim().toUpperCase();
      if (candidate.length < 8 || /^0+$/.test(candidate)) continue;
      allMatches.push({ tid: candidate, method: pattern.name, confidence: pattern.confidence });
    }
  }
  if (!allMatches.length) return { tid: null, confidence: 0, method: "NONE", allMatches: [] };
  allMatches.sort((a, b) => b.confidence - a.confidence);
  const best = allMatches[0];
  return { tid: best.tid, confidence: best.confidence, method: best.method, allMatches };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptUrl, orderId } = body as { receiptUrl?: string; orderId?: string };

    if (!receiptUrl) {
      return NextResponse.json({ error: "receiptUrl is required" }, { status: 400 });
    }

    const rawText = await extractTextFromImageUrl(receiptUrl);
    const result = extractTidFromText(rawText);

    // Persist OCR results to order if orderId provided
    if (orderId && result.tid) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { transactionId: true },
        });
        const isOcrMatched =
          !!order?.transactionId &&
          order.transactionId.trim().toUpperCase() === result.tid.trim().toUpperCase();

        await prisma.order.update({
          where: { id: orderId },
          data: { ocrExtractedTid: result.tid, ocrConfidenceScore: result.confidence, isOcrMatched },
        });
        await prisma.paymentAuditLog.create({
          data: {
            orderId,
            action: "OCR_PARSED",
            actor: "SYSTEM_OCR",
            notes: `OCR TID: ${result.tid} (${result.confidence}% confidence, method: ${result.method}). Customer TID match: ${isOcrMatched}`,
          },
        });
      } catch (dbErr) {
        console.error("OCR DB update failed:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      tid: result.tid,
      confidence: result.confidence,
      method: result.method,
      rawText: rawText.slice(0, 500),
      allMatches: result.allMatches.slice(0, 5),
    });
  } catch (error) {
    console.error("OCR Scan API Error:", error);
    return NextResponse.json({ error: "Failed to process receipt image" }, { status: 500 });
  }
}

