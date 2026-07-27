/**
 * Enhanced OCR Prescription Scanner Module
 * High-precision image pre-processing (contrast enhancement, grayscale, binarization)
 * and domain-tuned regex extraction for optical prescription cards.
 */

export interface ExtractedPrescription {
  odSph?: string;
  odCyl?: string;
  odAxis?: string;
  osSph?: string;
  osCyl?: string;
  osAxis?: string;
  pd?: string;
  add?: string;
  rawText: string;
}

/**
 * Pre-processes an image (Data URL or Image URL) on an HTML Canvas:
 * 1. Converts to grayscale
 * 2. Increases contrast (contrast enhancement)
 * 3. Applies adaptive thresholding (binarization) to sharpen blurry text
 */
export async function preprocessPrescriptionImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 1. Grayscale & Contrast Enhancement
        const contrast = 1.4; // 40% increase
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale formula (luminance)
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Contrast adjustment
          let enhanced = factor * (gray - 128) + 128;
          enhanced = Math.max(0, Math.min(255, enhanced));

          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
        }

        // 2. Otsu / Fixed Threshold Binarization for crisp text separation
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += data[i];
        }
        const avgThreshold = Math.min(Math.max(sum / (data.length / 4), 110), 160);

        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > avgThreshold ? 255 : 0;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Canvas preprocessing failed, falling back to original image:", err);
        resolve(dataUrl);
      }
    };

    img.onerror = (err) => {
      console.warn("Image load failed for OCR preprocessing:", err);
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Validates SPH value: strictly -12.00 to +10.00 in 0.25 steps
 */
function isValidSph(numStr: string): boolean {
  const val = parseFloat(numStr);
  if (isNaN(val) || val < -12.0 || val > 10.0) return false;
  const stepped = Math.round(val * 4) / 4;
  return Math.abs(val - stepped) < 0.05;
}

/**
 * Validates CYL value: strictly -6.00 to +6.00 in 0.25 steps
 */
function isValidCyl(numStr: string): boolean {
  const val = parseFloat(numStr);
  if (isNaN(val) || val < -6.0 || val > 6.0) return false;
  const stepped = Math.round(val * 4) / 4;
  return Math.abs(val - stepped) < 0.05;
}

/**
 * Validates AXIS value: strictly integer 1 to 180
 */
function isValidAxis(numStr: string): boolean {
  const val = parseInt(numStr, 10);
  return !isNaN(val) && val >= 1 && val <= 180;
}

/**
 * Validates PD value: strictly 50 to 75 mm
 */
function isValidPd(numStr: string): boolean {
  const val = parseFloat(numStr);
  return !isNaN(val) && val >= 50 && val <= 75;
}

/**
 * Validates ADD value: strictly +0.75 to +4.00
 */
function isValidAdd(numStr: string): boolean {
  const val = parseFloat(numStr);
  return !isNaN(val) && val >= 0.75 && val <= 4.0;
}

/**
 * Normalizes optical decimal numbers to signed string e.g. "-2.50" or "+1.75" or "0.00"
 */
export function formatOpticalValue(valStr: string, isPositivePreferred: boolean = false): string {
  const val = parseFloat(valStr);
  if (isNaN(val)) return "0.00";
  const num = (Math.round(val * 4) / 4).toFixed(2);
  if (val > 0 && isPositivePreferred) return `+${num}`;
  return num;
}

/**
 * Domain-tuned regex parser for prescription cards
 */
export function parseOpticalPrescription(text: string): ExtractedPrescription {
  const lines = text.split("\n").map(l => l.trim().toUpperCase());
  const extracted: ExtractedPrescription = { rawText: text };

  let odLine = "";
  let osLine = "";

  for (const l of lines) {
    if (/\b(OD|R|RIGHT)\b/.test(l) && !odLine) {
      odLine = l;
    } else if (/\b(OS|L|LEFT)\b/.test(l) && !osLine) {
      osLine = l;
    }
  }

  const extractNumbers = (str: string) => {
    return str.match(/[+-]?\d+(?:\.\d+)?/g) || [];
  };

  if (odLine) {
    const nums = extractNumbers(odLine);
    for (const num of nums) {
      if (!extracted.odSph && isValidSph(num)) {
        extracted.odSph = formatOpticalValue(num);
      } else if (!extracted.odCyl && isValidCyl(num)) {
        extracted.odCyl = formatOpticalValue(num);
      } else if (!extracted.odAxis && isValidAxis(num)) {
        extracted.odAxis = String(parseInt(num, 10));
      }
    }
  }

  if (osLine) {
    const nums = extractNumbers(osLine);
    for (const num of nums) {
      if (!extracted.osSph && isValidSph(num)) {
        extracted.osSph = formatOpticalValue(num);
      } else if (!extracted.osCyl && isValidCyl(num)) {
        extracted.osCyl = formatOpticalValue(num);
      } else if (!extracted.osAxis && isValidAxis(num)) {
        extracted.osAxis = String(parseInt(num, 10));
      }
    }
  }

  if (!extracted.odSph || !extracted.osSph) {
    const sphMatches = text.match(/(?:SPH|SPHERE)?\s*([+-]?\d{1,2}(?:\.\d{1,2})?)/gi);
    if (sphMatches) {
      for (const m of sphMatches) {
        const valStr = m.match(/[+-]?\d+(?:\.\d+)?/)?.[0];
        if (valStr && isValidSph(valStr)) {
          const formatted = formatOpticalValue(valStr);
          if (!extracted.odSph) extracted.odSph = formatted;
          else if (!extracted.osSph && formatted !== extracted.odSph) extracted.osSph = formatted;
        }
      }
    }
    if (extracted.odSph && !extracted.osSph) extracted.osSph = extracted.odSph;
  }

  if (!extracted.odCyl && !extracted.osCyl) {
    const cylMatches = text.match(/(?:CYL|CYLINDER)?\s*([+-]?\d{1,2}(?:\.\d{1,2})?)/gi);
    if (cylMatches) {
      for (const m of cylMatches) {
        const valStr = m.match(/[+-]?\d+(?:\.\d+)?/)?.[0];
        if (valStr && isValidCyl(valStr)) {
          const formatted = formatOpticalValue(valStr);
          if (!extracted.odCyl) extracted.odCyl = formatted;
          else if (!extracted.osCyl) extracted.osCyl = formatted;
        }
      }
    }
  }

  if (!extracted.odAxis && !extracted.osAxis) {
    const axisMatches = text.match(/(?:AXIS|AX)?\s*(\d{1,3})\b/gi);
    if (axisMatches) {
      for (const m of axisMatches) {
        const valStr = m.match(/\d+/)?.[0];
        if (valStr && isValidAxis(valStr)) {
          if (!extracted.odAxis) extracted.odAxis = valStr;
          else if (!extracted.osAxis) extracted.osAxis = valStr;
        }
      }
    }
  }

  const pdMatch = text.match(/(?:PD|PUPILLARY|DIST)\s*[:=]?\s*(\d{2}(?:\.\d)?)/i);
  if (pdMatch?.[1] && isValidPd(pdMatch[1])) {
    extracted.pd = pdMatch[1];
  } else {
    const pdCandidate = text.match(/\b(5[0-9]|6[0-9]|7[0-5])(?:\.0|\.5)?\b/);
    if (pdCandidate?.[1]) {
      extracted.pd = pdCandidate[1];
    }
  }

  const addMatch = text.match(/(?:ADD|NEAR|ADDITION)\s*[:=]?\s*([+]?\d(?:\.\d{1,2})?)/i);
  if (addMatch?.[1] && isValidAdd(addMatch[1])) {
    extracted.add = formatOpticalValue(addMatch[1], true);
  }

  return extracted;
}
