"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Camera, Download, Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import type { NormalizedLandmark } from "@/lib/ar/facePoseEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ARTryOnCanvasHandle {
  capturePhoto: () => void;
}

interface ARTryOnCanvasProps {
  /** URL of the product image to map onto the curved frame mesh */
  imageUrl: string;
  /** Optional vertical offset in world units (nasal bridge adjustment) */
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

// ─── Tint configs ─────────────────────────────────────────────────────────────

const TINT_COLORS: Record<string, number> = {
  clear:  0xffffff,
  blue:   0x90caf9,
  amber:  0xffcc02,
};

const TINT_OPACITY: Record<string, number> = {
  clear: 0.0,
  blue:  0.22,
  amber: 0.30,
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
    const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
    const frameGroupRef = useRef<THREE.Group | null>(null);
    const textureRef    = useRef<THREE.Texture | null>(null);
    const streamRef     = useRef<MediaStream | null>(null);
    const rafRef        = useRef<number>(0);
    const faceMeshRef   = useRef<unknown>(null);
    const latestPoseRef = useRef<{
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      scale: number;
      detected: boolean;
    } | null>(null);

    const [status, setStatus] = useState<ARStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // ── Three.js scene setup ──────────────────────────────────────────────

    const setupScene = useCallback((canvas: HTMLCanvasElement) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = false;

      const scene = new THREE.Scene();

      // Camera matches a rough "face distance" FOV
      const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 2000);
      cam.position.set(0, 0, 600);
      scene.add(cam);

      // Studio lighting — directional key + ambient
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(2, 3, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xf8f0e8, 0.4);
      fillLight.position.set(-3, 1, 2);
      scene.add(fillLight);

      // Frame group anchor
      const group = new THREE.Group();
      scene.add(group);

      rendererRef.current  = renderer;
      sceneRef.current     = scene;
      cameraRef.current    = cam;
      frameGroupRef.current = group;

      return { renderer, scene, cam, group };
    }, []);

    // ── Build curved eyewear mesh ─────────────────────────────────────────

    const buildFrameMesh = useCallback(
      (imageUrl: string, tint: string): THREE.Group => {
        const group = new THREE.Group();

        const loader = new THREE.TextureLoader();
        const tex = loader.load(imageUrl, () => {
          tex.needsUpdate = true;
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        textureRef.current = tex;

        // Curved cylinder segment — simulates optical wrap (approx 100-deg arc)
        const geo = new THREE.CylinderGeometry(
          200, 200, 75,
          64, 1,
          true,
          -Math.PI * 0.28,
          Math.PI * 0.56
        );

        // Rotate so the arc faces the camera (Z-axis)
        geo.rotateX(Math.PI / 2);

        const tintColor   = TINT_COLORS[tint]   ?? 0xffffff;
        const tintOpacity = TINT_OPACITY[tint]   ?? 0;

        const mat = new THREE.MeshPhysicalMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.01,
          side: THREE.FrontSide,
          roughness: 0.18,
          metalness: 0.10,
          ior: 1.5,
          color: new THREE.Color(tintColor),
          opacity: 1.0,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.name  = "frame_mesh";
        group.add(mesh);

        // Tint overlay plane (lens color simulation)
        if (tintOpacity > 0) {
          const lensGeo = new THREE.PlaneGeometry(160, 60);
          const lensMat = new THREE.MeshBasicMaterial({
            color: tintColor,
            transparent: true,
            opacity: tintOpacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const lensMesh = new THREE.Mesh(lensGeo, lensMat);
          lensMesh.position.z = 5;
          lensMesh.name = "tint_overlay";
          group.add(lensMesh);
        }

        return group;
      },
      []
    );

    // ── Start webcam ──────────────────────────────────────────────────────

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
        return stream;
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera permission and reload."
            : "Camera unavailable. Please check your device settings.";
        setErrorMsg(msg);
        setStatus("error");
        return null;
      }
    }, []);

    // ── Initialize MediaPipe FaceMesh ─────────────────────────────────────

    const initFaceMesh = useCallback(async () => {
      // Dynamic import to avoid SSR issues
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
          const pose = extractFacePose(landmarks, video.videoWidth || 640, video.videoHeight || 480);
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

    // ── Render loop ───────────────────────────────────────────────────────

    const startRenderLoop = useCallback(() => {
      let lastSend = 0;

      const tick = async (now: number) => {
        rafRef.current = requestAnimationFrame(tick);
        const video    = videoRef.current;
        const renderer = rendererRef.current;
        const scene    = sceneRef.current;
        const cam      = cameraRef.current;
        const group    = frameGroupRef.current;
        const faceMesh = faceMeshRef.current as { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null;

        if (!renderer || !scene || !cam || !group) return;

        // Send video frame to MediaPipe every ~33ms (30fps cap for perf)
        if (video && faceMesh && video.readyState >= 2 && now - lastSend > 33) {
          lastSend = now;
          try {
            await faceMesh.send({ image: video });
          } catch {
            // non-fatal
          }
        }

        // Apply pose to frame group
        const pose = latestPoseRef.current;
        if (pose?.detected && group) {
          group.position.copy(pose.position);
          group.quaternion.copy(pose.quaternion);
          group.scale.setScalar(pose.scale);

          // Apply fit offset (vertical nasal bridge adjustment)
          group.position.y += fitOffset * 10;
        }

        renderer.render(scene, cam);
      };

      rafRef.current = requestAnimationFrame(tick);
    }, [fitOffset]);

    // ── Handle resize ─────────────────────────────────────────────────────

    useEffect(() => {
      const onResize = () => {
        const canvas   = canvasRef.current;
        const renderer = rendererRef.current;
        const cam      = cameraRef.current;
        if (!canvas || !renderer || !cam) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    // ── Main init ─────────────────────────────────────────────────────────

    useEffect(() => {
      let cancelled = false;

      const init = async () => {
        const stream = await startCamera();
        if (!stream || cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        setStatus("initializing");
        const { scene, group } = setupScene(canvas);

        // Build frame mesh and add to scene
        const frameGroup = buildFrameMesh(imageUrl, lensTint);
        group.add(frameGroup);
        scene.add(group);

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
        textureRef.current?.dispose();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    // Update lens tint dynamically (without restarting camera)
    useEffect(() => {
      const group = frameGroupRef.current;
      if (!group || !sceneRef.current) return;

      // Remove old frame meshes
      const children = [...group.children];
      children.forEach((c) => {
        if (c.name === "frame_group") group.remove(c);
      });

      const newGroup = buildFrameMesh(imageUrl, lensTint);
      newGroup.name = "frame_group";
      group.add(newGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lensTint]);

    // ── Capture photo ─────────────────────────────────────────────────────

    const capturePhoto = useCallback(() => {
      const video    = videoRef.current;
      const canvas   = canvasRef.current;
      const renderer = rendererRef.current;
      if (!video || !canvas || !renderer) return;

      // Composite video + WebGL overlay
      const out = document.createElement("canvas");
      out.width  = video.videoWidth;
      out.height = video.videoHeight;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -out.width, 0, out.width, out.height);
      ctx.restore();

      // Draw WebGL overlay
      renderer.render(sceneRef.current!, cameraRef.current!);
      ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);

      // Download
      const link = document.createElement("a");
      link.href     = out.toDataURL("image/jpeg", 0.92);
      link.download = `my-eyes-tryon-${Date.now()}.jpg`;
      link.click();
    }, []);

    useImperativeHandle(ref, () => ({ capturePhoto }));

    // ─── Render ───────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={cn("relative w-full overflow-hidden rounded-2xl bg-slate-900", className)}
        style={{ aspectRatio: "4/3" }}
      >
        {/* Mirrored webcam feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Transparent Three.js AR overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 2 }}
        />

        {/* Loading / Status overlays */}
        {(status === "requesting" || status === "initializing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm z-10">
            <Loader2 className="w-7 h-7 text-[#ff7a00] animate-spin" />
            <p className="text-xs font-semibold text-white/80 tracking-wide">
              {status === "requesting"
                ? "Requesting optical sensor access\u2026"
                : "Initializing 3D Optical Matrix\u2026"}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 z-10 p-6">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <p className="text-xs font-semibold text-white/80 text-center">{errorMsg}</p>
          </div>
        )}

        {/* Face tracking guide (shown when active but no face detected) */}
        {status === "no-face" && (
          <div className="absolute bottom-16 inset-x-0 flex justify-center z-10 pointer-events-none">
            <span className="text-[10px] font-semibold text-white/70 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full tracking-wider uppercase">
              Position face in frame
            </span>
          </div>
        )}

        {/* Corner guide brackets */}
        {status === "active" && (
          <>
            {["top-3 left-3 border-t-2 border-l-2 rounded-tl-xl",
              "top-3 right-3 border-t-2 border-r-2 rounded-tr-xl",
              "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl",
              "bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl",
            ].map((cls, i) => (
              <div key={i} className={cn("absolute w-5 h-5 border-[#ff7a00]/60 z-10 pointer-events-none", cls)} />
            ))}
          </>
        )}

        {/* Capture button overlay */}
        {status === "active" && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center z-10">
            <button
              id="ar-capture-btn"
              type="button"
              onClick={capturePhoto}
              className="flex items-center gap-2 px-5 py-2 bg-white/90 hover:bg-white text-slate-900 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-[#ff7a00]" />
              Capture Photo
            </button>
          </div>
        )}
      </div>
    );
  }
);

ARTryOnCanvas.displayName = "ARTryOnCanvas";
export default ARTryOnCanvas;
