/**
 * Face Pose Engine — Laboratory Optical AR Module
 * MediaPipe 468-point Face Mesh spatial pose extraction
 * Landmark references: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
 *
 * Outputs THREE-compatible position / quaternion / scale for frame overlay.
 */

import * as THREE from "three";

// ─── Landmark Indices ──────────────────────────────────────────────────────────

/** Nasal bridge / sellion anchor */
const LM_SELLION       = 6;
/** Nasal root (bridge midpoint) */
const LM_NASAL_ROOT    = 168;
/** Nasal tip */
const LM_NASAL_TIP     = 1;
/** Left eye outer corner */
const LM_LEFT_EYE      = 33;
/** Right eye outer corner */
const LM_RIGHT_EYE     = 263;
/** Left zygomatic temple */
const LM_LEFT_TEMPLE   = 127;
/** Right zygomatic temple */
const LM_RIGHT_TEMPLE  = 356;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacePose {
  /** 3D world position anchored at nasal bridge */
  position: THREE.Vector3;
  /** Head orientation quaternion (yaw, pitch, roll) */
  quaternion: THREE.Quaternion;
  /** Uniform scale derived from inter-pupillary / zygomatic distance */
  scale: number;
  /** Whether the face is detected */
  detected: boolean;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// ─── Smoothing ────────────────────────────────────────────────────────────────

const ALPHA = 0.70; // EMA smoothing coefficient (0 = lag, 1 = raw)

let smoothPos  = new THREE.Vector3();
let smoothQuat = new THREE.Quaternion();
let smoothScale = 1;
let firstFrame  = true;

function emaVec3(current: THREE.Vector3, target: THREE.Vector3): THREE.Vector3 {
  return current.lerp(target, ALPHA);
}

function emaQuat(current: THREE.Quaternion, target: THREE.Quaternion): THREE.Quaternion {
  return current.slerp(target, ALPHA);
}

// ─── Core Pose Extraction ─────────────────────────────────────────────────────

/**
 * Transforms a normalized MediaPipe landmark into a Three.js Vector3.
 * Converts from image-space [0,1] to a centered [-0.5, 0.5] NDC space,
 * then scales to approximate head-size world units.
 */
function toVec3(lm: NormalizedLandmark, width: number, height: number): THREE.Vector3 {
  return new THREE.Vector3(
    (0.5 - lm.x) * width,      // Flip X (mirrored camera)
    (0.5 - lm.y) * height,     // Flip Y (NDC)
    -lm.z * width              // Depth
  );
}

/**
 * Extracts a FacePose from a single MediaPipe Face Mesh result.
 * Applies Exponential Moving Average smoothing for stable 60FPS rendering.
 */
export function extractFacePose(
  landmarks: NormalizedLandmark[],
  videoWidth: number,
  videoHeight: number
): FacePose {
  if (!landmarks || landmarks.length < 468) {
    return {
      position: smoothPos.clone(),
      quaternion: smoothQuat.clone(),
      scale: smoothScale,
      detected: false,
    };
  }

  const W = videoWidth;
  const H = videoHeight;

  // Anchor point: nasal bridge / sellion
  const sellion    = toVec3(landmarks[LM_SELLION],    W, H);
  const nasalRoot  = toVec3(landmarks[LM_NASAL_ROOT], W, H);
  const anchor     = sellion.clone().lerp(nasalRoot, 0.5);

  // Eye line vector (basis X)
  const leftEye    = toVec3(landmarks[LM_LEFT_EYE],  W, H);
  const rightEye   = toVec3(landmarks[LM_RIGHT_EYE], W, H);
  const eyeVec     = leftEye.clone().sub(rightEye).normalize();

  // Nose down vector (basis Y estimate)
  const nasalTip   = toVec3(landmarks[LM_NASAL_TIP], W, H);
  const noseVec    = nasalTip.clone().sub(nasalRoot).normalize();

  // Face normal (basis Z) via cross product
  const faceNormal = eyeVec.clone().cross(noseVec).normalize();

  // Orthonormal frame
  const basisX = eyeVec;
  const basisZ = faceNormal;
  const basisY = basisZ.clone().cross(basisX).normalize();

  // Build rotation matrix and quaternion
  const rotMat = new THREE.Matrix4().makeBasis(basisX, basisY, basisZ);
  const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

  // Scale from zygomatic temple span
  const leftTemple  = toVec3(landmarks[LM_LEFT_TEMPLE],  W, H);
  const rightTemple = toVec3(landmarks[LM_RIGHT_TEMPLE], W, H);
  const templeSpan  = leftTemple.distanceTo(rightTemple);

  // Normalize: typical zygomatic span is ~140mm face width
  const targetScale = templeSpan / 140;

  // EMA Smoothing
  if (firstFrame) {
    smoothPos.copy(anchor);
    smoothQuat.copy(targetQuat);
    smoothScale = targetScale;
    firstFrame = false;
  } else {
    emaVec3(smoothPos, anchor);
    emaQuat(smoothQuat, targetQuat);
    smoothScale = smoothScale + ALPHA * (targetScale - smoothScale);
  }

  return {
    position: smoothPos.clone(),
    quaternion: smoothQuat.clone(),
    scale: smoothScale,
    detected: true,
  };
}

/** Resets EMA state (call when camera is stopped/restarted) */
export function resetPoseSmoothing(): void {
  smoothPos   = new THREE.Vector3();
  smoothQuat  = new THREE.Quaternion();
  smoothScale = 1;
  firstFrame  = true;
}
