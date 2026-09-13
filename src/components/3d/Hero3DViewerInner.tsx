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

const FINISH_CONFIG: Record<
  FrameFinish,
  {
    color:             string;
    metalness:         number;
    roughness:         number;
    clearcoat:         number;
    clearcoatRoughness:number;
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
  },
};

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

// ─── Shared extrude options ────────────────────────────────────────────────────

const RIM_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth:          0.085,
  bevelEnabled:   true,
  bevelThickness: 0.014,
  bevelSize:      0.012,
  bevelSegments:  4,
};

const LENS_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth:          0.055,
  bevelEnabled:   true,
  bevelThickness: 0.008,
  bevelSize:      0.006,
  bevelSegments:  3,
};

// ─── Helper: build a TubeGeometry rim from a closed 2-D shape ─────────────────

function tubeRimFromShape(
  shape: THREE.Shape,
  tubularSegments = 96,
  tubeRadius      = 0.028,
  radialSegments  = 12
): THREE.TubeGeometry {
  const pts2d = shape.getPoints(80);
  const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve  = new THREE.CatmullRomCurve3(pts3d, true);
  return new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, true);
}

// ─── Helper: rounded-rectangle shape ─────────────────────────────────────────

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2, hh = h / 2;
  const s  = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo( hw - r, -hh);
  s.quadraticCurveTo( hw, -hh,  hw, -hh + r);
  s.lineTo( hw,  hh - r);
  s.quadraticCurveTo( hw,  hh,  hw - r,  hh);
  s.lineTo(-hw + r,  hh);
  s.quadraticCurveTo(-hw,  hh, -hw,  hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOMETRY — lazy singleton, initialised on first WebGL render (browser only).
// Keeping construction out of module scope prevents Next.js / webpack from
// statically analysing or minifying large Three.js call-chains at build time,
// which was causing the Node.js OOM during production compilation.
// ═══════════════════════════════════════════════════════════════════════════════

function buildAviatorShape(isLeft: boolean): THREE.Shape {
  const s = isLeft ? 1 : -1;
  const sh = new THREE.Shape();
  sh.moveTo(0.46 * s, 0.54);
  sh.bezierCurveTo( 0.12 * s,  0.60, -0.50 * s,  0.58, -0.88 * s,  0.40);
  sh.bezierCurveTo(-1.08 * s,  0.20, -1.06 * s, -0.28, -0.78 * s, -0.68);
  sh.bezierCurveTo(-0.52 * s, -0.92, -0.04 * s, -0.96,  0.20 * s, -0.78);
  sh.bezierCurveTo( 0.50 * s, -0.58,  0.60 * s, -0.12,  0.55 * s,  0.22);
  sh.bezierCurveTo( 0.52 * s,  0.38,  0.48 * s,  0.48,  0.46 * s,  0.54);
  return sh;
}

function buildBrowShape(): THREE.Shape {
  const sh = new THREE.Shape();
  const hw = 0.80, top = 0.58, bot = 0.10, r = 0.10;
  sh.moveTo(-hw + r, bot);
  sh.bezierCurveTo(-hw * 0.6, -0.02, hw * 0.6, -0.02, hw - r, bot);
  sh.quadraticCurveTo(hw, bot, hw, bot + r);
  sh.lineTo(hw, top - r);
  sh.quadraticCurveTo(hw, top, hw - r, top);
  sh.lineTo(-hw + r, top);
  sh.quadraticCurveTo(-hw, top, -hw, top - r);
  sh.lineTo(-hw, bot + r);
  sh.quadraticCurveTo(-hw, bot, -hw + r, bot);
  return sh;
}

function buildBrowlineWireShape(): THREE.Shape {
  const sh = new THREE.Shape();
  const hw = 0.72, ty = 0.10;
  sh.moveTo(-hw, ty);
  sh.bezierCurveTo(-hw, -0.24, -hw, -0.58, 0, -0.66);
  sh.bezierCurveTo( hw, -0.58,  hw, -0.24, hw, ty);
  sh.lineTo(-hw, ty);
  return sh;
}

function buildCatEyeShape(isLeft: boolean): THREE.Shape {
  const s = isLeft ? 1 : -1;
  const sh = new THREE.Shape();
  sh.moveTo( 0.42 * s, -0.35);
  sh.bezierCurveTo( 0.14 * s, -0.58, -0.44 * s, -0.62, -0.72 * s, -0.44);
  sh.bezierCurveTo(-0.96 * s, -0.24, -1.00 * s,  0.02, -0.94 * s,  0.28);
  sh.bezierCurveTo(-0.86 * s,  0.52, -0.70 * s,  0.82, -0.50 * s,  0.96);
  sh.bezierCurveTo(-0.24 * s,  0.72,  0.08 * s,  0.52,  0.30 * s,  0.40);
  sh.bezierCurveTo( 0.50 * s,  0.28,  0.56 * s,  0.04,  0.54 * s, -0.12);
  sh.bezierCurveTo( 0.52 * s, -0.22,  0.46 * s, -0.30,  0.42 * s, -0.35);
  return sh;
}

// Lazy singleton cache — populated on first render, never at module-eval time
let _geo: {
  leftAviatorRim:   THREE.TubeGeometry;
  rightAviatorRim:  THREE.TubeGeometry;
  leftAviatorLens:  THREE.BufferGeometry;
  rightAviatorLens: THREE.BufferGeometry;
  brow:             THREE.BufferGeometry;
  squareLens:       THREE.BufferGeometry;
  browlineWire:     THREE.TubeGeometry;
  leftCatEyeRim:    THREE.TubeGeometry;
  rightCatEyeRim:   THREE.TubeGeometry;
  leftCatEyeLens:   THREE.BufferGeometry;
  rightCatEyeLens:  THREE.BufferGeometry;
} | null = null;

function getGeo() {
  if (_geo) return _geo;

  const leftAv  = buildAviatorShape(true);
  const rightAv = buildAviatorShape(false);
  const leftCE  = buildCatEyeShape(true);
  const rightCE = buildCatEyeShape(false);
  const brow    = buildBrowShape();
  const wire    = buildBrowlineWireShape();
  const sqLens  = roundedRect(1.44, 1.06, 0.08);

  _geo = {
    leftAviatorRim:   tubeRimFromShape(leftAv,   96, 0.026, 12),
    rightAviatorRim:  tubeRimFromShape(rightAv,  96, 0.026, 12),
    leftAviatorLens:  new THREE.ExtrudeGeometry(leftAv,  LENS_EXTRUDE),
    rightAviatorLens: new THREE.ExtrudeGeometry(rightAv, LENS_EXTRUDE),
    brow: new THREE.ExtrudeGeometry(brow, {
      depth: 0.13, bevelEnabled: true,
      bevelThickness: 0.018, bevelSize: 0.014, bevelSegments: 5,
    }),
    squareLens:      new THREE.ExtrudeGeometry(sqLens, LENS_EXTRUDE),
    browlineWire:    tubeRimFromShape(wire, 64, 0.014, 8),
    leftCatEyeRim:   tubeRimFromShape(leftCE,  88, 0.030, 12),
    rightCatEyeRim:  tubeRimFromShape(rightCE, 88, 0.030, 12),
    leftCatEyeLens:  new THREE.ExtrudeGeometry(leftCE,  LENS_EXTRUDE),
    rightCatEyeLens: new THREE.ExtrudeGeometry(rightCE, LENS_EXTRUDE),
  };
  return _geo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function NosePads({ frameMat }: { frameMat: THREE.MeshPhysicalMaterial }) {
  const padMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color:        '#e8edf2',
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
      <mesh position={[-0.30, -0.24, 0.08]} rotation={[0.15, 0.35, -0.18]}>
        <cylinderGeometry args={[0.018, 0.018, 0.20, 14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-0.34, -0.32, 0.14]} rotation={[0.25, 0.42, 0.0]}>
        <boxGeometry args={[0.038, 0.13, 0.06]} />
        <primitive object={padMat} attach="material" />
      </mesh>
      <mesh position={[0.30, -0.24, 0.08]} rotation={[0.15, -0.35, 0.18]}>
        <cylinderGeometry args={[0.018, 0.018, 0.20, 14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0.34, -0.32, 0.14]} rotation={[0.25, -0.42, 0.0]}>
        <boxGeometry args={[0.038, 0.13, 0.06]} />
        <primitive object={padMat} attach="material" />
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
  frameMat: THREE.MeshPhysicalMaterial;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Hinge block */}
      <mesh>
        <boxGeometry args={[0.10, 0.13, 0.09]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Hinge screw */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.11, 10]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Arm shaft */}
      <mesh position={[0, 0, -1.15]}>
        <boxGeometry args={[0.055, 0.070, 2.30]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Ear-hook tip */}
      <mesh position={[0, -0.18, -2.32]} rotation={[0.42, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.012, 0.38, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRAME COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Classic Round ─────────────────────────────────────────────────────────
//   Two perfect circular torus eye wires + keyhole bridge (arch + nose pads)

function RoundFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  const LENS_R   = 0.80;   // eye-wire circle radius
  const LENS_CX  = 1.10;   // horizontal centre of each lens
  const RIM_TUBE = 0.066;  // rim cross-section radius

  const lensGeo = useMemo(
    () => new THREE.CylinderGeometry(LENS_R - 0.01, LENS_R - 0.01, 0.052, 80, 1, false),
    []
  );

  // Keyhole bridge geometry: a narrow arch bar + two diagonal pad arms
  // Bridge inner gap = LENS_CX - LENS_R = 0.30 per side → bridge spans ±0.30
  const BRIDGE_R  = 0.30;
  const BRIDGE_TH = 0.024;

  return (
    <group>
      {/* ── Left eye wire ── */}
      <mesh position={[-LENS_CX, 0, 0]}>
        <torusGeometry args={[LENS_R, RIM_TUBE, 22, 96]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Left lens */}
      <mesh position={[-LENS_CX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={lensGeo} />
        <primitive object={lensMat} attach="material" />
      </mesh>

      {/* ── Right eye wire ── */}
      <mesh position={[LENS_CX, 0, 0]}>
        <torusGeometry args={[LENS_R, RIM_TUBE, 22, 96]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* Right lens */}
      <mesh position={[LENS_CX, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={lensGeo} />
        <primitive object={lensMat} attach="material" />
      </mesh>

      {/* ── Keyhole bridge ──
           The arch rises above the nose, opening downward — classic keyhole.
           rotation [0,0,π/2] makes the torus face forward as a half-circle. */}
      <mesh position={[0, 0.04, 0.01]} rotation={[Math.PI, 0, Math.PI / 2]}>
        <torusGeometry args={[BRIDGE_R, BRIDGE_TH, 12, 32, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* Bridge diagonal arms connecting rim to arch */}
      <mesh position={[-0.22, -0.06, 0.01]} rotation={[0, 0,  0.55]}>
        <cylinderGeometry args={[BRIDGE_TH * 0.7, BRIDGE_TH * 0.7, 0.24, 10]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0.22, -0.06, 0.01]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[BRIDGE_TH * 0.7, BRIDGE_TH * 0.7, 0.24, 10]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.96, 0.04, -0.04]} rotation={[0, -0.10, 0]} frameMat={frameMat} />
      <TempleArm position={[ 1.96, 0.04, -0.04]} rotation={[0,  0.10, 0]} frameMat={frameMat} />
    </group>
  );
}

// ── 2. Titanium Aviator ────────────────────────────────────────────────────────
//   Straight horizontal top brow bar + slim single lower bridge + teardrop lenses

function AviatorFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  // The teardrop centroid is offset so the top sits near y=0.50
  // Lenses are positioned so their top edge aligns with the brow bar
  return (
    <group>
      {/* ── Straight top brow bar (hallmark of the aviator style) ── */}
      <mesh position={[0, 0.54, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 2.10, 18]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ── Slim lower nose bridge (single wire arch, not double) ── */}
      <mesh position={[0, 0.18, 0.01]} rotation={[Math.PI, 0, Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.016, 10, 24, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ── Left teardrop ── */}
      <group position={[-1.06, -0.02, 0]}>
        <mesh geometry={leftAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftAviatorLensGeo} position={[0, 0, -0.008]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* ── Right teardrop ── */}
      <group position={[1.06, -0.02, 0]}>
        <mesh geometry={rightAviatorRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightAviatorLensGeo} position={[0, 0, -0.008]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.96, 0.34, -0.04]} rotation={[0, -0.12, 0]} frameMat={frameMat} />
      <TempleArm position={[ 1.96, 0.34, -0.04]} rotation={[0,  0.12, 0]} frameMat={frameMat} />
    </group>
  );
}

// ── 3. Square Browline ────────────────────────────────────────────────────────
//   THICK acetate brow on the upper half (per lens) + THIN wire bottom rim

function SquareFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  const LCX = 1.18; // lens centre x

  return (
    <group>
      {/* ── Bridge between the two brows ── */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.50, 0.14, 0.12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ── Left lens assembly ── */}
      <group position={[-LCX, 0, 0]}>
        {/* Thick upper acetate brow — extruded crescent */}
        <mesh geometry={browGeo} position={[0, 0.06, -0.065]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        {/* Thin bottom wire rim — traces the lower half perimeter */}
        <mesh geometry={browlineWireGeo} position={[0, -0.16, 0]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        {/* Lens slab */}
        <mesh geometry={squareLensGeo} position={[0, -0.06, -0.006]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* ── Right lens assembly ── */}
      <group position={[LCX, 0, 0]}>
        <mesh geometry={browGeo} position={[0, 0.06, -0.065]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={browlineWireGeo} position={[0, -0.16, 0]}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={squareLensGeo} position={[0, -0.06, -0.006]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.04, 0.38, -0.04]} rotation={[0, -0.10, 0]} frameMat={frameMat} />
      <TempleArm position={[ 2.04, 0.38, -0.04]} rotation={[0,  0.10, 0]} frameMat={frameMat} />
    </group>
  );
}

// ── 4. Cat-Eye Luxe ────────────────────────────────────────────────────────────
//   Sharp upswept outer corners + slim bridge

function CatEyeFrame({
  frameMat,
  lensMat,
}: {
  frameMat: THREE.MeshPhysicalMaterial;
  lensMat:  THREE.MeshPhysicalMaterial;
}) {
  return (
    <group>
      {/* ── Slim horizontal bridge ── */}
      <mesh position={[0, 0.20, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.52, 14]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* ── Left cat-eye ── */}
      <group position={[-1.18, 0.04, 0]}>
        <mesh geometry={leftCatEyeRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftCatEyeLensGeo} position={[0, 0, -0.008]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      {/* ── Right cat-eye ── */}
      <group position={[1.18, 0.04, 0]}>
        <mesh geometry={rightCatEyeRimGeo}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightCatEyeLensGeo} position={[0, 0, -0.008]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>

      <NosePads frameMat={frameMat} />
      <TempleArm position={[-2.14, 0.32, -0.04]} rotation={[0, -0.14, 0]} frameMat={frameMat} />
      <TempleArm position={[ 2.14, 0.32, -0.04]} rotation={[0,  0.14, 0]} frameMat={frameMat} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCENE MODEL
// ═══════════════════════════════════════════════════════════════════════════════

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

  const frameColTarget = useRef(new THREE.Color());
  const lensColTarget  = useRef(new THREE.Color());
  const lensAttTarget  = useRef(new THREE.Color());

  const [frameMaterial] = useState(() => {
    const cfg = FINISH_CONFIG.onyx;
    return new THREE.MeshPhysicalMaterial({
      color:              cfg.color,
      metalness:          cfg.metalness,
      roughness:          cfg.roughness,
      clearcoat:          cfg.clearcoat,
      clearcoatRoughness: cfg.clearcoatRoughness,
      envMapIntensity:    1.0,
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
      envMapIntensity:     1.2,
    });
  });

  useEffect(() => { currentScale.current = 0.88; }, [shape]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.position.y = Math.sin(t * 1.5) * 0.055;
    groupRef.current.rotation.z = Math.sin(t * 0.85) * 0.018;
    groupRef.current.rotation.x = Math.cos(t * 0.65) * 0.010;

    if (isMobile) {
      if (autoRotate) targetRotationY.current += delta * 0.38;
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        3.8,
        delta
      );
    }

    currentScale.current = THREE.MathUtils.damp(currentScale.current, 1.0, 10, delta);
    groupRef.current.scale.setScalar(currentScale.current);

    // Frame material smooth transition
    const tf = FINISH_CONFIG[finish] ?? FINISH_CONFIG.onyx;
    frameColTarget.current.set(tf.color);
    frameMaterial.color.lerp(frameColTarget.current, delta * 7);
    frameMaterial.metalness          = THREE.MathUtils.damp(frameMaterial.metalness,          tf.metalness,          8, delta);
    frameMaterial.roughness          = THREE.MathUtils.damp(frameMaterial.roughness,          tf.roughness,          8, delta);
    frameMaterial.clearcoat          = THREE.MathUtils.damp(frameMaterial.clearcoat,          tf.clearcoat,          8, delta);
    frameMaterial.clearcoatRoughness = THREE.MathUtils.damp(frameMaterial.clearcoatRoughness, tf.clearcoatRoughness, 8, delta);
    frameMaterial.needsUpdate        = true;

    // Lens material smooth transition
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

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS ROOT
// ═══════════════════════════════════════════════════════════════════════════════

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
        powerPreference:       'high-performance',
        antialias:             true,
        alpha:                 true,
        preserveDrawingBuffer: false,
        stencil:               false,
        depth:                 true,
        toneMapping:           THREE.ACESFilmicToneMapping,
        // ↓ Reduced from 1.05 — prevents blown-out whites on metal/glass
        toneMappingExposure:   0.72,
      }}
      style={{
        width:         '100%',
        height:        '100%',
        background:    'transparent',
        pointerEvents: isMobile ? 'none' : 'auto',
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 6.8]} fov={32} />

      {/* HDR environment — reduced intensity so it fills without washing out */}
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={0.65}
      />

      {/*
        ── Studio Lighting — dialled back for crisp, natural accents ──
        SpotLight intensities are in candela with physical lighting.
        Key: warm upper-left  │  Fill: cool upper-right  │  Rim: back-centre
      */}
      <spotLight
        position={[4.5, 7, 5]}
        angle={0.30}
        penumbra={0.60}
        intensity={5.5}
        color="#fff9f4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      <spotLight
        position={[-5, 4.5, 2]}
        angle={0.40}
        penumbra={0.72}
        intensity={2.2}
        color="#daeeff"
      />
      <spotLight
        position={[0, 5.5, -3]}
        angle={0.50}
        penumbra={0.85}
        intensity={1.6}
        color="#ffffff"
      />
      {/* Very soft ambient — keeps shadow areas readable without flattening */}
      <ambientLight intensity={0.18} color="#f2f4ff" />

      <EyewearStudioModel
        shape={frameShape}
        finish={frameFinish}
        lens={lensTint}
        targetRotationY={targetRotationY}
        autoRotate={autoRotate}
        isMobile={isMobile}
      />

      <ContactShadows
        position={[0, -1.60, 0]}
        opacity={0.45}
        scale={10}
        blur={3.0}
        far={4.0}
        resolution={1024}
        color="#080c18"
      />

      {/* Bloom: very conservative — only the brightest specular highlights glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.85}
          luminanceSmoothing={0.20}
          intensity={0.18}
          mipmapBlur
        />
      </EffectComposer>

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
