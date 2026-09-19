'use client';

import React, { useEffect, useRef, useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

export type FrameShape = 'round' | 'aviator' | 'square' | 'cateye';
export type FrameFinish = 'onyx' | 'gold' | 'silver' | 'rosegold';
export type LensTint = 'blue' | 'amber' | 'emerald' | 'clear';

export interface ViewerExportAPI {
  takeSnapshot: () => Promise<string | null>;
  startRecording: (durationMs?: number) => Promise<Blob | null>;
  stopRecording: () => void;
}

export interface Hero3DViewerProps {
  frameShape?: FrameShape;
  frameFinish?: FrameFinish;
  lensTint?: LensTint;
  autoRotate?: boolean;
  targetRotationY: React.MutableRefObject<number>;
  isMobile: boolean;
  onExportReady?: (api: ViewerExportAPI) => void;
}

// ─── PBR Material Specifications ──────────────────────────────────────────

const FINISH_MATERIALS: Record<
  FrameFinish,
  { color: string; metalness: number; roughness: number; clearcoat?: number }
> = {
  onyx: { color: '#111317', metalness: 0.88, roughness: 0.18, clearcoat: 0.6 },
  gold: { color: '#d4af37', metalness: 0.96, roughness: 0.14, clearcoat: 0.9 },
  silver: { color: '#e2e8f0', metalness: 0.98, roughness: 0.08, clearcoat: 0.95 },
  rosegold: { color: '#f43f5e', metalness: 0.92, roughness: 0.16, clearcoat: 0.85 },
};

const LENS_MATERIALS: Record<
  LensTint,
  { color: string; transmission: number; opacity: number; roughness: number; ior: number }
> = {
  blue: { color: '#38bdf8', transmission: 0.88, opacity: 0.65, roughness: 0.03, ior: 1.54 },
  amber: { color: '#f59e0b', transmission: 0.82, opacity: 0.78, roughness: 0.04, ior: 1.52 },
  emerald: { color: '#10b981', transmission: 0.84, opacity: 0.70, roughness: 0.03, ior: 1.53 },
  clear: { color: '#f0f9ff', transmission: 0.96, opacity: 0.25, roughness: 0.01, ior: 1.50 },
};

// ─── Sub-Components: NosePads & TempleArms ─────────────────────────────────

function NosePads({ frameMat }: { frameMat: THREE.Material }) {
  const padMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f8fafc',
        transmission: 0.92,
        roughness: 0.08,
        transparent: true,
        opacity: 0.85,
        ior: 1.48,
      }),
    []
  );

  useEffect(() => {
    return () => {
      padMat.dispose();
    };
  }, [padMat]);

  return (
    <group>
      <mesh position={[-0.32, -0.22, 0.12]} rotation={[0.2, 0.3, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[-0.35, -0.28, 0.16]} rotation={[0.2, 0.4, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.08]} />
        <primitive object={padMat} attach="material" />
      </mesh>
      <mesh position={[0.32, -0.22, 0.12]} rotation={[0.2, -0.3, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 12]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0.35, -0.28, 0.16]} rotation={[0.2, -0.4, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.08]} />
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
  frameMat: THREE.Material;
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

// ─── 1. Classic Round Frame ──────────────────────────────────────────────────

function RoundFrame({ frameMat, lensMat }: { frameMat: THREE.Material; lensMat: THREE.Material }) {
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

// ─── 2. Titanium Aviator Frame ───────────────────────────────────────────────

function createTeardropLensShape(isLeft: boolean) {
  const shape = new THREE.Shape();
  const s = isLeft ? 1 : -1;
  shape.moveTo(0.52 * s, 0.45);
  shape.bezierCurveTo(0.15 * s, 0.48, -0.55 * s, 0.43, -0.76 * s, 0.32);
  shape.bezierCurveTo(-0.95 * s, 0.18, -0.92 * s, -0.28, -0.68 * s, -0.68);
  shape.bezierCurveTo(-0.48 * s, -0.92, -0.05 * s, -0.95, 0.20 * s, -0.80);
  shape.bezierCurveTo(0.52 * s, -0.62, 0.64 * s, -0.15, 0.58 * s, 0.18);
  shape.bezierCurveTo(0.56 * s, 0.34, 0.54 * s, 0.41, 0.52 * s, 0.45);
  return shape;
}

function AviatorFrame({ frameMat, lensMat }: { frameMat: THREE.Material; lensMat: THREE.Material }) {
  const { leftRim, rightRim, leftLens, rightLens } = useMemo(() => {
    const leftShape = createTeardropLensShape(true);
    const rightShape = createTeardropLensShape(false);

    const makeRim = (sh: THREE.Shape) => {
      const pts3d = sh.getPoints(54).map((p) => new THREE.Vector3(p.x, p.y, 0));
      const curve = new THREE.CatmullRomCurve3(pts3d, true);
      return new THREE.TubeGeometry(curve, 64, 0.022, 12, true);
    };

    const makeLens = (sh: THREE.Shape) => {
      return new THREE.ExtrudeGeometry(sh, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2,
      });
    };

    return {
      leftRim: makeRim(leftShape),
      rightRim: makeRim(rightShape),
      leftLens: makeLens(leftShape),
      rightLens: makeLens(rightShape),
    };
  }, []);

  useEffect(() => {
    return () => {
      leftRim.dispose();
      rightRim.dispose();
      leftLens.dispose();
      rightLens.dispose();
    };
  }, [leftRim, rightRim, leftLens, rightLens]);

  return (
    <group>
      <mesh position={[0, 0.43, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.45, 16]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.26, 0.022, 12, 24, Math.PI]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <group position={[-1.02, -0.04, 0]}>
        <mesh geometry={leftRim}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={leftLens} position={[0, 0, -0.011]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>
      <group position={[1.02, -0.04, 0]}>
        <mesh geometry={rightRim}>
          <primitive object={frameMat} attach="material" />
        </mesh>
        <mesh geometry={rightLens} position={[0, 0, -0.011]}>
          <primitive object={lensMat} attach="material" />
        </mesh>
      </group>
      <NosePads frameMat={frameMat} />
      <TempleArm position={[-1.94, 0.28, -0.05]} rotation={[0, -0.12, 0]} frameMat={frameMat} />
      <TempleArm position={[1.94, 0.28, -0.05]} rotation={[0, 0.12, 0]} frameMat={frameMat} />
    </group>
  );
}

// ─── 3. Square Browline Frame ────────────────────────────────────────────────

function SquareFrame({ frameMat, lensMat }: { frameMat: THREE.Material; lensMat: THREE.Material }) {
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

// ─── 4. Cat-Eye Luxe Frame ───────────────────────────────────────────────────

function CatEyeFrame({ frameMat, lensMat }: { frameMat: THREE.Material; lensMat: THREE.Material }) {
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

// ─── Studio Eyewear Model Controller ─────────────────────────────────────────

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
  const lensColorTarget = useRef(new THREE.Color());

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: FINISH_MATERIALS.onyx.color,
        metalness: FINISH_MATERIALS.onyx.metalness,
        roughness: FINISH_MATERIALS.onyx.roughness,
      }),
    []
  );

  const lensMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: LENS_MATERIALS.blue.color,
        transmission: LENS_MATERIALS.blue.transmission,
        opacity: LENS_MATERIALS.blue.opacity,
        roughness: LENS_MATERIALS.blue.roughness,
        transparent: true,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.52,
      }),
    []
  );

  useEffect(() => {
    return () => {
      frameMaterial.dispose();
      lensMaterial.dispose();
    };
  }, [frameMaterial, lensMaterial]);

  useEffect(() => {
    currentScale.current = 0.92;
  }, [shape]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating breathing effect
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.06;
    groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.02;
    groupRef.current.rotation.x = Math.cos(t * 0.7) * 0.015;

    if (isMobile) {
      if (autoRotate) {
        targetRotationY.current += delta * 0.4;
      }
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        4.0,
        delta
      );
    }

    currentScale.current = THREE.MathUtils.damp(currentScale.current, 1.0, 10, delta);
    groupRef.current.scale.setScalar(currentScale.current);

    const tf = FINISH_MATERIALS[finish] || FINISH_MATERIALS.onyx;
    const tl = LENS_MATERIALS[lens] || LENS_MATERIALS.blue;

    frameColorTarget.current.set(tf.color);
    frameMaterial.color.lerp(frameColorTarget.current, delta * 8);
    frameMaterial.metalness = THREE.MathUtils.damp(frameMaterial.metalness, tf.metalness, 8, delta);
    frameMaterial.roughness = THREE.MathUtils.damp(frameMaterial.roughness, tf.roughness, 8, delta);

    lensColorTarget.current.set(tl.color);
    lensMaterial.color.lerp(lensColorTarget.current, delta * 8);
    lensMaterial.transmission = THREE.MathUtils.damp(lensMaterial.transmission, tl.transmission, 8, delta);
    lensMaterial.opacity = THREE.MathUtils.damp(lensMaterial.opacity, tl.opacity, 8, delta);
    lensMaterial.ior = THREE.MathUtils.damp(lensMaterial.ior, tl.ior, 8, delta);
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

