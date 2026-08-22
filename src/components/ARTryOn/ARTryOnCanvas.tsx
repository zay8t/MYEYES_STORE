"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Camera, Sliders, Loader2, AlertCircle } from "lucide-react";
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

// ─── Component ────────────────────────────────────────────────────────────────

export const ARTryOnCanvas = forwardRef<ARTryOnCanvasHandle, ARTryOnCanvasProps>(
  function ARTryOnCanvas(
    {
      productImageUrl,
      imageUrl,
      fitOffset: propFitOffset = 0,
      lensTint,
      activeTint: propActiveTint,
      onSnapshot,
      className,
    },
    ref
  ) {
    const rawUrl = productImageUrl || imageUrl || "";
    const activeUrl = resolveTryOnImageUrl({
      imageUrl: rawUrl,
      frontImage: rawUrl,
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isTracking, setIsTracking] = useState(false);
    const [fitOffset, setFitOffset] = useState(propFitOffset);
    const [activeTint, setActiveTint] = useState<"clear" | "blue" | "amber" | "sun">(
      propActiveTint || lensTint || "clear"
    );
    const [cameraError, setCameraError] = useState<string | null>(null);

    const processedImageRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const faceMeshRef = useRef<{
      send: (opts: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    } | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Sync external props
    useEffect(() => {
      if (propFitOffset !== undefined) setFitOffset(propFitOffset);
    }, [propFitOffset]);

    useEffect(() => {
      if (propActiveTint || lensTint) {
        setActiveTint(propActiveTint || lensTint || "clear");
      }
    }, [propActiveTint, lensTint]);

    // 1. Process and remove background from product image on load
    useEffect(() => {
      if (!activeUrl) {
        processedImageRef.current = null;
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeUrl;

      img.onload = () => {
        try {
          const offCanvas = document.createElement("canvas");
          offCanvas.width = img.naturalWidth || img.width || 512;
          offCanvas.height = img.naturalHeight || img.height || 240;
          const ctx = offCanvas.getContext("2d", { willReadFrequently: true });

          if (!ctx) {
            processedImageRef.current = img;
            return;
          }

          ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
          const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          const d = imgData.data;

          // Auto-detect corner background color
          const bgR = d[0];
          const bgG = d[1];
          const bgB = d[2];

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];

            // Check brightness or proximity to corner background color
            const isNearWhite = r > 230 && g > 230 && b > 230;
            const isNearBg =
              Math.abs(r - bgR) < 25 &&
              Math.abs(g - bgG) < 25 &&
              Math.abs(b - bgB) < 25;

            if (isNearWhite || isNearBg) {
              d[i + 3] = 0; // Transparent
            }
          }

          ctx.putImageData(imgData, 0, 0);
          processedImageRef.current = offCanvas;
        } catch {
          // Fallback to raw image if canvas is tainted by CORS
          processedImageRef.current = img;
        }
      };

      img.onerror = () => {
        processedImageRef.current = null;
      };
    }, [activeUrl]);

    // 2. High-Performance Render Method
    const drawFrameOverlay = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        pLeft: { x: number; y: number },
        pRight: { x: number; y: number },
        bridge: { x: number; y: number },
        width: number,
        height: number
      ) => {
        const dx = pRight.x - pLeft.x;
        const dy = pRight.y - pLeft.y;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Frame width is scaled to 2.35x outer inter-canthal distance
        const frameWidth = Math.max(eyeDistance * 2.35, 40);
        const frameHeight = frameWidth * 0.46;

        ctx.save();
        ctx.translate(bridge.x, bridge.y + (fitOffset * 3));
        ctx.rotate(angle);

        if (processedImageRef.current) {
          // Render processed transparent glasses
          ctx.drawImage(
            processedImageRef.current,
            -frameWidth / 2,
            -frameHeight / 2,
            frameWidth,
            frameHeight
          );
        } else {
          // Precision Fallback Vector Acetate Frame (Guarantees visible rendering on any network)
          const rimWidth = frameWidth * 0.42;
          const rimHeight = frameHeight * 0.88;
          const rimGap = frameWidth * 0.16;

          ctx.lineWidth = 4.5;
          ctx.strokeStyle = "#0f172a"; // Deep slate
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";

          // Left Eyewear Rim
          ctx.beginPath();
          ctx.roundRect(-rimGap / 2 - rimWidth, -rimHeight / 2, rimWidth, rimHeight, 12);
          ctx.stroke();
          ctx.fill();

          // Right Eyewear Rim
          ctx.beginPath();
          ctx.roundRect(rimGap / 2, -rimHeight / 2, rimWidth, rimHeight, 12);
          ctx.stroke();
          ctx.fill();

          // Bridge Arch
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.moveTo(-rimGap / 2, -rimHeight * 0.15);
          ctx.quadraticCurveTo(0, -rimHeight * 0.38, rimGap / 2, -rimHeight * 0.15);
          ctx.stroke();

          // Left & Right Temple Joints
          ctx.beginPath();
          ctx.moveTo(-rimGap / 2 - rimWidth, -rimHeight * 0.2);
          ctx.lineTo(-frameWidth / 2, -rimHeight * 0.15);
          ctx.moveTo(rimGap / 2 + rimWidth, -rimHeight * 0.2);
          ctx.lineTo(frameWidth / 2, -rimHeight * 0.15);
          ctx.stroke();
        }

        // Lens Tinting Shader Layer
        if (activeTint === "blue") {
          ctx.fillStyle = "rgba(59, 130, 246, 0.18)";
          ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
        } else if (activeTint === "sun" || activeTint === "amber") {
          ctx.fillStyle = "rgba(15, 23, 42, 0.50)";
          ctx.fillRect(-frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight);
        }

        ctx.restore();
      },
      [fitOffset, activeTint]
    );

    // 3. Camera & Tracking Engine Loop
    useEffect(() => {
      let isMounted = true;
      let cameraStream: MediaStream | null = null;
      let faceMesh: any = null;

      async function initTrackingPipeline() {
        try {
          setCameraError(null);
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: false,
          });

          if (!isMounted || !videoRef.current) {
            cameraStream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = cameraStream;
          videoRef.current.srcObject = cameraStream;

          await new Promise<boolean>((resolve) => {
            if (!videoRef.current) return resolve(false);
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve(true);
            };
          });

          if (!isMounted) return;
          setIsTracking(true);

          // Primary: Load MediaPipe Face Mesh
          const { FaceMesh } = await import("@mediapipe/face_mesh");
          faceMesh = new FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          faceMesh.onResults((results: any) => {
            if (!isMounted || !canvasRef.current || !videoRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const w = videoRef.current.videoWidth || 1280;
            const h = videoRef.current.videoHeight || 720;

            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }

            ctx.clearRect(0, 0, w, h);

            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
              return;
            }

            const lm = results.multiFaceLandmarks[0];

            // Landmark 33: Right outer eye | 263: Left outer eye | 168: Nasal bridge
            const pLeft = { x: lm[33].x * w, y: lm[33].y * h };
            const pRight = { x: lm[263].x * w, y: lm[263].y * h };
            const bridge = { x: lm[168].x * w, y: lm[168].y * h };

            drawFrameOverlay(ctx, pLeft, pRight, bridge, w, h);
          });

          faceMeshRef.current = faceMesh;

          // Continuous frame submission loop (~30 FPS)
          let lastSend = 0;
          const processLoop = async (now: number) => {
            if (!isMounted) return;
            if (
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              faceMeshRef.current &&
              now - lastSend > 33
            ) {
              lastSend = now;
              try {
                await faceMeshRef.current.send({ image: videoRef.current });
              } catch {
                // Non-fatal frame drop
              }
            }
            animFrameRef.current = requestAnimationFrame(processLoop);
          };

          animFrameRef.current = requestAnimationFrame(processLoop);
        } catch (err) {
          console.warn("AR Tracking Initialization Error:", err);
          if (isMounted) {
            setCameraError(
              err instanceof DOMException && err.name === "NotAllowedError"
                ? "Camera access denied. Please allow camera permissions."
                : "Camera unavailable. Please check your device."
            );
          }
        }
      }

      initTrackingPipeline();

      return () => {
        isMounted = false;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (faceMeshRef.current) {
          try {
            faceMeshRef.current.close();
          } catch {
            // Ignore
          }
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, [drawFrameOverlay]);

    // 4. Capture Clean High-Res Snapshot
    const handleCaptureSnapshot = useCallback(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const mergeCanvas = document.createElement("canvas");
      const w = videoRef.current.videoWidth || 1280;
      const h = videoRef.current.videoHeight || 720;
      mergeCanvas.width = w;
      mergeCanvas.height = h;
      const mCtx = mergeCanvas.getContext("2d");
      if (!mCtx) return;

      // Draw video mirrored
      mCtx.save();
      mCtx.scale(-1, 1);
      mCtx.drawImage(videoRef.current, -w, 0, w, h);

      // Draw overlay mirrored to match
      mCtx.drawImage(canvasRef.current, -w, 0, w, h);
      mCtx.restore();

      const dataUrl = mergeCanvas.toDataURL("image/jpeg", 0.95);
      onSnapshot?.(dataUrl);

      const a = document.createElement("a");
      a.download = `myeyes-virtual-tryon-${Date.now()}.jpg`;
      a.href = dataUrl;
      a.click();
    }, [onSnapshot]);

    useImperativeHandle(ref, () => ({ capturePhoto: handleCaptureSnapshot }));

    return (
      <div className={cn("flex flex-col gap-4 w-full", className)}>
        {/* Viewport Frame */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 shadow-inner">
          {/* Mirrored Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          />

          {/* Tracking Canvas Overlay (Identically Mirrored to match video) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
          />

          {/* Loading Indicator */}
          {!isTracking && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm z-20">
              <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
              <p className="text-xs font-semibold text-white/90 tracking-wide">
                Calibrating 2D Real-Time Optical Matrix&hellip;
              </p>
            </div>
          )}

          {/* Error Alert */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 z-20 p-6 text-center">
              <AlertCircle className="w-7 h-7 text-rose-400" />
              <p className="text-xs font-semibold text-white/90 max-w-xs">{cameraError}</p>
            </div>
          )}

          {/* Floating Snapshot Action */}
          {isTracking && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
              <button
                type="button"
                id="ar-canvas-capture-btn"
                onClick={handleCaptureSnapshot}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-900 font-semibold text-xs shadow-lg backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#ff7a00]" />
                <span>Capture Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">Height Adjustment:</span>
            <input
              type="range"
              min="-35"
              max="35"
              value={fitOffset}
              onChange={(e) => setFitOffset(Number(e.target.value))}
              className="w-24 sm:w-32 accent-[#ff7a00] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTint("clear")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTint === "clear"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Clear Optical
            </button>
            <button
              type="button"
              onClick={() => setActiveTint("blue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTint === "blue"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Blue Light Shield
            </button>
            <button
              type="button"
              onClick={() => setActiveTint("sun")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTint === "sun" || activeTint === "amber"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sunglass Polarized
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ARTryOnCanvas.displayName = "ARTryOnCanvas";
export default ARTryOnCanvas;
