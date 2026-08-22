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
import type { NormalizedLandmark } from "@/lib/ar/facePoseEngine";
import { loadTransparentFrameTexture } from "@/lib/ar/textureLoader";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ARTryOnCanvasHandle {
  capturePhoto: () => void;
}

interface ARTryOnCanvasProps {
  /** URL of the front-facing product image to map onto the 3D frame mesh */
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

// ─── Tint Configs ─────────────────────────────────────────────────────────────

const TINT_COLORS: Record<string, number> = {
  clear: 0xffffff,
  blue: 0x38bdf8,
  amber: 0xf59e0b,
};

const TINT_OPACITY: Record<string, number> = {
  clear: 0.0,
  blue: 0.22,
  amber: 0.32,
};

const BASE_FRAME_WIDTH = 100;

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
    const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
    const frameGroupRef = useRef<THREE.Group | null>(null);
    const frameMeshRef  = useRef<THREE.Mesh | null>(null);
    const tintMeshRef   = useRef<THREE.Mesh | null>(null);

    const streamRef     = useRef<MediaStream | null>(null);
    const rafRef        = useRef<number>(0);
    const faceMeshRef   = useRef<unknown>(null);
    const latestPoseRef = useRef<{
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      frameWidth: number;
      scale: number;
      detected: boolean;
    } | null>(null);

    const [status, setStatus] = useState<ARStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // ── Three.js Scene Setup ──────────────────────────────────────────────

    const setupScene = useCallback((canvas: HTMLCanvasElement) => {
      const w = canvas.clientWidth || 640;
      const h = canvas.clientHeight || 480;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();

      // Camera matches standard webcam FOV
      const cam = new THREE.PerspectiveCamera(40, w / h, 1, 3000);
      cam.position.set(0, 0, 700);
      scene.add(cam);

      // Studio lighting for metallic / acetate frame highlights
      const ambient = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(100, 200, 300);
      scene.add(keyLight);

      // Frame group anchor
      const group = new THREE.Group();
      scene.add(group);

      rendererRef.current   = renderer;
      sceneRef.current      = scene;
      cameraRef.current     = cam;
      frameGroupRef.current = group;

      return { renderer, scene, cam, group };
    }, []);

    // ── Update Texture & Mesh Dynamically ──────────────────────────────────

    const updateFrameTexture = useCallback(
      async (url: string, tint: string) => {
        const group = frameGroupRef.current;
        if (!group) return;

        try {
          const { texture, aspectRatio } = await loadTransparentFrameTexture(url);

          const frameW = BASE_FRAME_WIDTH;
          const frameH = frameW / Math.max(aspectRatio, 0.5);

          // Remove previous mesh
          if (frameMeshRef.current) {
            group.remove(frameMeshRef.current);
            frameMeshRef.current.geometry.dispose();
            if (Array.isArray(frameMeshRef.current.material)) {
              frameMeshRef.current.material.forEach((m) => m.dispose());
            } else {
              frameMeshRef.current.material.dispose();
            }
            frameMeshRef.current = null;
          }

          if (tintMeshRef.current) {
            group.remove(tintMeshRef.current);
            tintMeshRef.current.geometry.dispose();
            if (Array.isArray(tintMeshRef.current.material)) {
              tintMeshRef.current.material.forEach((m) => m.dispose());
            } else {
              tintMeshRef.current.material.dispose();
            }
            tintMeshRef.current = null;
          }

          // Curved frame geometry matching optical wrap
          const geo = new THREE.PlaneGeometry(frameW, frameH, 16, 4);

          // Add slight optical wrap curvature along X axis
          const pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            // Slight backward curve at the temples
            const zCurve = -Math.pow(x / (frameW * 0.5), 2) * 5;
            pos.setZ(i, zCurve);
          }
          geo.computeVertexNormals();

          // High-precision transparent material with alphaTest to eliminate bounding box
          const frameMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.05,
            depthWrite: false,
            side: THREE.DoubleSide,
          });

          const mesh = new THREE.Mesh(geo, frameMat);
          mesh.name = "eyewear_frame_mesh";
          group.add(mesh);
          frameMeshRef.current = mesh;

