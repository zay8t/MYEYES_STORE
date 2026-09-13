'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  PerspectiveCamera,
  Environment,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Public API Types ─────────────────────────────────────────────────────────

export type FrameShape  = 'round' | 'aviator' | 'square' | 'cateye';
export type FrameFinish = 'onyx' | 'gold' | 'silver' | 'rosegold';
export type LensTint    = 'blue' | 'amber' | 'emerald' | 'clear';

export interface Hero3DViewerProps {
  frameShape?:     FrameShape;
  frameFinish?:    FrameFinish;
  lensTint?:       LensTint;
  autoRotate?:     boolean;
  targetRotationY: React.MutableRefObject<number>;
  isMobile:        boolean;
  onFirstDrag?:    () => void;
}

// ─── PBR Material Configs ─────────────────────────────────────────────────────

/**
 * Two-tier frame materials:
 *  • Acetate (onyx / rosegold)   – dielectric, deep clearcoat gloss
 *  • Metal   (gold / silver)     – high metalness, low roughness
 */
const FINISH_CONFIG: Record<
  FrameFinish,
  {
    color:             string;
    metalness:         number;
    roughness:         number;
    clearcoat:         number;
    clearcoatRoughness:number;
    sheenColor?:       string;
  }
> = {
  onyx: {
    color:              '#111117',
    metalness:          0.0,
    roughness:          0.18,
    clearcoat:          1.0,
    clearcoatRoughness: 0.07,
  },
  gold: {
    color:              '#c8960c',
    metalness:          0.97,
    roughness:          0.05,
    clearcoat:          0.3,
    clearcoatRoughness: 0.05,
  },
  silver: {
    color:              '#d4d8e0',
    metalness:          0.98,
    roughness:          0.04,
    clearcoat:          0.2,
    clearcoatRoughness: 0.04,
  },
  rosegold: {
    color:              '#c8736a',
    metalness:          0.0,
    roughness:          0.20,
    clearcoat:          1.0,
    clearcoatRoughness: 0.09,
    sheenColor:         '#f4b8b8',
  },
};

/**
 * Physical optical glass lens parameters.
 * - transmission: fraction of light transmitted (1.0 = fully transparent)
 * - ior: index of refraction (real glass ≈ 1.52)
 * - thickness: physical depth of the lens slab in world units (drives refraction parallax)
 * - attenuationColor: beer-law colour deep inside the glass
 * - attenuationDistance: how deep (in world units) before the colour saturates
 */
const LENS_CONFIG: Record<
  LensTint,
  {
    color:               string;
    transmission:        number;
    ior:                 number;
    thickness:           number;
    roughness:           number;
    clearcoat:           number;
    clearcoatRoughness:  number;
    attenuationColor:    string;
    attenuationDistance: number;
    opacity:             number;
  }
> = {
  // Anti-Blue Light – very faint cyan tint, slight mirror coating
  blue: {
    color:               '#c8e8ff',
    transmission:        0.88,
    ior:                 1.52,
    thickness:           0.06,
    roughness:           0.02,
    clearcoat:           0.95,
    clearcoatRoughness:  0.02,
    attenuationColor:    '#4eb8f8',
    attenuationDistance: 0.6,
    opacity:             1.0,
  },
  // Sun / Amber – warm amber photochromic
  amber: {
    color:               '#ffe8a0',
    transmission:        0.68,
    ior:                 1.52,
    thickness:           0.07,
    roughness:           0.03,
    clearcoat:           0.9,
    clearcoatRoughness:  0.03,
    attenuationColor:    '#e89020',
    attenuationDistance: 0.28,
    opacity:             1.0,
  },
  // Emerald – rich green tint
  emerald: {
    color:               '#a0ffd8',
    transmission:        0.72,
    ior:                 1.52,
    thickness:           0.07,
    roughness:           0.02,
    clearcoat:           0.92,
    clearcoatRoughness:  0.02,
    attenuationColor:    '#0d8a5a',
    attenuationDistance: 0.30,
    opacity:             1.0,
  },
  // Ultra Clear – near-invisible optical glass
  clear: {
    color:               '#edf6ff',
    transmission:        0.97,
    ior:                 1.52,
    thickness:           0.05,
    roughness:           0.01,
    clearcoat:           1.0,
    clearcoatRoughness:  0.01,
    attenuationColor:    '#d0e8ff',
    attenuationDistance: 1.2,
    opacity:             1.0,
  },
};

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

