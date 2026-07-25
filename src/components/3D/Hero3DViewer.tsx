"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Preload,
  Html,
  PerformanceMonitor,
} from "@react-three/drei";
import { useScroll, useMotionValueEvent } from "framer-motion";
import * as THREE from "three";

/* -------------------------------------------------------------------- */
/*  Config                                                               */
/* -------------------------------------------------------------------- */

const CONFIG = {
  frameColor: "#334155",
  hingeColor: "#334155",
  templeColor: "#1e293b",
  bridgeColor: "#475569",
  lensColor: "#0f172a",
  nosePadColor: "#e2e8f0",

  bobAmplitude: 0.08,
  bobSpeed: 0.7,
  tiltAmplitude: 0.03,
  tiltSpeed: 0.4,

  scrollRotationRange: Math.PI * 1.25,
  scrollDamp: 4, // higher = snappier tracking of scroll position

  // Idle auto-rotate
  idleDelayMs: 2500, // how long to wait after interaction before spinning again
  idleSpinSpeed: 0.22, // rad/s at full ramp
  idleRampDamp: 2.5, // how quickly the spin fades in/out (lower = softer)
};

/* -------------------------------------------------------------------- */
/*  Shared geometries & materials — created ONCE, reused across meshes. */
/*  This is the single biggest win for smoothness: no per-render        */
/*  allocation, no duplicate GPU buffers for symmetric parts.           */
/* -------------------------------------------------------------------- */

function useAssets() {
  return useMemo(() => {
    const geometries = {
      rim: new THREE.TorusGeometry(0.75, 0.07, 16, 64),
      lens: new THREE.CylinderGeometry(0.72, 0.72, 0.04, 32),
      thickBridge: new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16),
      thinBridge: new THREE.CylinderGeometry(0.035, 0.035, 1.2, 16),
      hinge: new THREE.BoxGeometry(0.15, 0.08, 0.1),
      temple: new THREE.BoxGeometry(0.05, 0.06, 2.1),
      nosePad: new THREE.SphereGeometry(0.07, 16, 16),
    };

    const materials = {
      frame: new THREE.MeshStandardMaterial({
        color: CONFIG.frameColor,
        metalness: 0.9,
        roughness: 0.15,
      }),
      hinge: new THREE.MeshStandardMaterial({
        color: CONFIG.hingeColor,
        metalness: 0.9,
        roughness: 0.12,
      }),
      temple: new THREE.MeshStandardMaterial({
        color: CONFIG.templeColor,
        metalness: 0.8,
        roughness: 0.22,
      }),
      bridge: new THREE.MeshStandardMaterial({
        color: CONFIG.bridgeColor,
        metalness: 0.95,
        roughness: 0.1,
      }),
      // Clearcoat only (no transmission) — gives glassy depth without
      // the extra transmission render pass, which is the #1 hidden
      // frame-rate killer in three.js hero scenes.
      lens: new THREE.MeshPhysicalMaterial({
        color: CONFIG.lensColor,
        metalness: 0.5,
        roughness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: 0.92,
      }),
      nosePad: new THREE.MeshStandardMaterial({
        color: CONFIG.nosePadColor,
        transparent: true,
        opacity: 0.8,
        roughness: 0.4,
      }),
    };

    return { geometries, materials };
  }, []);
}

/* -------------------------------------------------------------------- */
/*  Model                                                                */
/* -------------------------------------------------------------------- */