          // Add optional lens tint overlay
          const tintOpacity = TINT_OPACITY[tint] ?? 0;
          if (tintOpacity > 0) {
            const tintColor = TINT_COLORS[tint] ?? 0xffffff;
            const tintGeo = new THREE.PlaneGeometry(frameW * 0.88, frameH * 0.82);
            const tintMat = new THREE.MeshBasicMaterial({
              color: tintColor,
              transparent: true,
              opacity: tintOpacity,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });
            const tintMesh = new THREE.Mesh(tintGeo, tintMat);
            tintMesh.position.z = 1.5;
            group.add(tintMesh);
            tintMeshRef.current = tintMesh;
          }
        } catch (err) {
          console.error("Failed to load transparent frame texture:", err);
        }
      },
      []
    );

    // ── Start Webcam ──────────────────────────────────────────────────────

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
            ? "Camera access denied. Please allow camera permission in browser settings."
            : "Camera sensor unavailable. Please check your device.";
        setErrorMsg(msg);
        setStatus("error");
        return null;
      }
    }, []);

    // ── Initialize MediaPipe FaceMesh ─────────────────────────────────────

    const initFaceMesh = useCallback(async () => {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { extractFacePose, resetPoseSmoothing } = await import(
        "@/lib/ar/facePoseEngine"
      );
      resetPoseSmoothing();

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

      faceMesh.onResults((results: { multiFaceLandmarks?: NormalizedLandmark[][] }) => {
        const video = videoRef.current;
        if (!video) return;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const pose = extractFacePose(
            landmarks,
            video.videoWidth || 640,
            video.videoHeight || 480
          );
          latestPoseRef.current = pose;
          if (status !== "active") setStatus("active");
        } else {
          if (latestPoseRef.current) {
            latestPoseRef.current = { ...latestPoseRef.current, detected: false };
          }
        }
      });

      faceMeshRef.current = faceMesh;
      return faceMesh;
    }, [status]);

    // ── Render Loop ───────────────────────────────────────────────────────

    const startRenderLoop = useCallback(() => {
      let lastSend = 0;

      const tick = async (now: number) => {
        rafRef.current = requestAnimationFrame(tick);
        const video    = videoRef.current;
        const renderer = rendererRef.current;
        const scene    = sceneRef.current;
        const cam      = cameraRef.current;
        const group    = frameGroupRef.current;
        const faceMesh = faceMeshRef.current as {
          send: (opts: { image: HTMLVideoElement }) => Promise<void>;
        } | null;

        if (!renderer || !scene || !cam || !group) return;

        // Send video frame to MediaPipe at 30 FPS cap
        if (video && faceMesh && video.readyState >= 2 && now - lastSend > 33) {
          lastSend = now;
          try {
            await faceMesh.send({ image: video });
          } catch {
            // non-fatal frame skip
          }
        }

        // Apply calibrated pose to 3D frame group
        const pose = latestPoseRef.current;
        if (pose?.detected && group) {
          group.visible = true;
          group.position.copy(pose.position);
          group.quaternion.copy(pose.quaternion);

          // Calibrated scaling relative to base frame width
          const scaleFactor = (pose.frameWidth / BASE_FRAME_WIDTH);
          group.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Vertical micro-adjustment for nasal bridge height (+/- 5mm)
          group.position.y += fitOffset * 4;
        } else if (group) {
          group.visible = false;
        }

        renderer.render(scene, cam);
      };

      rafRef.current = requestAnimationFrame(tick);
    }, [fitOffset]);

    // ── Handle Resize ─────────────────────────────────────────────────────

    useEffect(() => {
      const onResize = () => {
        const canvas   = canvasRef.current;
        const renderer = rendererRef.current;
        const cam      = cameraRef.current;
        if (!canvas || !renderer || !cam) return;
        const w = canvas.clientWidth || 640;
        const h = canvas.clientHeight || 480;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    // ── Initial Mount & Lifecycle ─────────────────────────────────────────

    useEffect(() => {
      let cancelled = false;

      const init = async () => {
        const stream = await startCamera();
        if (!stream || cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        setStatus("initializing");
        setupScene(canvas);

        await updateFrameTexture(imageUrl, lensTint);
        if (cancelled) return;

        await initFaceMesh();
        if (cancelled) return;

        startRenderLoop();
        setStatus("active");
      };

      init();

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        rendererRef.current?.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── React to Image or Lens Tint Changes Seamlessly ─────────────────────

    useEffect(() => {
      if (status === "active" || status === "initializing") {
        updateFrameTexture(imageUrl, lensTint);
      }
    }, [imageUrl, lensTint, updateFrameTexture, status]);

    // ── Capture Photo ─────────────────────────────────────────────────────

    const capturePhoto = useCallback(() => {
      const video    = videoRef.current;
      const canvas   = canvasRef.current;
      const renderer = rendererRef.current;
      if (!video || !canvas || !renderer) return;

      const out = document.createElement("canvas");
      out.width  = video.videoWidth || 1280;
      out.height = video.videoHeight || 720;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // Draw mirrored webcam frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -out.width, 0, out.width, out.height);
      ctx.restore();

      // Draw WebGL AR frame overlay
      renderer.render(sceneRef.current!, cameraRef.current!);
      ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);

      // Trigger instant snapshot download
      const link = document.createElement("a");
      link.href     = out.toDataURL("image/jpeg", 0.95);
      link.download = `my-eyes-tryon-${Date.now()}.jpg`;
      link.click();
    }, []);

    useImperativeHandle(ref, () => ({ capturePhoto }));

    // ─── Render ───────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-md",
          className
        )}
        style={{ aspectRatio: "4/3" }}
      >
        {/* Mirrored live video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Transparent Three.js WebGL overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 2 }}
        />

        {/* Loading / Status overlay */}
        {(status === "requesting" || status === "initializing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm z-10">
            <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
            <p className="text-xs font-semibold text-white/90 tracking-wide">
              {status === "requesting"
                ? "Requesting optical sensor access\u2026"
                : "Initializing 3D Optical Matrix\u2026"}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 z-10 p-6">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <p className="text-xs font-semibold text-white/90 text-center max-w-xs">{errorMsg}</p>
          </div>
        )}

        {/* Corner guide brackets */}
        {status === "active" && (
          <>
            {[
              "top-3 left-3 border-t-2 border-l-2 rounded-tl-xl",
              "top-3 right-3 border-t-2 border-r-2 rounded-tr-xl",
              "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl",
              "bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl",
            ].map((cls, i) => (
              <div
                key={i}
                className={cn("absolute w-5 h-5 border-[#ff7a00]/60 z-10 pointer-events-none", cls)}
              />
            ))}
          </>
        )}

        {/* Floating Capture Trigger */}
        {status === "active" && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-10">
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
