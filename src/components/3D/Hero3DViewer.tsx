"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Preload,
  AdaptiveDpr,
  AdaptiveEvents,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, N8AO } from "@react-three/postprocessing";
import { useScroll, useMotionValueEvent } from "framer-motion";
import * as THREE from "three";

/* -------------------------------------------------------------------- */
/*  Config — tune the whole model from one place                        */
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
  tiltAmplitude: 0.035,
  tiltSpeed: 0.4,
  scrollRotationRange: Math.PI * 1.25,
  dampFactor: 4, // higher = snappier, lower = smoother/laggier
};

/* -------------------------------------------------------------------- */
/*  Model                                                                */
/* -------------------------------------------------------------------- */

function SunglassesModel({ isInteracting }: { isInteracting: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scrollTarget = useRef(0);
  const currentRotationY = useRef(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    scrollTarget.current = latest * CONFIG.scrollRotationRange;
  });

  // Reusable materials so we don't allocate a new material per mesh per render
  const materials = useMemo(
    () => ({
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
      // Physical material gives the lenses real glass-like depth
      // (clearcoat + subtle transmission) instead of a flat dark disc.
      lens: new THREE.MeshPhysicalMaterial({
        color: CONFIG.lensColor,
        metalness: 0.4,
        roughness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transmission: 0.12,
        thickness: 0.3,
        transparent: true,
        opacity: 0.92,
      }),
      nosePad: new THREE.MeshStandardMaterial({
        color: CONFIG.nosePadColor,
        transparent: true,
        opacity: 0.8,
        roughness: 0.4,
      }),
    }),
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Smoothly damp toward the scroll-driven rotation instead of snapping,
    // which removes the jitter you get from directly assigning motion values.
    currentRotationY.current = THREE.MathUtils.damp(
      currentRotationY.current,
      scrollTarget.current,
      CONFIG.dampFactor,
      delta
    );
    groupRef.current.rotation.y = currentRotationY.current;

    // Idle bob/tilt — dialed back (not disabled) while the user is
    // dragging so manual control never feels like it's fighting the loop.
    const idleInfluence = isInteracting ? 0.25 : 1;
    groupRef.current.position.y =
      Math.sin(t * CONFIG.bobSpeed) * CONFIG.bobAmplitude * idleInfluence;
    groupRef.current.rotation.x =
      Math.sin(t * CONFIG.tiltSpeed) * CONFIG.tiltAmplitude * idleInfluence;
  });

  return (
    <group ref={groupRef} scale={1.2} dispose={null}>
      {/* Left / Right Frame Rims */}
      <mesh position={[-1.15, 0, 0]} material={materials.frame} castShadow receiveShadow>
        <torusGeometry args={[0.75, 0.07, 24, 128]} />
      </mesh>
      <mesh position={[1.15, 0, 0]} material={materials.frame} castShadow receiveShadow>
        <torusGeometry args={[0.75, 0.07, 24, 128]} />
      </mesh>

      {/* Left / Right Lenses */}
      <mesh
        position={[-1.15, 0, 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.lens}
        castShadow
      >
        <cylinderGeometry args={[0.72, 0.72, 0.04, 48]} />
      </mesh>
      <mesh
        position={[1.15, 0, 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.lens}
        castShadow
      >
        <cylinderGeometry args={[0.72, 0.72, 0.04, 48]} />
      </mesh>

      {/* Bridge Connectors */}
      <mesh
        position={[0, 0.3, 0.05]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.bridge}
        castShadow
      >
        <cylinderGeometry args={[0.05, 0.05, 0.8, 24]} />
      </mesh>
      <mesh
        position={[0, 0.52, 0.02]}
        rotation={[0, 0, Math.PI / 2]}
        material={materials.bridge}
        castShadow
      >
        <cylinderGeometry args={[0.035, 0.035, 1.2, 24]} />
      </mesh>

      {/* Hinge Joints */}
      <mesh position={[-1.9, 0.28, -0.05]} material={materials.hinge} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.1]} />
      </mesh>
      <mesh position={[1.9, 0.28, -0.05]} material={materials.hinge} castShadow>
        <boxGeometry args={[0.15, 0.08, 0.1]} />
      </mesh>

      {/* Temple Arms */}
      <mesh
        position={[-1.95, 0.22, -1.05]}
        rotation={[0.04, 0.04, 0]}
        material={materials.temple}
        castShadow
      >
        <boxGeometry args={[0.05, 0.06, 2.1]} />
      </mesh>
      <mesh
        position={[1.95, 0.22, -1.05]}
        rotation={[0.04, -0.04, 0]}
        material={materials.temple}
        castShadow
      >
        <boxGeometry args={[0.05, 0.06, 2.1]} />
      </mesh>

      {/* Nose Pads */}
      <mesh position={[-0.32, -0.15, -0.12]} material={materials.nosePad}>
        <sphereGeometry args={[0.07, 24, 24]} />
      </mesh>
      <mesh position={[0.32, -0.15, -0.12]} material={materials.nosePad}>
        <sphereGeometry args={[0.07, 24, 24]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------- */
/*  Loading fallback shown while the Environment/model set up           */
/* -------------------------------------------------------------------- */

function ViewerLoader() {
  return (
    <Html center>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    </Html>
  );
}

/* -------------------------------------------------------------------- */
/*  Public component                                                    */
/* -------------------------------------------------------------------- */

export default function Hero3DViewer() {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div className="relative w-full h-full select-none bg-transparent">
      <Canvas
        shadows
        dpr={[1, 2]} // cap the pixel ratio: crisp on retina, cheap on 4K
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        className="w-full h-full"
      >
        {/* Keeps frame rate stable by trimming DPR/events under load
            instead of just dropping frames on weaker devices. */}
        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 12, 6]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-6, 6, -5]} intensity={0.35} />
        <spotLight position={[0, 8, 2]} angle={0.3} penumbra={1} intensity={0.9} />

        <Suspense fallback={<ViewerLoader />}>
          {/* Studio HDRI drives the metal/glass reflections — this alone
              is most of the "premium product shot" look. */}
          <Environment preset="studio" />

          <SunglassesModel isInteracting={isInteracting} />

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={8}
            blur={2.5}
            far={3.5}
            resolution={512}
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
          onStart={() => setIsInteracting(true)}
          onEnd={() => setIsInteracting(false)}
        />

        {/* Subtle contact-shadow style AO + a light bloom on the specular
            hotspots — this is what separates "3D demo" from "product page". */}
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={0.6} intensity={1.1} />
          <Bloom
            intensity={0.25}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}