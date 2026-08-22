"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Camera, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CameraCaptureHandle {
  captureFrame: () => string | null;
}

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onError: (msg: string) => void;
  className?: string;
}

type CameraStatus = "idle" | "requesting" | "active" | "error";

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  function CameraCapture({ onCapture, onError, className }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<CameraStatus>("idle");
    const [flash, setFlash] = useState(false);

    const stopStream = useCallback(() => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }, []);

    const startCamera = useCallback(async () => {
      setStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("active");
      } catch (err: unknown) {
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access was denied. Please allow camera permission and try again."
            : "Unable to access camera. Please check your device settings.";
        onError(msg);
        setStatus("error");
      }
    }, [onError]);

    // Expose capture method to parent
    useImperativeHandle(ref, () => ({
      captureFrame(): string | null {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || status !== "active") return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.92);
      },
    }));

    const handleCapture = useCallback(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || status !== "active") return;

      // Visual flash feedback
      setFlash(true);
      setTimeout(() => setFlash(false), 300);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onCapture(dataUrl);
    }, [onCapture, status]);

    useEffect(() => {
      startCamera();
      return () => stopStream();
    }, [startCamera, stopStream]);

    return (
      <div className={cn("relative flex flex-col items-center", className)}>
        {/* Video Preview */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 aspect-video shadow-lg border border-slate-200">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              status === "active" ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Overlay guide frame */}
          {status === "active" && (
            <>
              {/* Face centering guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-44 rounded-full border-2 border-amber-400/60 border-dashed" />
              </div>

              {/* Horizontal alignment bar */}
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="h-px bg-[#ff7a00]/30" />
              </div>

              {/* Corner brackets */}
              {[
                "top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
                "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={cn("absolute w-5 h-5 border-[#ff7a00]/70", cls)}
                />
              ))}

              {/* Guide label */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-white/70 tracking-wider uppercase bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  Hold card below chin — centre face in oval
                </span>
              </div>
            </>
          )}

          {/* Loading / Requesting state */}
          {status === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
              <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
              <p className="text-xs font-semibold text-slate-300 tracking-wide">
                Initialising optical sensor&hellip;
              </p>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
              <X className="w-7 h-7 text-rose-400" />
              <p className="text-xs font-semibold text-slate-300 tracking-wide text-center px-6">
                Camera unavailable
              </p>
              <button
                onClick={startCamera}
                className="text-xs font-bold text-[#ff7a00] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Flash overlay */}
          {flash && (
            <div className="absolute inset-0 bg-white/80 pointer-events-none transition-opacity duration-100" />
          )}
        </div>

        {/* Hidden canvas for frame extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture Button */}
        {status === "active" && (
          <button
            id="pd-camera-capture-btn"
            onClick={handleCapture}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-full shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Capture Frame
          </button>
        )}

        {status === "active" && (
          <p className="mt-2 text-[10px] text-slate-400 text-center font-medium">
            Ensure your <span className="font-bold text-slate-600">credit / ID card</span> is held horizontally beneath your chin
          </p>
        )}
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";
export default CameraCapture;
