/**
 * Face Pose Engine — Laboratory Optical AR Module
 * MediaPipe 468-point Face Mesh spatial pose extraction & eye-bridge alignment.
 * Landmark references: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
 *
 * Outputs THREE-compatible position / quaternion / scale for frame overlay.
 */

import * as THREE from "three";

// ─── Landmark Indices ──────────────────────────────────────────────────────────

/** Nasal bridge / sellion center (Datum) */
export const LM_SELLION       = 6;
/** Nasal root (bridge midpoint) */
export const LM_NASAL_ROOT    = 168;
/** Nasal tip */
export const LM_NASAL_TIP     = 1;
/** Left eye outer corner */
export const LM_LEFT_EYE      = 33;
/** Right eye outer corner */
export const LM_RIGHT_EYE     = 263;
/** Left zygomatic temple */
export const LM_LEFT_TEMPLE   = 127;
/** Right zygomatic temple */
export const LM_RIGHT_TEMPLE  = 356;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacePose {
  /** 3D world position anchored at nasal bridge */
  position: THREE.Vector3;
  /** Head orientation quaternion (yaw, pitch, roll) */
  quaternion: THREE.Quaternion;
  /** Calibrated frame width based on eye-span (W_frame = ||P263 - P33|| * 1.40) */
  frameWidth: number;
  /** Normalized scale factor */
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

let smoothPos   = new THREE.Vector3();
let smoothQuat  = new THREE.Quaternion();
let smoothWidth = 140;
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
 * Converts from image-space [0,1] to a centered coordinate space,
 * with X flipped for the mirrored webcam feed.
 */
function toVec3(lm: NormalizedLandmark, width: number, height: number): THREE.Vector3 {
  return new THREE.Vector3(
    (0.5 - lm.x) * width,      // Flip X (mirrored camera)
    (0.5 - lm.y) * height,     // Flip Y
    -lm.z * width              // Depth
  );
}

/**
 * Extracts a calibrated FacePose from a single MediaPipe Face Mesh result.
 * Anchors directly to the eye bridge and nasal sellion (Landmarks 168 & 6).
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
      frameWidth: smoothWidth,
      scale: smoothScale,
      detected: false,
    };
  }

  const W = videoWidth;
  const H = videoHeight;

  // 1. Nasal Sellion Datum: Landmark 168 (Nasal Root) and Landmark 6 (Bridge Center)
  const sellion   = toVec3(landmarks[LM_SELLION],    W, H);
  const nasalRoot = toVec3(landmarks[LM_NASAL_ROOT], W, H);
  // Target Eye-Line Midpoint: Y_anchor = (Y_168 + Y_6) / 2
  const anchor    = sellion.clone().lerp(nasalRoot, 0.5);

  // 2. Eye line vector & orientation
  const leftEye   = toVec3(landmarks[LM_LEFT_EYE],  W, H);
  const rightEye  = toVec3(landmarks[LM_RIGHT_EYE], W, H);
  const eyeVec    = leftEye.clone().sub(rightEye);
  const eyeSpan   = eyeVec.length();
  const eyeDir    = eyeVec.clone().normalize();

  // 3. Nose down vector
  const nasalTip  = toVec3(landmarks[LM_NASAL_TIP], W, H);
  const noseVec   = nasalTip.clone().sub(nasalRoot).normalize();

  // 4. Face normal vector via cross product
  const faceNormal = eyeDir.clone().cross(noseVec).normalize();

  // 5. Orthonormal basis
  const basisX = eyeDir;
  const basisZ = faceNormal;
  const basisY = basisZ.clone().cross(basisX).normalize();

  const rotMat = new THREE.Matrix4().makeBasis(basisX, basisY, basisZ);
  const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

  // 6. Width Scaling: W_frame = ||P263 - P33|| * 1.40
  const targetFrameWidth = Math.max(eyeSpan * 1.40, 20);

  // Zygomatic baseline for uniform scale reference
  const leftTemple  = toVec3(landmarks[LM_LEFT_TEMPLE],  W, H);
  const rightTemple = toVec3(landmarks[LM_RIGHT_TEMPLE], W, H);
  const templeSpan  = leftTemple.distanceTo(rightTemple);
  const targetScale = templeSpan / 140;

  // 7. Temporal Smoothing (EMA alpha = 0.70)
  if (firstFrame) {
    smoothPos.copy(anchor);
    smoothQuat.copy(targetQuat);
    smoothWidth = targetFrameWidth;
    smoothScale = targetScale;
    firstFrame = false;
  } else {
    emaVec3(smoothPos, anchor);
    emaQuat(smoothQuat, targetQuat);
    smoothWidth = smoothWidth + ALPHA * (targetFrameWidth - smoothWidth);
    smoothScale = smoothScale + ALPHA * (targetScale - smoothScale);
  }

  return {
    position: smoothPos.clone(),
    quaternion: smoothQuat.clone(),
    frameWidth: smoothWidth,
    scale: smoothScale,
    detected: true,
  };
}

/** Resets EMA state (call when camera is stopped/restarted) */
export function resetPoseSmoothing(): void {
  smoothPos   = new THREE.Vector3();
  smoothQuat  = new THREE.Quaternion();
  smoothWidth = 140;
  smoothScale = 1;
  firstFrame  = true;
}
