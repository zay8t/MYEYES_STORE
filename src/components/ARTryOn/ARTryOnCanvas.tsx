"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveTryOnImageUrl } from "@/lib/ar/textureLoader";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ARTryOnCanvasHandle {
  capturePhoto: () => void;
}

export interface ARTryOnCanvasProps {
  productImageUrl?: string;
  imageUrl?: string;
  fitOffset?: number;
  lensTint?: "clear" | "blue" | "amber" | "sun";
  activeTint?: "clear" | "blue" | "amber" | "sun";
  onSnapshot?: (dataUrl: string) => void;
  className?: string;
}

type ARStatus =
  | "idle"
  | "requesting"
  | "initializing"
  | "active"
  | "error";

// ─── Helper: Clean Frame Image with Off-Screen Chroma-Key ─────────────────────

function processFrameImage(
  url: string,
  onProcessed: (canvasOrImg: HTMLCanvasElement | HTMLImageElement, aspect: number) => void
) {
  if (!url) return;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    try {
      const w = img.naturalWidth || img.width || 512;
      const h = img.naturalHeight || img.height || 240;
      const aspect = w / Math.max(h, 1);

      const offCanvas = document.createElement("canvas");
      offCanvas.width = w;
      offCanvas.height = h;
      const ctx = offCanvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Convert studio white backgrounds to transparent alpha
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0;
            } else if (r > 225 && g > 225 && b > 225) {
              const brightness = (r + g + b) / 3;
              data[i + 3] = Math.round(a * Math.max(0, (240 - brightness) / 15));
            }
          }

          ctx.putImageData(imgData, 0, 0);
          onProcessed(offCanvas, aspect);
          return;
        } catch {
          // CORS security limitation; fall back to raw image
        }
      }
      onProcessed(img, aspect);
    } catch {
      onProcessed(img, (img.naturalWidth || 512) / (img.naturalHeight || 240));
    }
  };

  img.onerror = () => {
    console.warn("Could not load AR frame image:", url);
  };

  img.src = url;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ARTryOnCanvas = forwardRef<ARTryOnCanvasHandle, ARTryOnCanvasProps>(
  function ARTryOnCanvas(
    {
      productImageUrl,
      imageUrl,
      fitOffset = 0,
      lensTint = "clear",
      activeTint,
      onSnapshot,
      className,
    },
    ref
  ) {
    const activeUrl = resolveTryOnImageUrl({
      imageUrl: productImageUrl || imageUrl,
      frontImage: productImageUrl || imageUrl,
    });
    const currentTint = activeTint || lensTint || "clear";

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const frameDrawableRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
    const frameAspectRef = useRef<number>(2.3);
    const fitOffsetRef = useRef<number>(fitOffset);
    const currentTintRef = useRef<string>(currentTint);

    const faceMeshRef = useRef<{
      send: (opts: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    } | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);

    const [status, setStatus] = useState<ARStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Keep refs in sync with props
    useEffect(() => {
      fitOffsetRef.current = fitOffset;
    }, [fitOffset]);

    useEffect(() => {
      currentTintRef.current = currentTint;
    }, [currentTint]);

    // ── Preload Active Frame Image ──────────────────────────────────────────
    useEffect(() => {
      if (!activeUrl) return;
      processFrameImage(activeUrl, (drawable, aspect) => {
        frameDrawableRef.current = drawable;
        frameAspectRef.current = aspect > 0.5 ? aspect : 2.3;
      });
    }, [activeUrl]);

    // ── Start Camera Stream & MediaPipe 2D Loop ─────────────────────────────
    useEffect(() => {
      let isCancelled = false;

      async function initEngine() {
        setStatus("requesting");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          setStatus("initializing");

          // Dynamically import MediaPipe FaceMesh
          const { FaceMesh } = await import("@mediapipe/face_mesh");
          const faceMesh = new FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          faceMesh.onResults((results: {
            multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
          }) => {
            if (isCancelled || !canvasRef.current || !videoRef.current) return;
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = video.videoWidth || 640;
            const height = video.videoHeight || 480;

            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }

            // Clear previous 2D overlay
            ctx.clearRect(0, 0, width, height);

            // If no face detected or frame asset not ready, skip draw
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
              return;
            }
            if (!frameDrawableRef.current) {
              return;
            }

            const landmarks = results.multiFaceLandmarks[0];

            // Landmark 33: User's Right Eye Outer Canthus
            // Landmark 263: User's Left Eye Outer Canthus
            // Landmark 168: Nasal Root / Sellion
            const pRight = { x: landmarks[33].x * width, y: landmarks[33].y * height };
            const pLeft = { x: landmarks[263].x * width, y: landmarks[263].y * height };
            const bridge = { x: landmarks[168].x * width, y: landmarks[168].y * height };

            // Spatial geometry
            const dx = pLeft.x - pRight.x;
            const dy = pLeft.y - pRight.y;
            const eyeDist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Optical frame width is typically ~2.35x the outer eye distance
            const frameWidth = Math.max(eyeDist * 2.35, 40);
            const aspect = frameAspectRef.current || 2.3;
            const frameHeight = frameWidth / aspect;

            ctx.save();
            // Translate to nasal bridge with vertical adjustment
            ctx.translate(bridge.x, bridge.y + (fitOffsetRef.current * 3));
            ctx.rotate(angle);

            // Draw transparent frame image centered at bridge anchor
            ctx.drawImage(
              frameDrawableRef.current,
              -frameWidth / 2,
              -frameHeight / 2,
              frameWidth,
              frameHeight
            );

            // Optional Lens Tint Filter Overlay
            const tint = currentTintRef.current;
            if (tint === "blue") {
              ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
              ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
            } else if (tint === "amber") {
              ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
              ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
            } else if (tint === "sun") {
              ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
              ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
            }

            ctx.restore();
          });

          faceMeshRef.current = faceMesh;

          // Video frame pump loop (~30 FPS)
          let lastSend = 0;
          const tick = async (now: number) => {
            rafRef.current = requestAnimationFrame(tick);
            if (
              videoRef.current &&
              faceMeshRef.current &&
              videoRef.current.readyState >= 2 &&
              now - lastSend > 33
            ) {
              lastSend = now;
              try {
                await faceMeshRef.current.send({ image: videoRef.current });
              } catch {
                // Non-fatal dropped frame
              }
            }
          };

          rafRef.current = requestAnimationFrame(tick);
          setStatus("active");
        } catch (err) {
          const msg =
            err instanceof DOMException && err.name === "NotAllowedError"
              ? "Camera access denied. Please allow camera permissions."
              : "Camera unavailable. Please check your device.";
          setErrorMsg(msg);
          setStatus("error");
        }
      }

      initEngine();

      return () => {
        isCancelled = true;
        cancelAnimationFrame(rafRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (faceMeshRef.current) {
          try {
            faceMeshRef.current.close();
          } catch {
            // Ignore close errors
          }
        }
      };
    }, []);

    // ── Photo Snapshot Capture ────────────────────────────────────────────
    const capturePhoto = useCallback(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const mergeCanvas = document.createElement("canvas");
      mergeCanvas.width = video.videoWidth || 1280;
      mergeCanvas.height = video.videoHeight || 720;
      const mCtx = mergeCanvas.getContext("2d");
      if (!mCtx) return;

      // 1. Draw mirrored video
      mCtx.save();
      mCtx.scale(-1, 1);
      mCtx.drawImage(video, -mergeCanvas.width, 0, mergeCanvas.width, mergeCanvas.height);
      mCtx.restore();

      // 2. Draw mirrored glasses overlay canvas
      mCtx.save();
      mCtx.scale(-1, 1);
      mCtx.drawImage(canvas, -mergeCanvas.width, 0, mergeCanvas.width, mergeCanvas.height);
      mCtx.restore();

      const dataUrl = mergeCanvas.toDataURL("image/jpeg", 0.95);
      onSnapshot?.(dataUrl);

      // Download snapshot directly
      const link = document.createElement("a");
      link.download = `my-eyes-tryon-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    }, [onSnapshot]);

    useImperativeHandle(ref, () => ({ capturePhoto }));

    // ─── Render ───────────────────────────────────────────────────────────
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 shadow-inner",
          className
        )}
      >
        {/* Mirrored Live Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* 2D HTML5 Canvas Overlay (Mirrored identically to video) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
        />

        {/* Loading / Calibrating Status Overlay */}
        {(status === "requesting" || status === "initializing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm z-20">
            <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
            <p className="text-xs font-semibold text-white/90 tracking-wide">
              {status === "requesting"
                ? "Requesting camera access\u2026"
                : "Calibrating 2D Real-Time Optical Tracking\u2026"}
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 z-20 p-6">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <p className="text-xs font-semibold text-white/90 text-center max-w-xs">{errorMsg}</p>
          </div>
        )}

        {/* Floating Snapshot Trigger */}
        {status === "active" && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
            <button
              id="ar-canvas-capture-btn"
              type="button"
              onClick={capturePhoto}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-slate-900 font-semibold text-xs shadow-lg backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#ff7a00]" />
              <span>Capture Photo</span>
            </button>
          </div>
        )}
      </div>
    );
  }
);

ARTryOnCanvas.displayName = "ARTryOnCanvas";
export default ARTryOnCanvas;
