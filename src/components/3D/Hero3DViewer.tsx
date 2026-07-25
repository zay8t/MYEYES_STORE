"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Preload,
  Html,
  PerformanceMonitor,
  useGLTF,
  Center,
} from "@react-three/drei";
import { useScroll, useMotionValueEvent } from "framer-motion";
import * as THREE from "three";

/* -------------------------------------------------------------------- */
/*  Config                                                               */
/* -------------------------------------------------------------------- */

const CONFIG = {
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
  
  // Load local model from public/models/eyewear.glb
  const { scene } = useGLTF("/models/eyewear.glb");

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

  return (
    <group ref={groupRef}>
      <Center>
        <primitive
          object={scene}
          scale={1.3}
          dispose={null}
        />
      </Center>
    </group>
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

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={8}
            blur={2.2}
            far={3.5}
            resolution={256}
            frames={1} // bake once — the shadow shape barely changes, no need to re-render every frame
          />

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

useGLTF.preload("/models/eyewear.glb");