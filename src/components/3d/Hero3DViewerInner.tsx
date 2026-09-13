'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
  /** Shared ref so the drag overlay (outside Canvas) can drive model rotation */
  targetRotationY: React.MutableRefObject<number>;
  isMobile: boolean;
  onFirstDrag?: () => void;
}

// ─── Color & Material Configs ─────────────────────────────────────────────

const FINISH_MATERIALS: Record<FrameFinish, { color: string; metalness: number; roughness: number }> = {
  onyx:    { color: '#18181b', metalness: 0.85, roughness: 0.20 },
  gold:    { color: '#eab308', metalness: 0.95, roughness: 0.12 },
  silver:  { color: '#f1f5f9', metalness: 0.98, roughness: 0.06 },
  rosegold:{ color: '#fb7185', metalness: 0.90, roughness: 0.15 },
};

const LENS_MATERIALS: Record<LensTint, { color: string; transmission: number; opacity: number; roughness: number }> = {
  blue:    { color: '#38bdf8', transmission: 0.85, opacity: 0.68, roughness: 0.04 },
  amber:   { color: '#f59e0b', transmission: 0.78, opacity: 0.82, roughness: 0.04 },
  emerald: { color: '#10b981', transmission: 0.80, opacity: 0.72, roughness: 0.04 },
  clear:   { color: '#e0f2fe', transmission: 0.95, opacity: 0.30, roughness: 0.01 },
};

// ─── Shared Frame Sub-Components ────────────────────────────────────────────

function NosePads({ frameMat }: { frameMat: THREE.MeshStandardMaterial }) {
  return (
    <group>
      <mesh position={[-0.32, -0.22, 0.12]} rotation={[0.2, 0.3, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-0.35, -0.28, 0.16]} rotation={[0.2, 0.4, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.08]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.92} roughness={0.08} transparent opacity={0.85} ior={1.48} />
      </mesh>
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
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.08]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, -1.1]}>
        <boxGeometry args={[0.05, 0.07, 2.2]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, -0.16, -2.25]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── 1. Classic Round ────────────────────────────────────────────────────────

function RoundFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.3, 0.04, 16, 32, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-1.15, 0, 0]}>
        <torusGeometry args={[0.85, 0.07, 24, 64]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[1.15, 0, 0]}>
        <torusGeometry args={[0.85, 0.07, 24, 64]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
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

// ─── Procedural Teardrop Aviator Geometry Helpers ──────────────────────────

function createTeardropLensShape(isLeft: boolean) {
  const shape = new THREE.Shape();
  const s = isLeft ? 1 : -1;

  // Start at top-inner near bridge
  shape.moveTo(0.52 * s, 0.45);
  // Wide curved upper brow
  shape.bezierCurveTo(0.15 * s, 0.48, -0.55 * s, 0.43, -0.76 * s, 0.32);
  // Outer drooping teardrop slope
  shape.bezierCurveTo(-0.95 * s, 0.18, -0.92 * s, -0.28, -0.68 * s, -0.68);
  // Bottom teardrop sag apex
  shape.bezierCurveTo(-0.48 * s, -0.92, -0.05 * s, -0.95, 0.20 * s, -0.80);
  // Inner nose contour rising up
  shape.bezierCurveTo(0.52 * s, -0.62, 0.64 * s, -0.15, 0.58 * s, 0.18);
  shape.bezierCurveTo(0.56 * s, 0.34, 0.54 * s, 0.41, 0.52 * s, 0.45);

  return shape;
}

const leftAviatorShape = createTeardropLensShape(true);
const rightAviatorShape = createTeardropLensShape(false);

const createTeardropRimGeometry = (shape: THREE.Shape) => {
  const pts2d = shape.getPoints(54);
  const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts3d, true);
  return new THREE.TubeGeometry(curve, 64, 0.022, 12, true);
};

const createTeardropLensGeometry = (shape: THREE.Shape) => {
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  });
};

const leftAviatorRimGeo = createTeardropRimGeometry(leftAviatorShape);
const rightAviatorRimGeo = createTeardropRimGeometry(rightAviatorShape);
const leftAviatorLensGeo = createTeardropLensGeometry(leftAviatorShape);
const rightAviatorLensGeo = createTeardropLensGeometry(rightAviatorShape);

// ─── 2. Titanium Aviator ─────────────────────────────────────────────────────

function AviatorFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Elevated Slim Titanium Top Brow Bar */}
      <mesh position={[0, 0.43, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.45, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Arched Lower Nose Bridge */}
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.26, 0.022, 12, 24, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left Teardrop Aviator Rim & Refractive Lens */}
      <group position={[-1.02, -0.04, 0]}>
        <mesh geometry={leftAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftAviatorLensGeo} position={[0, 0, -0.011]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right Teardrop Aviator Rim & Refractive Lens */}
      <group position={[1.02, -0.04, 0]}>
        <mesh geometry={rightAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightAviatorLensGeo} position={[0, 0, -0.011]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.94, 0.28, -0.05]} rotation={[0, -0.12, 0]} frameMat={frameMat} />
      <TempleArm position={[1.94, 0.28, -0.05]} rotation={[0, 0.12, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 3. Square Browline ──────────────────────────────────────────────────────

function SquareFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4.4, 0.18, 0.14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.45, 0.1, 0.08]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
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

// ─── 4. Cat-Eye Luxe ─────────────────────────────────────────────────────────

function CatEyeFrame({ frameMat, lensMat }: { frameMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshPhysicalMaterial }) {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
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

// ─── Eyewear Studio Model – 60 FPS lerp with shared rotation ref ─────────────

function EyewearStudioModel({
  shape = 'round',
  finish = 'onyx',
  lens = 'blue',
  targetRotationY,
  autoRotate,
  isMobile,
}: {
  shape: FrameShape;
  finish: FrameFinish;
  lens: LensTint;
  targetRotationY: React.MutableRefObject<number>;
  autoRotate: boolean;
  isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentScale = useRef<number>(1.0);
  const frameColorTarget = useRef(new THREE.Color());
  const lensColorTarget   = useRef(new THREE.Color());

  const [frameMaterial] = useState(
    () => new THREE.MeshStandardMaterial({
      color: FINISH_MATERIALS.onyx.color,
      metalness: FINISH_MATERIALS.onyx.metalness,
      roughness: FINISH_MATERIALS.onyx.roughness,
    })
  );

  const [lensMaterial] = useState(
    () => new THREE.MeshPhysicalMaterial({
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

  // Elastic scale pop on shape switch
  useEffect(() => { currentScale.current = 0.90; }, [shape]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating bob + subtle breathing tilt
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.07;
    groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.025;
    groupRef.current.rotation.x = Math.cos(t * 0.7) * 0.015;

    // On mobile: damp Y rotation toward the overlay-driven targetRotationY ref.
    // On desktop: OrbitControls owns the camera; keep model Y at 0.
    if (isMobile) {
      if (autoRotate) {
        // Gentle idle auto-spin before user interacts
        targetRotationY.current += delta * 0.4;
      }
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        3.8,
        delta
      );
    }

    // Elastic scale spring
    currentScale.current = THREE.MathUtils.damp(currentScale.current, 1.0, 10, delta);
    groupRef.current.scale.setScalar(currentScale.current);

    // Smooth PBR material transitions
    const tf = FINISH_MATERIALS[finish] || FINISH_MATERIALS.onyx;
    const tl = LENS_MATERIALS[lens]   || LENS_MATERIALS.blue;

    frameColorTarget.current.set(tf.color);
    frameMaterial.color.lerp(frameColorTarget.current, delta * 7);
    frameMaterial.metalness = THREE.MathUtils.damp(frameMaterial.metalness, tf.metalness, 8, delta);
    frameMaterial.roughness = THREE.MathUtils.damp(frameMaterial.roughness, tf.roughness, 8, delta);

    lensColorTarget.current.set(tl.color);
    lensMaterial.color.lerp(lensColorTarget.current, delta * 7);
    lensMaterial.transmission = THREE.MathUtils.damp(lensMaterial.transmission, tl.transmission, 8, delta);
    lensMaterial.opacity      = THREE.MathUtils.damp(lensMaterial.opacity,      tl.opacity,      8, delta);
  });

  return (
    <group ref={groupRef}>
      {shape === 'round'   && <RoundFrame   frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'aviator' && <AviatorFrame frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'square'  && <SquareFrame  frameMat={frameMaterial} lensMat={lensMaterial} />}
      {shape === 'cateye'  && <CatEyeFrame  frameMat={frameMaterial} lensMat={lensMaterial} />}
    </group>
  );
}

// ─── Main 3D Canvas Component ────────────────────────────────────────────────
//
// Architecture:
//  • Desktop (md+): Canvas has pointer-events:auto and OrbitControls is mounted
//    for full mouse-drag + momentum orbit.
//  • Mobile (<md): Canvas has pointer-events:none so iOS/Android never intercept
//    scroll. A sibling DOM <div> overlay (touch-action:pan-y, pointer-events:auto)
//    handles horizontal swipe → targetRotationY ref → useFrame damp.
//
export default function Hero3DViewerInner({
  frameShape = 'round',
  frameFinish = 'onyx',
  lensTint = 'blue',
  autoRotate = true,
  targetRotationY,
  isMobile,
  onFirstDrag,
}: Hero3DViewerProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      onCreated={({ gl }) => {
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          console.warn('WebGL context lost handled gracefully.');
        };
        const domElement = gl.domElement;
        if (domElement) {
          domElement.addEventListener('webglcontextlost', handleContextLost, false);
        }
      }}
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        // KEY: on mobile the canvas is invisible to pointer events so the browser
        // never has a chance to call preventDefault() and block page scroll.
        pointerEvents: isMobile ? 'none' : 'auto',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6.6]} fov={34} />

      {/* Studio Lighting */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 5]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 5, -4]} intensity={0.9} />
      <pointLight position={[0, 4, 3]} intensity={0.65} color="#ffffff" />

      {/* 3D Eyewear Model */}
      <EyewearStudioModel
        shape={frameShape}
        finish={frameFinish}
        lens={lensTint}
        targetRotationY={targetRotationY}
        autoRotate={autoRotate}
        isMobile={isMobile}
      />

      {/* Soft contact shadow */}
      <ContactShadows
        position={[0, -1.52, 0]}
        opacity={0.4}
        scale={9.2}
        blur={2.4}
        far={4}
        resolution={512}
        color="#0f172a"
      />

      {/* OrbitControls — only on desktop; mobile rotation is handled by the DOM overlay */}
      {!isMobile && (
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.85}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          minPolarAngle={Math.PI / 2.3}
          maxPolarAngle={Math.PI / 1.7}
        />
      )}
    </Canvas>
  );
}
