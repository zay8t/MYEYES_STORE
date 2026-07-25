/* eslint-disable react-hooks/immutability, react-hooks/refs */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export type FrameShape = 'round' | 'aviator' | 'square' | 'cateye';
export type FrameFinish = 'onyx' | 'gold' | 'silver' | 'rosegold';
export type LensTint = 'blue' | 'amber' | 'emerald' | 'clear';

export interface Hero3DViewerProps {
  frameShape?: FrameShape;
  frameFinish?: FrameFinish;
  lensTint?: LensTint;
  autoRotate?: boolean;
}

// ─── Color & Material Configs ─────────────────────────────────────────────

const FINISH_MATERIALS: Record<FrameFinish, { color: string; metalness: number; roughness: number }> = {
  onyx: { color: '#18181b', metalness: 0.85, roughness: 0.20 },
  gold: { color: '#eab308', metalness: 0.95, roughness: 0.12 },
  silver: { color: '#f1f5f9', metalness: 0.98, roughness: 0.06 },
  rosegold: { color: '#fb7185', metalness: 0.90, roughness: 0.15 },
};

const LENS_MATERIALS: Record<LensTint, { color: string; transmission: number; opacity: number; roughness: number }> = {
  blue: { color: '#38bdf8', transmission: 0.85, opacity: 0.68, roughness: 0.04 },
  amber: { color: '#f59e0b', transmission: 0.78, opacity: 0.82, roughness: 0.04 },
  emerald: { color: '#10b981', transmission: 0.80, opacity: 0.72, roughness: 0.04 },
  clear: { color: '#e0f2fe', transmission: 0.95, opacity: 0.30, roughness: 0.01 },
};

// ─── Inline Environment Lighting Setup ─────────────────────────────────────

function LocalEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileCubemapShader();

    const envScene = new THREE.Scene();

    const skyGeo = new THREE.SphereGeometry(50, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      vertexColors: true,
    });

    const pos = skyGeo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + 50) / 100;
      colors.push(
        0.92 + t * 0.08,
        0.92 + t * 0.06,
        0.95 + t * 0.04
      );
    }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const sky = new THREE.Mesh(skyGeo, skyMat);
    envScene.add(sky);

    const renderTarget = pmrem.fromScene(envScene as THREE.Scene);
    scene.environment = renderTarget.texture;

    return () => {
      renderTarget.dispose();
      pmrem.dispose();
      skyGeo.dispose();
      skyMat.dispose();
    };
  }, [gl, scene]);

  return null;
}

// ─── Shared Frame Sub-Components ────────────────────────────────────────────

interface MaterialProps {
  frameMat: THREE.MeshStandardMaterial;
  lensMat?: THREE.MeshPhysicalMaterial;
}

function NosePads({ frameMat }: MaterialProps) {
  return (
    <group>
      {/* Left Nose Pad & Stem */}
      <mesh position={[-0.32, -0.22, 0.12]} rotation={[0.2, 0.3, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-0.35, -0.28, 0.16]} rotation={[0.2, 0.4, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.08]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.92} roughness={0.08} transparent opacity={0.85} ior={1.48} />
      </mesh>

      {/* Right Nose Pad & Stem */}
      <mesh position={[0.32, -0.22, 0.12]} rotation={[0.2, -0.3, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0.35, -0.28, 0.16]} rotation={[0.2, -0.4, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.08]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.92} roughness={0.08} transparent opacity={0.85} ior={1.48} />
      </mesh>
    </group>
  );
}