/**
 * Build a rounded-rectangle (stadium) 2-D shape for the Square Browline lens cutout.
 * Uses four arc corners for a realistic squared lens.
 */
function makeRoundedRect(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo( hw - r, -hh);
  shape.quadraticCurveTo( hw, -hh,  hw, -hh + r);
  shape.lineTo( hw,  hh - r);
  shape.quadraticCurveTo( hw,  hh,  hw - r,  hh);
  shape.lineTo(-hw + r,  hh);
  shape.quadraticCurveTo(-hw,  hh, -hw,  hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

/** Extrude options for frame rims that need bevel depth */
const FRAME_EXTRUDE_OPTS: THREE.ExtrudeGeometryOptions = {
  depth:           0.09,
  bevelEnabled:    true,
  bevelThickness:  0.016,
  bevelSize:       0.014,
  bevelSegments:   4,
};

/** Extrude options for lens slabs (thinner, smooth chamfer) */
const LENS_EXTRUDE_OPTS: THREE.ExtrudeGeometryOptions = {
  depth:           0.06,
  bevelEnabled:    true,
  bevelThickness:  0.010,
  bevelSize:       0.008,
  bevelSegments:   3,
};

// ─── Aviator Teardrop shapes (module-level, created once) ─────────────────────

function buildTeardropShape(isLeft: boolean): THREE.Shape {
  const s = isLeft ? 1 : -1;
  const shape = new THREE.Shape();
  shape.moveTo( 0.52 * s,  0.48);
  shape.bezierCurveTo( 0.15 * s,  0.52, -0.55 * s,  0.46, -0.78 * s,  0.34);
  shape.bezierCurveTo(-0.98 * s,  0.20, -0.95 * s, -0.30, -0.70 * s, -0.72);
  shape.bezierCurveTo(-0.50 * s, -0.96, -0.06 * s, -0.98,  0.22 * s, -0.82);
  shape.bezierCurveTo( 0.54 * s, -0.64,  0.66 * s, -0.16,  0.60 * s,  0.20);
  shape.bezierCurveTo( 0.57 * s,  0.36,  0.54 * s,  0.44,  0.52 * s,  0.48);
  return shape;
}

function buildCatEyeShape(isLeft: boolean): THREE.Shape {
  const s = isLeft ? 1 : -1;
  const shape = new THREE.Shape();
  // Bottom inner nose side
  shape.moveTo( 0.50 * s, -0.42);
  // Sweep along bottom
  shape.bezierCurveTo( 0.60 * s, -0.52, -0.55 * s, -0.58, -0.72 * s, -0.28);
  // Up the outer side
  shape.bezierCurveTo(-0.95 * s, -0.05, -0.90 * s,  0.38, -0.68 * s,  0.54);
  // Cat-eye upswept outer-top corner
  shape.bezierCurveTo(-0.50 * s,  0.68, -0.22 * s,  0.88,  0.05 * s,  0.82);
  // Inner brow, angled inward
  shape.bezierCurveTo( 0.35 * s,  0.74,  0.58 * s,  0.38,  0.56 * s,  0.10);
  shape.bezierCurveTo( 0.55 * s, -0.08,  0.50 * s, -0.28,  0.50 * s, -0.42);
  return shape;
}

const leftTeardropShape  = buildTeardropShape(true);
const rightTeardropShape = buildTeardropShape(false);
const leftCatEyeShape    = buildCatEyeShape(true);
const rightCatEyeShape   = buildCatEyeShape(false);

// Pre-bake geometries (expensive; do once at module level)
function buildTubeRimGeo(shape: THREE.Shape, tubularSeg = 96, tubeR = 0.028): THREE.TubeGeometry {
  const pts2d = shape.getPoints(72);
  const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve  = new THREE.CatmullRomCurve3(pts3d, true);
  return new THREE.TubeGeometry(curve, tubularSeg, tubeR, 14, true);
}

const leftAviatorRimGeo  = buildTubeRimGeo(leftTeardropShape);
const rightAviatorRimGeo = buildTubeRimGeo(rightTeardropShape);

const leftAviatorLensGeo  = new THREE.ExtrudeGeometry(leftTeardropShape,  LENS_EXTRUDE_OPTS);
const rightAviatorLensGeo = new THREE.ExtrudeGeometry(rightTeardropShape, LENS_EXTRUDE_OPTS);

const leftCatEyeRimGeo   = buildTubeRimGeo(leftCatEyeShape,  88, 0.032);
const rightCatEyeRimGeo  = buildTubeRimGeo(rightCatEyeShape, 88, 0.032);

const leftCatEyeLensGeo  = new THREE.ExtrudeGeometry(leftCatEyeShape,  LENS_EXTRUDE_OPTS);
const rightCatEyeLensGeo = new THREE.ExtrudeGeometry(rightCatEyeShape, LENS_EXTRUDE_OPTS);

// Square lens: rounded rect
const squareLensShape  = makeRoundedRect(1.52, 1.10, 0.10);
const squareLensGeo    = new THREE.ExtrudeGeometry(squareLensShape,  LENS_EXTRUDE_OPTS);
const squareFrameShape = makeRoundedRect(1.68, 1.26, 0.12);
const squareFrameGeo   = new THREE.ExtrudeGeometry(squareFrameShape, FRAME_EXTRUDE_OPTS);

// ─── Sub-Components ──────────────────────────────────────────────────────────

/**
 * Silicone nose pads — semi-transparent, soft silicone appearance.
 * Two angled pads symmetrically placed at the bridge nasal rest.
 */
function NosePads({ frameMat }: { frameMat: THREE.MeshPhysicalMaterial }) {
  const padMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color:       '#e8edf2',
        transmission: 0.55,
        roughness:    0.30,
        ior:          1.42,
        thickness:    0.06,
        transparent:  true,
        opacity:      0.90,
      }),
    []
  );
  return (
    <group>
      {/* Left pad arm */}
      <mesh position={[-0.30, -0.24, 0.08]} rotation={[0.15, 0.35, -0.18]}>
        <cylinderGeometry args={[0.018, 0.018, 0.20, 14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Left silicone pad */}
      <mesh position={[-0.34, -0.32, 0.14]} rotation={[0.25, 0.42, 0.0]}>
        <boxGeometry args={[0.038, 0.13, 0.06]} />
        <primitive object={padMat} attach="material" />
      </mesh>
      {/* Right pad arm */}
      <mesh position={[0.30, -0.24, 0.08]} rotation={[0.15, -0.35, 0.18]}>
        <cylinderGeometry args={[0.018, 0.018, 0.20, 14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Right silicone pad */}
      <mesh position={[0.34, -0.32, 0.14]} rotation={[0.25, -0.42, 0.0]}>
        <boxGeometry args={[0.038, 0.13, 0.06]} />
        <primitive object={padMat} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * Temple arm — three-segment: thick hinge block → slim straight arm → tapered tip.
 * Hinge is a small bevelled box; the arm uses a rounded cylinder cross-section.
 */
function TempleArm({
  position,
  rotation,
  frameMat,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  frameMat: THREE.MeshPhysicalMaterial;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Hinge block */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.10, 0.13, 0.09]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Hinge screw cylinder */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.11, 10]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Main arm shaft */}
      <mesh position={[0, 0, -1.15]}>
        <boxGeometry args={[0.055, 0.075, 2.30]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Tapered tip / ear hook */}
      <mesh position={[0, -0.18, -2.32]} rotation={[0.42, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.012, 0.38, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── 1. Classic Round ────────────────────────────────────────────────────────

function RoundFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  // Lens disc geometry (flat cylinder with bevel-ish edge)
  const lensGeo = useMemo(
    () => new THREE.CylinderGeometry(0.78, 0.78, 0.055, 72, 1, false),
    []
  );
  return (
    <group>
      {/* Nose bridge – arched torus */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.28, 0.030, 14, 32, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left rim */}
      <mesh position={[-1.12, 0, 0]}>
        <torusGeometry args={[0.82, 0.068, 22, 96]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Left lens */}
      <mesh position={[-1.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={lensGeo} />
        <primitive object={lensMat} attach="material" />
      </mesh>

      {/* Right rim */}
      <mesh position={[1.12, 0, 0]}>
        <torusGeometry args={[0.82, 0.068, 22, 96]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Right lens */}
      <mesh position={[1.12, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={lensGeo} />
        <primitive object={lensMat} attach="material" />
      </mesh>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.96, 0.05, -0.04]} rotation={[0, -0.10, 0]} frameMat={frameMat} />
      <TempleArm position={[ 1.96, 0.05, -0.04]} rotation={[0,  0.10, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 2. Titanium Aviator ─────────────────────────────────────────────────────

function AviatorFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  return (
    <group>
      {/* Slim titanium top-brow bar */}
      <mesh position={[0, 0.47, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.52, 20]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Double-wire arched nose bridge */}
      <mesh position={[0, 0.16, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.24, 0.020, 12, 28, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.08, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.18, 0.014, 10, 24, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left teardrop */}
      <group position={[-1.02, -0.05, 0]}>
        <mesh geometry={leftAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftAviatorLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right teardrop */}
      <group position={[1.02, -0.05, 0]}>
        <mesh geometry={rightAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightAviatorLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.92, 0.30, -0.04]} rotation={[0, -0.12, 0]} frameMat={frameMat} />
      <TempleArm position={[ 1.92, 0.30, -0.04]} rotation={[0,  0.12, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 3. Square Browline ──────────────────────────────────────────────────────

function SquareFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  // Thick upper browbar
  const browbarGeo = useMemo(
    () =>
      new THREE.BoxGeometry(4.52, 0.20, 0.15),
    []
  );
  // Bridge
  const bridgeGeo = useMemo(
    () => new THREE.BoxGeometry(0.42, 0.10, 0.09),
    []
  );

  return (
    <group>
      {/* Upper brow bar */}
      <mesh position={[0, 0.42, 0]} geometry={browbarGeo}>
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Bridge connector */}
      <mesh position={[0, 0.17, 0]} geometry={bridgeGeo}>
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left lens assembly */}
      <group position={[-1.22, -0.09, 0]}>
        {/* Frame rim (extruded rounded rect) */}
        <mesh geometry={squareFrameGeo} position={[0, 0, -0.045]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        {/* Lens slab inset slightly */}
        <mesh geometry={squareLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right lens assembly */}
      <group position={[1.22, -0.09, 0]}>
        <mesh geometry={squareFrameGeo} position={[0, 0, -0.045]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={squareLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.18, 0.37, -0.04]} rotation={[0, -0.10, 0]} frameMat={frameMat} />
      <TempleArm position={[ 2.18, 0.37, -0.04]} rotation={[0,  0.10, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 4. Cat-Eye Luxe ─────────────────────────────────────────────────────────

function CatEyeFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  return (
    <group>
      {/* Centre decorative bridge cylinder */}
      <mesh position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.038, 0.038, 0.50, 18]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Left cat-eye */}
      <group position={[-1.22, 0.06, 0]}>
        <mesh geometry={leftCatEyeRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftCatEyeLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* Right cat-eye */}
      <group position={[1.22, 0.06, 0]}>
        <mesh geometry={rightCatEyeRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightCatEyeLensGeo} position={[0, 0, -0.010]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.18, 0.28, -0.04]} rotation={[0, -0.14, 0]} frameMat={frameMat} />
      <TempleArm position={[ 2.18, 0.28, -0.04]} rotation={[0,  0.14, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── Main Scene Model ─────────────────────────────────────────────────────────

function EyewearStudioModel({
  shape     = 'round',
  finish    = 'onyx',
  lens      = 'blue',
  targetRotationY,
  autoRotate,
  isMobile,
}: {
  shape:           FrameShape;
  finish:          FrameFinish;
  lens:            LensTint;
  targetRotationY: React.MutableRefObject<number>;
  autoRotate:      boolean;
  isMobile:        boolean;
}) {
  const groupRef     = useRef<THREE.Group>(null);
  const currentScale = useRef<number>(1.0);

  // Colour lerp targets (no allocations in useFrame)
  const frameColTarget = useRef(new THREE.Color());
  const lensColTarget  = useRef(new THREE.Color());
  const lensAttTarget  = useRef(new THREE.Color());

  // ── Create long-lived PBR materials ──────────────────────────────────────
  const [frameMaterial] = useState(() => {
    const cfg = FINISH_CONFIG.onyx;
    return new THREE.MeshPhysicalMaterial({
      color:              cfg.color,
      metalness:          cfg.metalness,
      roughness:          cfg.roughness,
      clearcoat:          cfg.clearcoat,
      clearcoatRoughness: cfg.clearcoatRoughness,
      envMapIntensity:    1.4,
    });
  });

  const [lensMaterial] = useState(() => {
    const cfg = LENS_CONFIG.blue;
    return new THREE.MeshPhysicalMaterial({
      color:               cfg.color,
      transmission:        cfg.transmission,
      ior:                 cfg.ior,
      thickness:           cfg.thickness,
      roughness:           cfg.roughness,
      clearcoat:           cfg.clearcoat,
      clearcoatRoughness:  cfg.clearcoatRoughness,
      attenuationColor:    new THREE.Color(cfg.attenuationColor),
      attenuationDistance: cfg.attenuationDistance,
      transparent:         true,
      opacity:             cfg.opacity,
      side:                THREE.FrontSide,
      envMapIntensity:     1.6,
    });
  });

  // Elastic scale pop on shape switch
  useEffect(() => { currentScale.current = 0.88; }, [shape]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle floating + breathing tilt
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.065;
    groupRef.current.rotation.z = Math.sin(t * 0.85) * 0.022;
    groupRef.current.rotation.x = Math.cos(t * 0.65) * 0.013;

    // Mobile drag / auto-spin
    if (isMobile) {
      if (autoRotate) targetRotationY.current += delta * 0.38;
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        3.8,
        delta
      );
    }

    // Scale spring
    currentScale.current = THREE.MathUtils.damp(currentScale.current, 1.0, 10, delta);
    groupRef.current.scale.setScalar(currentScale.current);

    // ── Smooth frame material transitions ────────────────────────────────
    const tf = FINISH_CONFIG[finish] ?? FINISH_CONFIG.onyx;
    frameColTarget.current.set(tf.color);
    frameMaterial.color.lerp(frameColTarget.current, delta * 7);
    frameMaterial.metalness          = THREE.MathUtils.damp(frameMaterial.metalness,          tf.metalness,          8, delta);
    frameMaterial.roughness          = THREE.MathUtils.damp(frameMaterial.roughness,          tf.roughness,          8, delta);
    frameMaterial.clearcoat          = THREE.MathUtils.damp(frameMaterial.clearcoat,          tf.clearcoat,          8, delta);
    frameMaterial.clearcoatRoughness = THREE.MathUtils.damp(frameMaterial.clearcoatRoughness, tf.clearcoatRoughness, 8, delta);
    frameMaterial.needsUpdate        = true;

    // ── Smooth lens material transitions ──────────────────────────────────
    const tl = LENS_CONFIG[lens] ?? LENS_CONFIG.blue;
    lensColTarget.current.set(tl.color);
    lensAttTarget.current.set(tl.attenuationColor);
    lensMaterial.color.lerp(lensColTarget.current, delta * 7);
    lensMaterial.attenuationColor.lerp(lensAttTarget.current, delta * 7);
    lensMaterial.transmission        = THREE.MathUtils.damp(lensMaterial.transmission,        tl.transmission,        8, delta);
    lensMaterial.ior                 = THREE.MathUtils.damp(lensMaterial.ior,                 tl.ior,                 8, delta);
    lensMaterial.thickness           = THREE.MathUtils.damp(lensMaterial.thickness,           tl.thickness,           8, delta);
    lensMaterial.roughness           = THREE.MathUtils.damp(lensMaterial.roughness,           tl.roughness,           8, delta);
    lensMaterial.clearcoat           = THREE.MathUtils.damp(lensMaterial.clearcoat,           tl.clearcoat,           8, delta);
    lensMaterial.clearcoatRoughness  = THREE.MathUtils.damp(lensMaterial.clearcoatRoughness,  tl.clearcoatRoughness,  8, delta);
    lensMaterial.attenuationDistance = THREE.MathUtils.damp(lensMaterial.attenuationDistance, tl.attenuationDistance, 8, delta);
    lensMaterial.needsUpdate         = true;
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

// ─── Canvas Root ──────────────────────────────────────────────────────────────

export default function Hero3DViewerInner({
  frameShape  = 'round',
  frameFinish = 'onyx',
  lensTint    = 'blue',
  autoRotate  = true,
  targetRotationY,
  isMobile,
}: Hero3DViewerProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      onCreated={({ gl }) => {
        // Physically correct lighting mode for accurate PBR
        // Graceful context-loss recovery
        const domElement = gl.domElement;
        if (domElement) {
          domElement.addEventListener(
            'webglcontextlost',
            (e: Event) => { e.preventDefault(); },
            false
          );
        }
      }}
      gl={{
        powerPreference:      'high-performance',
        antialias:            true,
        alpha:                true,
        preserveDrawingBuffer: false,
        stencil:              false,
        depth:                true,
        toneMapping:          THREE.ACESFilmicToneMapping,
        toneMappingExposure:  1.05,
      }}
      style={{
        width:         '100%',
        height:        '100%',
        background:    'transparent',
        pointerEvents: isMobile ? 'none' : 'auto',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6.8]} fov={32} />

      {/* ── HDR Environment (studio preset) for reflections ── */}
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={1.15}
      />

      {/* ── Commercial Studio Lighting ───────────────────────────────────── */}
      {/* Key light — warm, soft, upper-left */}
      <spotLight
        position={[4.5, 8, 5]}
        angle={0.28}
        penumbra={0.55}
        intensity={28}
        color="#fff8f2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      {/* Fill / rim — cool blue, upper-right */}
      <spotLight
        position={[-5, 5, 2]}
        angle={0.38}
        penumbra={0.70}
        intensity={12}
        color="#d6eeff"
      />
      {/* Back rim — top-center for lens edge highlight */}
      <spotLight
        position={[0, 6, -3]}
        angle={0.45}
        penumbra={0.80}
        intensity={9}
        color="#ffffff"
      />
      {/* Soft ambient fill — very low so PBR shadows stay deep */}
      <ambientLight intensity={0.22} color="#f0f4ff" />

      {/* ── 3D Eyewear Model ─────────────────────────────────────────────── */}
      <EyewearStudioModel
        shape={frameShape}
        finish={frameFinish}
        lens={lensTint}
        targetRotationY={targetRotationY}
        autoRotate={autoRotate}
        isMobile={isMobile}
      />

      {/* ── High-Resolution Contact Shadows ─────────────────────────────── */}
      <ContactShadows
        position={[0, -1.60, 0]}
        opacity={0.55}
        scale={10}
        blur={3.2}
        far={4.0}
        resolution={1024}
        color="#0a0e1a"
      />

      {/* ── Subtle Bloom for polished lens/frame highlights ──────────────── */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.72}
          luminanceSmoothing={0.30}
          intensity={0.28}
          mipmapBlur
        />
      </EffectComposer>

      {/* ── Desktop OrbitControls ─────────────────────────────────────────── */}
      {!isMobile && (
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.055}
          rotateSpeed={0.80}
          autoRotate={autoRotate}
          autoRotateSpeed={0.90}
          minPolarAngle={Math.PI / 2.4}
          maxPolarAngle={Math.PI / 1.65}
        />
      )}
    </Canvas>
  );
}
