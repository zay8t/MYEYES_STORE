"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RawLandmarks,
  calculatePDFromLandmarks,
  PDResult,
  CARD_WIDTH_MM,
} from "@/lib/optical/pdCalculator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDCanvasEditorHandle {
  getLandmarks: () => RawLandmarks | null;
  getPDResult: () => PDResult | null;
}

interface PDCanvasEditorProps {
  imageDataUrl: string;
  onResultChange?: (result: PDResult | null, error: string | null) => void;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

type DragTarget = "leftPupil" | "rightPupil" | "cardLeft" | "cardRight" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const PUPIL_RADIUS = 8;
const CARD_HANDLE_SIZE = 12;
const MAGNIFIER_RADIUS = 64;
const MAGNIFIER_ZOOM = 3.5;

const COLORS = {
  leftPupil: "#ff7a00",
  rightPupil: "#ff7a00",
  pdLine: "rgba(255, 122, 0, 0.85)",
  card: "#0ea5e9",
  magnifier: "rgba(255,255,255,0.95)",
};

// ─── Component ────────────────────────────────────────────────────────────────

const PDCanvasEditor = forwardRef<PDCanvasEditorHandle, PDCanvasEditorProps>(
  function PDCanvasEditor({ imageDataUrl, onResultChange, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 1, h: 1 });

    // Landmark positions in canvas-pixel space
    const [leftPupil, setLeftPupil] = useState<Point>({ x: 0, y: 0 });
    const [rightPupil, setRightPupil] = useState<Point>({ x: 0, y: 0 });
    const [cardLeft, setCardLeft] = useState<Point>({ x: 0, y: 0 });
    const [cardRight, setCardRight] = useState<Point>({ x: 0, y: 0 });

    const [dragging, setDragging] = useState<DragTarget>(null);
    const [mousePos, setMousePos] = useState<Point | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [pdResult, setPdResult] = useState<PDResult | null>(null);

    // Expose to parent
    useImperativeHandle(ref, () => ({
      getLandmarks: () =>
        initialized
          ? {
              leftPupilX: leftPupil.x,
              rightPupilX: rightPupil.x,
              cardLeftX: cardLeft.x,
              cardRightX: cardRight.x,
            }
          : null,
      getPDResult: () => pdResult,
    }));

    // ── Load image & initialize default landmark positions ──────────────────

    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const maxW = container ? container.clientWidth : 640;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        setCanvasSize({ w, h });

        // Default landmark guesses
        const cx = w / 2;
        const cy = h * 0.45;
        const eyeSpan = w * 0.14;
        setLeftPupil({ x: cx - eyeSpan, y: cy });
        setRightPupil({ x: cx + eyeSpan, y: cy });

        const cardY = h * 0.82;
        const cardMargin = w * 0.08;
        setCardLeft({ x: cardMargin, y: cardY });
        setCardRight({ x: w - cardMargin, y: cardY });
        setInitialized(true);
      };
      img.src = imageDataUrl;
    }, [imageDataUrl]);

    // ── Recalculate PD whenever landmarks change ─────────────────────────────

    const recalcPD = useCallback(() => {
      if (!initialized) return;
      try {
        const result = calculatePDFromLandmarks({
          leftPupilX: leftPupil.x,
          rightPupilX: rightPupil.x,
          cardLeftX: cardLeft.x,
          cardRightX: cardRight.x,
        });
        setPdResult(result);
        onResultChange?.(result, null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Measurement error.";
        setPdResult(null);
        onResultChange?.(null, msg);
      }
    }, [initialized, leftPupil, rightPupil, cardLeft, cardRight, onResultChange]);

    useEffect(() => {
      recalcPD();
    }, [recalcPD]);

    // ── Canvas Draw ──────────────────────────────────────────────────────────

    useEffect(() => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img || !initialized) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // ── Card reference line
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COLORS.card;
      ctx.lineWidth = 1.5;
      ctx.moveTo(cardLeft.x, cardLeft.y);
      ctx.lineTo(cardRight.x, cardRight.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Card handles
      drawHandle(ctx, cardLeft, CARD_HANDLE_SIZE, COLORS.card);
      drawHandle(ctx, cardRight, CARD_HANDLE_SIZE, COLORS.card);

      // Card label
      const cardMidX = (cardLeft.x + cardRight.x) / 2;
      const cardMidY = (cardLeft.y + cardRight.y) / 2;
      drawLabel(ctx, `ID Card — ${CARD_WIDTH_MM} mm`, cardMidX, cardMidY - 14, COLORS.card);

      // ── PD measurement line
      const pdMidY = (leftPupil.y + rightPupil.y) / 2;
      ctx.beginPath();
      ctx.strokeStyle = COLORS.pdLine;
      ctx.lineWidth = 2;
      ctx.moveTo(leftPupil.x, pdMidY);
      ctx.lineTo(rightPupil.x, pdMidY);
      ctx.stroke();

      // Tick marks at each pupil on the PD line
      [leftPupil.x, rightPupil.x].forEach((x) => {
        ctx.beginPath();
        ctx.strokeStyle = COLORS.pdLine;
        ctx.lineWidth = 1.5;
        ctx.moveTo(x, pdMidY - 5);
        ctx.lineTo(x, pdMidY + 5);
        ctx.stroke();
      });

      // PD label above line
      if (pdResult) {
        const pdMidX = (leftPupil.x + rightPupil.x) / 2;
        const label = `PD: ${pdResult.binocularPD} mm  (R ${pdResult.rightPD} / L ${pdResult.leftPD})`;
        drawLabel(ctx, label, pdMidX, pdMidY - 14, COLORS.pdLine, true);
      }

      // ── Pupil markers
      drawPupil(ctx, leftPupil, PUPIL_RADIUS, COLORS.leftPupil, "L");
      drawPupil(ctx, rightPupil, PUPIL_RADIUS, COLORS.rightPupil, "R");

      // ── Magnifier loupe at drag point
      if (dragging && mousePos) {
        drawMagnifier(ctx, canvas, mousePos, MAGNIFIER_RADIUS, MAGNIFIER_ZOOM);
      }
    }, [
      leftPupil,
      rightPupil,
      cardLeft,
      cardRight,
      pdResult,
      dragging,
      mousePos,
      initialized,
      canvasSize,
    ]);

    // ── Pointer Events ───────────────────────────────────────────────────────

    const getCanvasPoint = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
          x: ((e.clientX - rect.left) / rect.width) * canvasSize.w,
          y: ((e.clientY - rect.top) / rect.height) * canvasSize.h,
        };
      },
      [canvasSize]
    );

    const hitTest = useCallback(
      (p: Point): DragTarget => {
        const dist = (a: Point, b: Point) =>
          Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        const hitRadius = 16;
        if (dist(p, leftPupil) < hitRadius) return "leftPupil";
        if (dist(p, rightPupil) < hitRadius) return "rightPupil";
        if (dist(p, cardLeft) < hitRadius) return "cardLeft";
        if (dist(p, cardRight) < hitRadius) return "cardRight";
        return null;
      },
      [leftPupil, rightPupil, cardLeft, cardRight]
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const p = getCanvasPoint(e);
        const target = hitTest(p);
        if (target) {
          setDragging(target);
          setMousePos(p);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        }
      },
      [getCanvasPoint, hitTest]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const p = getCanvasPoint(e);
        setMousePos(p);
        if (!dragging) return;
        const clampedX = Math.max(0, Math.min(canvasSize.w, p.x));
        const clampedY = Math.max(0, Math.min(canvasSize.h, p.y));
        const clamped = { x: clampedX, y: clampedY };
        if (dragging === "leftPupil") setLeftPupil(clamped);
        else if (dragging === "rightPupil") setRightPupil(clamped);
        else if (dragging === "cardLeft") setCardLeft(clamped);
        else if (dragging === "cardRight") setCardRight(clamped);
      },
      [dragging, getCanvasPoint, canvasSize]
    );

    const handlePointerUp = useCallback(() => {
      setDragging(null);
    }, []);

    const cursorClass =
      dragging
        ? "cursor-grabbing"
        : "cursor-grab";

    return (
      <div className={cn("relative w-full select-none", className)}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className={cn("w-full rounded-xl border border-slate-200 shadow-sm touch-none", cursorClass)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Measurement badge */}
        {pdResult && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 shadow-sm pointer-events-none">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#ff7a00] shrink-0" />
              <span className="text-xs font-bold text-slate-900">
                {pdResult.binocularPD} mm
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                R {pdResult.rightPD} / L {pdResult.leftPD}
              </span>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                pdResult.withinTolerance
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}
            >
              {pdResult.withinTolerance ? "Within tolerance" : "Review required"}
            </span>
          </div>
        )}

        <p className="mt-2 text-[10px] text-slate-400 font-medium text-center">
          Drag the <span className="text-[#ff7a00] font-bold">orange</span> circles (pupils) and the{" "}
          <span className="text-sky-500 font-bold">blue</span> handles (card edges) to calibrate
        </p>
      </div>
    );
  }
);

