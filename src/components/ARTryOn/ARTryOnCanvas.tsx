"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import { loadFrameTexture } from "@/lib/ar/textureLoader";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ARTryOnCanvasHandle {
  capturePhoto: () => void;
}

interface ARTryOnCanvasProps {
  /** URL of the product image to map onto the 2D/3D frame plane */
  imageUrl: string;
  /** Vertical micro-adjustment in mm (nasal bridge height) */
  fitOffset?: number;
  /** Lens tint override */
  lensTint?: "clear" | "blue" | "amber";
  className?: string;
}

type ARStatus =
  | "idle"
  | "requesting"
  | "initializing"
  | "active"
  | "no-face"
  | "error";

const TINT_COLORS: Record<string, number> = {
  clear: 0xffffff,
  blue: 0x38bdf8,
  amber: 0xf59e0b,
};

const TINT_OPACITY: Record<string, number> = {
  clear: 0.0,
  blue: 0.25,
  amber: 0.35,
};

// ─── Component ────────────────────────────────────────────────────────────────

const ARTryOnCanvas = forwardRef<ARTryOnCanvasHandle, ARTryOnCanvasProps>(
  function ARTryOnCanvas(
    { imageUrl, fitOffset = 0, lensTint = "clear", className },
    ref
  ) {
    const containerRef  = useRef<HTMLDivElement>(null);
    const videoRef      = useRef<HTMLVideoElement>(null);
    const canvasRef     = useRef<HTMLCanvasElement>(null);

    const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef      = useRef<THREE.Scene | null>(null);
    const cameraRef     = useRef<THREE.OrthographicCamera | null>(null);
    const frameMeshRef  = useRef<THREE.Mesh | null>(null);
    const tintMeshRef   = useRef<THREE.Mesh | null>(null);
    const aspectRef     = useRef<number>(2.3);

    const streamRef     = useRef<MediaStream | null>(null);
    const faceMeshRef   = useRef<{ send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null>(null);
    const rafRef        = useRef<number>(0);

    const [status, setStatus] = useState<ARStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // ── Update Texture Dynamically ────────────────────────────────────────

    const updateTexture = useCallback((url: string) => {
      if (!url) return;
      loadFrameTexture(url, (tex, aspect) => {
        aspectRef.current = aspect > 0 ? aspect : 2.3;
        if (frameMeshRef.current) {
          const mat = frameMeshRef.current.material as THREE.MeshBasicMaterial;
          mat.map = tex;
          mat.transparent = true;
          mat.needsUpdate = true;
        }
      });
    }, []);

    // ── Update Lens Tint ──────────────────────────────────────────────────

    useEffect(() => {
      if (!tintMeshRef.current) return;
      const tintMat = tintMeshRef.current.material as THREE.MeshBasicMaterial;
      const opacity = TINT_OPACITY[lensTint] ?? 0;
      const color = TINT_COLORS[lensTint] ?? 0xffffff;

      tintMat.opacity = opacity;
      tintMat.color.setHex(color);
      tintMeshRef.current.visible = opacity > 0;
    }, [lensTint]);

    // ── Camera Initialization ─────────────────────────────────────────────

    const startCamera = useCallback(async () => {
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

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        return stream;
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access in browser settings."
            : "Camera sensor unavailable. Please check your device.";
        setErrorMsg(msg);
        setStatus("error");
        return null;
      }
    }, []);

    // ── Three.js & MediaPipe Setup ────────────────────────────────────────

    useEffect(() => {
      let isCancelled = false;

      const initEngine = async () => {
        const stream = await startCamera();
        if (!stream || isCancelled) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        setStatus("initializing");

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;

        // 1. WebGL Renderer matching video dimensions
        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(1);
        renderer.setSize(w, h, false);
        renderer.setClearColor(0x000000, 0);

        // 2. Exact 1:1 Pixel Orthographic Camera (Top-Left 0,0 to W,H)
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(0, w, 0, h, -1000, 1000);
        camera.position.z = 10;
        scene.add(camera);

        // 3. Unit Plane Geometry scaled dynamically in render loop
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const frameMesh = new THREE.Mesh(geometry, material);
        frameMesh.visible = false;
        scene.add(frameMesh);

        // Optional lens tint overlay
        const tintGeo = new THREE.PlaneGeometry(0.88, 0.82);
        const tintMat = new THREE.MeshBasicMaterial({
          color: TINT_COLORS[lensTint] ?? 0xffffff,
          transparent: true,
          opacity: TINT_OPACITY[lensTint] ?? 0,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const tintMesh = new THREE.Mesh(tintGeo, tintMat);
        tintMesh.position.z = 1;
        tintMesh.visible = (TINT_OPACITY[lensTint] ?? 0) > 0;
        frameMesh.add(tintMesh);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        frameMeshRef.current = frameMesh;
        tintMeshRef.current = tintMesh;

        // Load initial texture
        updateTexture(imageUrl);

        // 4. Initialize MediaPipe FaceMesh
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

        faceMesh.onResults((results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) => {
          if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !frameMeshRef.current) {
            return;
          }

          const curRenderer = rendererRef.current;
          const curScene = sceneRef.current;
          const curCamera = cameraRef.current;
          const curMesh = frameMeshRef.current;

          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            curMesh.visible = false;
            curRenderer.render(curScene, curCamera);
            return;
          }

          const landmarks = results.multiFaceLandmarks[0];
          curMesh.visible = true;

          // Landmark 33 (Right eye outer), Landmark 263 (Left eye outer)
          // Landmark 168 (Nose root/sellion)
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const noseBridge = landmarks[168];

          // Convert normalized [0, 1] coords to exact canvas pixel units
          const p1 = { x: leftEye.x * w, y: leftEye.y * h };
          const p2 = { x: rightEye.x * w, y: rightEye.y * h };
          const bridge = { x: noseBridge.x * w, y: noseBridge.y * h };

          // Calculate ocular distance between outer corners
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const eyeDist = Math.sqrt(dx * dx + dy * dy);

          // Optical frame width is typically ~2.3x the outer eye distance
          const frameWidth = Math.max(eyeDist * 2.30, 40);
          const aspect = aspectRef.current || 2.3;
          const frameHeight = frameWidth / aspect;

          // Rotation angle
          const angle = Math.atan2(dy, dx);

          // Position squarely at nasal bridge + user fit offset
          curMesh.position.set(bridge.x, bridge.y + (fitOffset * 3), 0);
          curMesh.scale.set(frameWidth, frameHeight, 1);
          curMesh.rotation.z = -angle;

          curRenderer.render(curScene, curCamera);
          if (status !== "active") setStatus("active");
        });

        faceMeshRef.current = faceMesh;

        // 5. Video Processing Loop
        let lastSend = 0;
        const tick = async (now: number) => {
          rafRef.current = requestAnimationFrame(tick);
          if (video && faceMeshRef.current && video.readyState >= 2 && now - lastSend > 33) {
            lastSend = now;
            try {
              await faceMeshRef.current.send({ image: video });
            } catch {
              // Frame dropped, non-fatal
            }
          }
        };

        rafRef.current = requestAnimationFrame(tick);
        setStatus("active");
      };

      initEngine();

      return () => {
        isCancelled = true;
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        rendererRef.current?.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Update Texture on Prop Change ──────────────────────────────────────

    useEffect(() => {
      updateTexture(imageUrl);
    }, [imageUrl, updateTexture]);

    // ── Photo Snapshot Capture ────────────────────────────────────────────

    const capturePhoto = useCallback(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const out = document.createElement("canvas");
      out.width = video.videoWidth || 1280;
      out.height = video.videoHeight || 720;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -out.width, 0, out.width, out.height);
      ctx.restore();

      // Draw mirrored overlay canvas
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, -out.width, 0, out.width, out.height);
      ctx.restore();

      const link = document.createElement("a");
      link.href = out.toDataURL("image/jpeg", 0.95);
      link.download = `my-eyes-tryon-${Date.now()}.jpg`;
      link.click();
    }, []);

    useImperativeHandle(ref, () => ({ capturePhoto }));

    // ─── Render ───────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200/80 shadow-md",
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

        {/* WebGL Overlay Canvas (Mirrored identically to video) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
        />

        {/* Loading / Initializing Status Overlay */}
        {(status === "requesting" || status === "initializing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm z-20">
            <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
            <p className="text-xs font-semibold text-white/90 tracking-wide">
              {status === "requesting"
                ? "Requesting camera access\u2026"
                : "Calibrating 2D/3D Optical Projection\u2026"}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 z-20 p-6">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <p className="text-xs font-semibold text-white/90 text-center max-w-xs">{errorMsg}</p>
          </div>
        )}

        {/* Floating Capture Button */}
        {status === "active" && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
            <button
              id="ar-canvas-capture-btn"
              type="button"
              onClick={capturePhoto}
              className="flex items-center gap-2 px-5 py-2 bg-white/95 hover:bg-white text-slate-900 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#ff7a00]" />
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