// ─── Export Controller (Snapshots & MediaRecorder) ───────────────────────────

function ExportBridge({ onExportReady }: { onExportReady?: (api: ViewerExportAPI) => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!onExportReady) return;

    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];

    const api: ViewerExportAPI = {
      takeSnapshot: async () => {
        try {
          gl.render(scene, camera);
          return gl.domElement.toDataURL('image/png', 1.0);
        } catch (err) {
          console.error('[3D Viewer] Snapshot capture failed:', err);
          return null;
        }
      },
      startRecording: (durationMs = 4000) => {
        return new Promise<Blob | null>((resolve) => {
          try {
            const canvas = gl.domElement;
            const stream = (canvas as any).captureStream
              ? canvas.captureStream(60)
              : (canvas as any).mozCaptureStream
              ? (canvas as any).mozCaptureStream(60)
              : null;

            if (!stream) {
              console.warn('[3D Viewer] Canvas captureStream unsupported on this device.');
              resolve(null);
              return;
            }

            const candidates = [
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
              'video/mp4',
            ];
            const supportedMime =
              candidates.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ||
              'video/webm';

            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, {
              mimeType: supportedMime,
              videoBitsPerSecond: 6000000, // 6 Mbps high-fidelity WebM
            });

            mediaRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                recordedChunks.push(e.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: supportedMime });
              resolve(blob);
            };

            mediaRecorder.start(100);

            if (durationMs > 0) {
              setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                }
              }, durationMs);
            }
          } catch (err) {
            console.error('[3D Viewer] MediaRecorder init failed:', err);
            resolve(null);
          }
        });
      },
      stopRecording: () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      },
    };

    onExportReady(api);
  }, [gl, scene, camera, onExportReady]);

  return null;
}