PDCanvasEditor.displayName = "PDCanvasEditor";
export default PDCanvasEditor;

// ─── Canvas Drawing Helpers ───────────────────────────────────────────────────

function drawPupil(
  ctx: CanvasRenderingContext2D,
  p: Point,
  r: number,
  color: string,
  label: string
) {
  // Outer ring
  ctx.beginPath();
  ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Filled circle
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Centre dot
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  // Eye label
  ctx.font = "bold 9px ui-sans-serif,system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(label, p.x, p.y + 3);
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  color: string
) {
  const half = size / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(p.x - half, p.y - half, size, size, 3);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  bold = false
) {
  ctx.font = `${bold ? "bold " : ""}10px ui-sans-serif,system-ui,sans-serif`;
  ctx.textAlign = "center";

  // Shadow bg
  const metrics = ctx.measureText(text);
  const pad = 4;
  const bx = x - metrics.width / 2 - pad;
  const by = y - 11;
  const bw = metrics.width + pad * 2;
  const bh = 14;

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawMagnifier(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  center: Point,
  radius: number,
  zoom: number
) {
  const mx = center.x + radius + 12;
  const my = center.y - radius - 12;

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, radius, 0, Math.PI * 2);
  ctx.clip();

  // Draw zoomed canvas region
  const srcX = center.x - radius / zoom;
  const srcY = center.y - radius / zoom;
  const srcW = (radius * 2) / zoom;
  const srcH = (radius * 2) / zoom;
  ctx.drawImage(
    canvas,
    srcX, srcY, srcW, srcH,
    mx - radius, my - radius, radius * 2, radius * 2
  );
  ctx.restore();

  // Magnifier border
  ctx.beginPath();
  ctx.arc(mx, my, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,122,0,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Crosshair
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,122,0,0.8)";
  ctx.lineWidth = 1;
  ctx.moveTo(mx - 8, my);
  ctx.lineTo(mx + 8, my);
  ctx.moveTo(mx, my - 8);
  ctx.lineTo(mx, my + 8);
  ctx.stroke();
}