function SunglassesModel({
  isInteracting,
  isIdle,
}: {
  isInteracting: boolean;
  isIdle: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const scrollTarget = useRef(0);
  const scrollRotation = useRef(0);
  const idleRotation = useRef(0);
  const idleInfluence = useRef(0);

  const { scrollYProgress } = useScroll();
  const { geometries: g, materials: m } = useAssets();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    scrollTarget.current = latest * CONFIG.scrollRotationRange;
  });

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Smoothly track the scroll position instead of snapping to it.
    scrollRotation.current = THREE.MathUtils.damp(
      scrollRotation.current,
      scrollTarget.current,
      CONFIG.scrollDamp,
      delta
    );

    // Ramp the idle auto-rotate speed in/out rather than toggling it,
    // so it never has a visible "kick" when it starts or stops.
    idleInfluence.current = THREE.MathUtils.damp(
      idleInfluence.current,
      isIdle ? 1 : 0,
      CONFIG.idleRampDamp,
      delta
    );
    idleRotation.current +=
      CONFIG.idleSpinSpeed * idleInfluence.current * delta;

    groupRef.current.rotation.y =
      scrollRotation.current + idleRotation.current;

    // Idle bob/tilt — softened (not stopped) while dragging so it never
    // visibly fights manual orbit control.
    const bobInfluence = isInteracting ? 0.25 : 1;
    groupRef.current.position.y =
      Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude * bobInfluence;
    groupRef.current.rotation.x =
      Math.sin(t * CONFIG.tiltSpeed) * CONFIG.tiltAmplitude * bobInfluence;
  });

  const { size } = useThree();
  const responsiveScale = useMemo(() => {
    if (size.width < 640) {
      return 2.55; // Mobile: reduced from 3.0 (-15%)
    } else if (size.width < 1024) {
      return 2.04; // Tablet: reduced from 2.4 (-15%)
    } else {
      return 1.66; // Desktop: reduced from 1.95 (-15%)
    }
  }, [size.width]);

  return (
    <group ref={groupRef} scale={responsiveScale} dispose={null}>
      <mesh position={[-1.15, 0, 0]} geometry={g.rim} material={m.frame} castShadow />
      <mesh position={[1.15, 0, 0]} geometry={g.rim} material={m.frame} castShadow />

      <mesh
        position={[-1.15, 0, 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={g.lens}
        material={m.lens}
        castShadow
      />
      <mesh
        position={[1.15, 0, 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={g.lens}
        material={m.lens}
        castShadow
      />

      <mesh
        position={[0, 0.3, 0.05]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={g.thickBridge}
        material={m.bridge}
        castShadow
      />
      <mesh
        position={[0, 0.52, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={g.thinBridge}
        material={m.bridge}
        castShadow
      />

      <mesh position={[-1.9, 0.28, -0.05]} geometry={g.hinge} material={m.hinge} castShadow />
      <mesh position={[1.9, 0.28, -0.05]} geometry={g.hinge} material={m.hinge} castShadow />

      <mesh
        position={[-1.95, 0.22, -1.05]}
        rotation={[0.04, 0.04, 0]}
        geometry={g.temple}
        material={m.temple}
        castShadow
      />
      <mesh
        position={[1.95, 0.22, -1.05]}
        rotation={[0.04, -0.04, 0]}
        geometry={g.temple}
        material={m.temple}
        castShadow
      />

      <mesh position={[-0.32, -0.15, -0.12]} geometry={g.nosePad} material={m.nosePad} />
      <mesh position={[0.32, -0.15, -0.12]} geometry={g.nosePad} material={m.nosePad} />
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Responsive Contact Shadows                                          */
/* -------------------------------------------------------------------- */

function ResponsiveContactShadows() {
  const { size } = useThree();
  const { yPos, shadowScale } = useMemo(() => {
    if (size.width < 640) {
      return { yPos: -2.17, shadowScale: 12 }; // Mobile: reduced (-15%)
    } else if (size.width < 1024) {
      return { yPos: -1.73, shadowScale: 10 }; // Tablet: reduced (-15%)
    } else {
      return { yPos: -1.41, shadowScale: 8.5 }; // Desktop: reduced (-15%)
    }
  }, [size.width]);

  return (
    <ContactShadows
      position={[0, yPos, 0]}
      opacity={0.4}
      scale={shadowScale}
      blur={2.2}
      far={3.5}
      resolution={256}
      frames={1}
    />
  );
}

/* -------------------------------------------------------------------- */
/*  Loading fallback                                                     */
/* -------------------------------------------------------------------- */

function ViewerLoader() {
  return (
    <Html center>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    </Html>
  );
}

/* -------------------------------------------------------------------- */
/*  Public component                                                     */
/* -------------------------------------------------------------------- */

export default function Hero3DViewer() {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isIdle, setIsIdle] = useState(true); // auto-rotate from first paint
  const [dpr, setDpr] = useState(1.5);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), CONFIG.idleDelayMs);
  };

  return (
    <div className="relative h-full w-full select-none bg-transparent">
      <Canvas
        shadows="soft"
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        className="h-full w-full"
      >
        {/* Watches real frame timing and backs off pixel ratio on
            weaker devices instead of letting the whole scene stutter. */}
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
          flipflops={3}
        />

        <ambientLight intensity={0.55} />
        <directionalLight
          position={[5, 12, 6]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-6, 6, -5]} intensity={0.35} />
        <spotLight position={[0, 8, 2]} angle={0.3} penumbra={1} intensity={0.8} />

        <Suspense fallback={<ViewerLoader />}>
          <Environment preset="studio" resolution={256} />

          <SunglassesModel isInteracting={isInteracting} isIdle={isIdle} />

          <ResponsiveContactShadows />

          <Preload all />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
      </Canvas>
    </div>
  );
}