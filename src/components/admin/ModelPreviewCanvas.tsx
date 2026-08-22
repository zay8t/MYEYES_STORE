"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Loader2, AlertCircle, RotateCcw } from "lucide-react";

export interface ModelPreviewCanvasProps {
  modelUrl: string;
}

export function ModelPreviewCanvas({ modelUrl }: ModelPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    setLoading(true);
    setError(null);

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafc");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 10, 7.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const topLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    topLight.position.set(0, 12, 0);
    scene.add(topLight);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 40;
    controls.minDistance = 3;

    // 4. Load GLB Model
    let loadedModel: THREE.Group | null = null;
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        loadedModel = gltf.scene;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 5 / maxDim;

        loadedModel.scale.set(scale, scale, scale);
        loadedModel.position.sub(center.multiplyScalar(scale));

        scene.add(loadedModel);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Failed to load GLB preview:", err);
        setError("Could not parse 3D model. Please verify that the file is a valid .glb binary format.");
        setLoading(false);
      }
    );

    // 5. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 6. Handle Window / Container Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/80 backdrop-blur-xs z-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
          <span className="text-xs font-semibold text-slate-600">
            Rendering 3D Model Viewport&hellip;
          </span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 p-6 text-center z-10">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-xs font-medium text-rose-600 max-w-xs">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-slate-200 rounded-full shadow-2xs text-[10px] font-bold text-slate-600 pointer-events-none select-none">
          <RotateCcw className="w-3 h-3 text-[#ff7a00]" />
          <span>Click &amp; Drag to Orbit</span>
        </div>
      )}
    </div>
  );
}

export default ModelPreviewCanvas;
