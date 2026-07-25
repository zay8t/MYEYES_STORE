"use client";

import React, { Suspense, useCallback, useMemo, useRef, useState, Component, memo, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Preload, useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Sparkles, Rotate3d } from "lucide-react";

// Pre-cache GLTF model to prevent reload stuttering or disappearance
useGLTF.preload("/models/eyewear.glb");

/* -------------------------------------------------------------------- */
/*  Error Boundary for WebGL safety                                      */
/* -------------------------------------------------------------------- */

class WebGLErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Persistent3DViewer WebGL Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-[450px] md:h-[550px] bg-transparent flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-auto select-none">
          <Rotate3d className="w-10 h-10 text-brand" />
          <span className="text-sm font-bold text-slate-700">3D Interactive Preview</span>
          <span className="text-xs text-slate-400 max-w-xs">
            WebGL preview unavailable on this device. Explore our full catalog below!
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------- */
/*  Procedural Eyewear Model (Fast fallback while GLTF loads)           */
/* -------------------------------------------------------------------- */

function ProceduralEyewearModel({ isInteracting }: { isInteracting: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);

  const responsiveScale = useMemo(() => {
    const targetHeight = viewport.height * 0.55;
    const maxAllowedWidth = viewport.width * 0.85;

    let scale = targetHeight / 1.6;
    if (4.2 * scale > maxAllowedWidth) {
      scale = maxAllowedWidth / 4.2;
    }
    return THREE.MathUtils.clamp(scale, 0.8, 2.5);
  }, [viewport.width, viewport.height]);

  const geometries = useMemo(() => ({
    rim: new THREE.TorusGeometry(0.75, 0.07, 16, 64),
    lens: new THREE.CylinderGeometry(0.72, 0.72, 0.04, 32),
    thickBridge: new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16),
    thinBridge: new THREE.CylinderGeometry(0.035, 0.035, 1.2, 16),
    hinge: new THREE.BoxGeometry(0.15, 0.08, 0.1),
    temple: new THREE.BoxGeometry(0.05, 0.06, 2.1),
    nosePad: new THREE.SphereGeometry(0.07, 16, 16),
  }), []);

  const materials = useMemo(() => ({
    frame: new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.9, roughness: 0.15 }),
    hinge: new THREE.MeshStandardMaterial({ color: "#334155", metalness: 0.9, roughness: 0.12 }),
    temple: new THREE.MeshStandardMaterial({ color: "#0f172a", metalness: 0.8, roughness: 0.22 }),
    bridge: new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.95, roughness: 0.1 }),
    lens: new THREE.MeshPhysicalMaterial({
      color: "#0f172a",
      metalness: 0.5,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.88,
    }),
    nosePad: new THREE.MeshStandardMaterial({ color: "#cbd5e1", transparent: true, opacity: 0.8, roughness: 0.4 }),
  }), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (!isInteracting) {
      groupRef.current.position.y = Math.sin(t * 0.9) * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 4, delta);
    }
  });

  return (
    <group ref={groupRef} scale={responsiveScale} dispose={null}>
      <mesh position={[-1.15, 0, 0]} geometry={geometries.rim} material={materials.frame} castShadow />
      <mesh position={[1.15, 0, 0]} geometry={geometries.rim} material={materials.frame} castShadow />

      <mesh position={[-1.15, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} geometry={geometries.lens} material={materials.lens} castShadow />
      <mesh position={[1.15, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} geometry={geometries.lens} material={materials.lens} castShadow />

      <mesh position={[0, 0.3, 0.05]} rotation={[0, 0, Math.PI / 2]} geometry={geometries.thickBridge} material={materials.bridge} castShadow />
      <mesh position={[0, 0.52, 0.02]} rotation={[0, 0, Math.PI / 2]} geometry={geometries.thinBridge} material={materials.bridge} castShadow />

      <mesh position={[-1.9, 0.28, -0.05]} geometry={geometries.hinge} material={materials.hinge} castShadow />
      <mesh position={[1.9, 0.28, -0.05]} geometry={geometries.hinge} material={materials.hinge} castShadow />

      <mesh position={[-1.95, 0.22, -1.05]} rotation={[0.04, 0.04, 0]} geometry={geometries.temple} material={materials.temple} castShadow />
      <mesh position={[1.95, 0.22, -1.05]} rotation={[0.04, -0.04, 0]} geometry={geometries.temple} material={materials.temple} castShadow />

      <mesh position={[-0.32, -0.15, -0.12]} geometry={geometries.nosePad} material={materials.nosePad} />
      <mesh position={[0.32, -0.15, -0.12]} geometry={geometries.nosePad} material={materials.nosePad} />
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  High Detail GLTF Eyewear Model with Dynamic Bounding Box Scaling    */
/* -------------------------------------------------------------------- */

function EyewearGLTFModel({ isInteracting }: { isInteracting: boolean }) {
  const { scene } = useGLTF("/models/eyewear.glb");
  const groupRef = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);

  const { clonedScene, baseScale } = useMemo(() => {
    const clone = scene.clone();

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    clone.position.x = -center.x;
    clone.position.y = -center.y;
    clone.position.z = -center.z;

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const meshHeight = size.y > 0 ? size.y : 1;
    const meshWidth = size.x > 0 ? size.x : 1;

    const targetHeight = viewport.height * 0.55;
    const maxAllowedWidth = viewport.width * 0.85;

    let scale = targetHeight / meshHeight;
    if (meshWidth * scale > maxAllowedWidth) {
      scale = maxAllowedWidth / meshWidth;
    }

    return {
      clonedScene: clone,
      baseScale: scale,
    };
  }, [scene, viewport.height, viewport.width]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (!isInteracting) {
      groupRef.current.position.y = Math.sin(t * 0.9) * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 4, delta);
    }
  });

  return (
    <group ref={groupRef} scale={baseScale} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Unified Persistent 3D Viewer Component                               */
/* -------------------------------------------------------------------- */

function Persistent3DViewerBase() {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleStart = useCallback(() => setIsInteracting(true), []);
  const handleEnd = useCallback(() => setIsInteracting(false), []);

  return (
    <WebGLErrorBoundary>
      <div className="relative w-full h-[450px] md:h-[550px] bg-transparent flex items-center justify-center pointer-events-auto select-none">
        {/* Top Studio Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/40 border border-slate-200/50 text-xs font-medium tracking-wide text-slate-800 shadow-xs pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>3D INTERACTIVE STUDIO</span>
        </div>

        {/* 3D Canvas */}
        <Canvas
          frameloop="always"
          dpr={[1, 2]}
          gl={{
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            antialias: true,
            failIfMajorPerformanceCaveat: false,
          }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          {/* Camera Configuration */}
          <PerspectiveCamera makeDefault position={[0, 0, 7.5]} fov={35} />

          {/* Luxury Studio Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <pointLight position={[-5, 5, -5]} intensity={0.6} color="#ffffff" />

          {/* Model & Environment */}
          <Suspense fallback={<ProceduralEyewearModel isInteracting={isInteracting} />}>
            <EyewearGLTFModel isInteracting={isInteracting} />
            <Environment preset="studio" />
          </Suspense>

          {/* Soft Ambient Contact Shadow */}
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.35}
            scale={10}
            blur={2}
            far={4.5}
            resolution={512}
          />

          {/* Orbit Controls with Damping & AutoRotate */}
          <OrbitControls
            makeDefault
            enableDamping={true}
            dampingFactor={0.05}
            autoRotate={true}
            autoRotateSpeed={1.2}
            enableZoom={false}
            enablePan={false}
            minDistance={4}
            maxDistance={12}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.7}
            onStart={handleStart}
            onEnd={handleEnd}
          />

          <Preload all />
        </Canvas>

        {/* Bottom Interaction Guide */}
        <div className="absolute bottom-4 z-10 pointer-events-none flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/40 border border-slate-200/50 text-xs font-medium tracking-wide text-slate-700 shadow-xs">
          <Rotate3d className="w-3.5 h-3.5 text-slate-600 animate-spin-slow" />
          <span>SWIPE / DRAG TO INSPECT 360°</span>
        </div>
      </div>
    </WebGLErrorBoundary>
  );
}

export const Persistent3DViewer = memo(Persistent3DViewerBase);
export default Persistent3DViewer;