function TempleArm({
  position,
  rotation,
  frameMat,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  frameMat: THREE.MeshStandardMaterial;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Hinge Joint */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.08]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Straight Arm */}
      <mesh position={[0, 0, -1.1]}>
        <boxGeometry args={[0.05, 0.07, 2.2]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Ear Curve */}
      <mesh position={[0, -0.16, -2.25]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── 1. Classic Round Frame ──────────────────────────────────────────────

function RoundFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Bridge */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.3, 0.04, 16, 32, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Rims */}
      <mesh position={[-1.15, 0, 0]}>
        <torusGeometry args={[0.85, 0.07, 24, 64]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[1.15, 0, 0]}>
        <torusGeometry args={[0.85, 0.07, 24, 64]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Lenses */}
      <mesh position={[-1.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.04, 32]} />
        <primitive object={lensMat} attach="material" />
      </mesh>
      <mesh position={[1.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.04, 32]} />
        <primitive object={lensMat} attach="material" />
      </mesh>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.0, 0.05, -0.05]} rotation={[0, -0.1, 0]} frameMat={frameMat} />
      <TempleArm position={[2.0, 0.05, -0.05]} rotation={[0, 0.1, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 2. Titanium Aviator Frame ──────────────────────────────────────────

function AviatorFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Top Brow Bar */}
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Curved Lower Bridge */}
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left Teardrop Rim */}
      <group position={[-1.2, -0.08, 0]} scale={[1.0, 1.15, 1.0]}>
        <mesh>
          <torusGeometry args={[0.85, 0.045, 24, 64]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.83, 0.83, 0.03, 32]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right Teardrop Rim */}
      <group position={[1.2, -0.08, 0]} scale={[1.0, 1.15, 1.0]}>
        <mesh>
          <torusGeometry args={[0.85, 0.045, 24, 64]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.83, 0.83, 0.03, 32]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.1, 0.1, -0.05]} rotation={[0, -0.12, 0]} frameMat={frameMat} />
      <TempleArm position={[2.1, 0.1, -0.05]} rotation={[0, 0.12, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 3. Modern Square Browline Frame ────────────────────────────────────

function SquareFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Upper Thick Browline Bar */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4.4, 0.18, 0.14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Center Bridge */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.45, 0.1, 0.08]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left Square Rim & Lens */}
      <group position={[-1.2, -0.1, 0]}>
        <mesh>
          <boxGeometry args={[1.7, 1.3, 0.08]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.54, 1.14, 0.09]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right Square Rim & Lens */}
      <group position={[1.2, -0.1, 0]}>
        <mesh>
          <boxGeometry args={[1.7, 1.3, 0.08]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.54, 1.14, 0.09]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.15, 0.35, -0.05]} rotation={[0, -0.1, 0]} frameMat={frameMat} />
      <TempleArm position={[2.15, 0.35, -0.05]} rotation={[0, 0.1, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 4. Cat-Eye Luxe Frame ──────────────────────────────────────────────

function CatEyeFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      {/* High Arched Bridge */}
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left Upswept Cat-Eye Rim */}
      <group position={[-1.25, 0.05, 0]} rotation={[0, 0, 0.18]}>
        <mesh>
          <torusGeometry args={[0.88, 0.075, 24, 64]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh position={[-0.8, 0.6, 0]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.18, 0.5, 16]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.04, 32]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right Upswept Cat-Eye Rim */}
      <group position={[1.25, 0.05, 0]} rotation={[0, 0, -0.18]}>
        <mesh>
          <torusGeometry args={[0.88, 0.075, 24, 64]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh position={[0.8, 0.6, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.18, 0.5, 16]} />
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.04, 32]} />
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.2, 0.25, -0.05]} rotation={[0, -0.14, 0]} frameMat={frameMat} />
      <TempleArm position={[2.2, 0.25, -0.05]} rotation={[0, 0.14, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── Smooth 60FPS Floating & Material Interpolator ────────────────────────

function EyewearStudioModel({
  shape = 'round',
  finish = 'onyx',
  lens = 'blue',
}: {
  shape: FrameShape;
  finish: FrameFinish;
  lens: LensTint;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentScale = useRef<number>(1.0);

  // Pre-allocated target color objects to prevent garbage collection allocation lag
  const frameColorTarget = useRef(new THREE.Color());
  const lensColorTarget = useRef(new THREE.Color());

  // Persisted materials initialized in component state for zero render ref-access errors
  const [frameMaterial] = useState(
    () =>
      new THREE.MeshStandardMaterial({
        color: FINISH_MATERIALS.onyx.color,
        metalness: FINISH_MATERIALS.onyx.metalness,
        roughness: FINISH_MATERIALS.onyx.roughness,
      })
  );

  const [lensMaterial] = useState(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: LENS_MATERIALS.blue.color,
        transmission: LENS_MATERIALS.blue.transmission,
        opacity: LENS_MATERIALS.blue.opacity,
        roughness: LENS_MATERIALS.blue.roughness,
        transparent: true,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        ior: 1.52,
      })
  );

  // Trigger brief elastic scale pop on shape change
  useEffect(() => {
    currentScale.current = 0.90;
  }, [shape]);

  // 60FPS Animation Frame Loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // 1. Ultra-smooth Floating Bob & Breathing Rotation
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.07;
    groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.025;
    groupRef.current.rotation.x = Math.cos(t * 0.7) * 0.015;

    // 2. Smooth Scale Spring Restoration
    currentScale.current = THREE.MathUtils.damp(currentScale.current, 1.0, 10, delta);
    groupRef.current.scale.setScalar(currentScale.current);

    // 3. Zero-Allocation Material Color & Property Interpolation
    const targetFinish = FINISH_MATERIALS[finish] || FINISH_MATERIALS.onyx;
    const targetLens = LENS_MATERIALS[lens] || LENS_MATERIALS.blue;

    frameColorTarget.current.set(targetFinish.color);
    frameMaterial.color.lerp(frameColorTarget.current, delta * 7);
    frameMaterial.metalness = THREE.MathUtils.damp(frameMaterial.metalness, targetFinish.metalness, 8, delta);
    frameMaterial.roughness = THREE.MathUtils.damp(frameMaterial.roughness, targetFinish.roughness, 8, delta);

    lensColorTarget.current.set(targetLens.color);
    lensMaterial.color.lerp(lensColorTarget.current, delta * 7);
    lensMaterial.transmission = THREE.MathUtils.damp(lensMaterial.transmission, targetLens.transmission, 8, delta);
    lensMaterial.opacity = THREE.MathUtils.damp(lensMaterial.opacity, targetLens.opacity, 8, delta);
  });

  return (
    <group ref={groupRef}>
      {shape === 'round' && <RoundFrame frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'aviator' && <AviatorFrame frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'square' && <SquareFrame frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'cateye' && <CatEyeFrame frameMat={frameMaterial} lensMat={lensMaterial} />}
    </group>
  );
}

// ─── Main 3D Canvas Component ───────────────────────────────────────────────

export default function Hero3DViewerInner({
  frameShape = 'round',
  frameFinish = 'onyx',
  lensTint = 'blue',
  autoRotate = true,
}: Hero3DViewerProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
      }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 8.2]} fov={32} />

      <LocalEnvironment />

      {/* Dynamic Studio Lighting */}
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 5, -4]} intensity={0.9} />
      <pointLight position={[0, 4, 3]} intensity={0.65} color="#ffffff" />

      {/* Render Selected 3D Eyewear Frame with 60FPS Lerping */}
      <EyewearStudioModel shape={frameShape} finish={frameFinish} lens={lensTint} />

      {/* Dynamic Soft Studio Drop Shadow */}
      <ContactShadows
        position={[0, -1.48, 0]}
        opacity={0.4}
        scale={8.5}
        blur={2.4}
        far={4}
        resolution={512}
        color="#0f172a"
      />

      {/* Ultra-Smooth Lag-Free Orbit Controls */}
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.035}
        rotateSpeed={0.85}
        autoRotate={autoRotate}
        autoRotateSpeed={1.0}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.65}
      />
    </Canvas>
  );
}