// ─── WebGL Graceful Error Boundary ──────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[3D Viewer WebGL Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 p-6 text-center rounded-2xl border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Hardware Acceleration Notice
            </span>
            <p className="text-sm font-semibold text-slate-700">WebGL context unavailable.</p>
            <p className="text-xs text-slate-400 mt-1">Please enable hardware acceleration in your browser settings.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ─── Production 3D Canvas Scene ──────────────────────────────────────────────

export default function Hero3DViewerInner({
  frameShape = 'round',
  frameFinish = 'onyx',
  lensTint = 'blue',
  autoRotate = true,
  targetRotationY,
  isMobile,
  onExportReady,
}: Hero3DViewerProps) {
  return (
    <WebGLErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            console.warn('[3D Viewer] WebGL context lost handled gracefully.');
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
          preserveDrawingBuffer: true,
          stencil: false,
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          pointerEvents: isMobile ? 'none' : 'auto',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6.6]} fov={34} />

        {/* Studio Lighting & HDR Environment Reflections */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 5, -4]} intensity={0.8} />
        <pointLight position={[0, 4, 3]} intensity={0.6} color="#ffffff" />
        <Environment preset="city" />

        {/* 3D Model Instance */}
        <EyewearStudioModel
          shape={frameShape}
          finish={frameFinish}
          lens={lensTint}
          targetRotationY={targetRotationY}
          autoRotate={autoRotate}
          isMobile={isMobile}
        />

        {/* Soft Floor Shadow */}
        <ContactShadows
          position={[0, -1.52, 0]}
          opacity={0.35}
          scale={9.0}
          blur={2.2}
          far={4}
          resolution={512}
          color="#090d16"
        />

        {/* Camera Controls for Desktop */}
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

        {/* Export & Stream Bridge */}
        <ExportBridge onExportReady={onExportReady} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
