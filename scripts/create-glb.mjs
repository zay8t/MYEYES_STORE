import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// 1. Box Vertices (8 corners * 3 floats = 24 floats = 96 bytes)
const positions = new Float32Array([
  -0.8, -0.4, -0.1,  0.8, -0.4, -0.1,  0.8,  0.4, -0.1, -0.8,  0.4, -0.1,
  -0.8, -0.4,  0.1,  0.8, -0.4,  0.1,  0.8,  0.4,  0.1, -0.8,  0.4,  0.1,
]);

// 2. Normals (8 * 3 floats = 24 floats = 96 bytes)
const normals = new Float32Array([
  -0.577, -0.577, -0.577,  0.577, -0.577, -0.577,  0.577,  0.577, -0.577, -0.577,  0.577, -0.577,
  -0.577, -0.577,  0.577,  0.577, -0.577,  0.577,  0.577,  0.577,  0.577, -0.577,  0.577,  0.577,
]);

// 3. Indices for 12 triangles (36 uint16 = 72 bytes)
const indices = new Uint16Array([
  0, 2, 1,  0, 3, 2,  4, 5, 6,  4, 6, 7,
  0, 1, 5,  0, 5, 4,  2, 3, 7,  2, 7, 6,
  0, 4, 7,  0, 7, 3,  1, 2, 6,  1, 6, 5,
]);

// Concatenate binary buffers: 96 + 96 + 72 = 264 bytes
const posBuf = Buffer.from(positions.buffer);
const normBuf = Buffer.from(normals.buffer);
const indBuf = Buffer.from(indices.buffer);

const binBuffer = Buffer.concat([posBuf, normBuf, indBuf]);
const base64Data = binBuffer.toString('base64');

const gltfContent = {
  asset: {
    generator: "MyEyes Eyewear 3D Studio Builder",
    version: "2.0"
  },
  scene: 0,
  scenes: [
    {
      name: "EyewearScene",
      nodes: [0, 1, 2]
    }
  ],
  nodes: [
    { name: "Bridge", mesh: 0, translation: [0, 0.05, 0], scale: [0.3, 0.08, 0.08] },
    { name: "LeftRim", mesh: 0, translation: [-0.95, 0, 0], scale: [1.1, 0.9, 0.15] },
    { name: "RightRim", mesh: 0, translation: [0.95, 0, 0], scale: [1.1, 0.9, 0.15] }
  ],
  materials: [
    {
      name: "ObsidianAcetateFrame",
      pbrMetallicRoughness: {
        baseColorFactor: [0.11, 0.11, 0.12, 1.0],
        metallicFactor: 0.85,
        roughnessFactor: 0.18
      }
    }
  ],
  meshes: [
    {
      name: "FrameMesh",
      primitives: [
        {
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 2,
          material: 0
        }
      ]
    }
  ],
  accessors: [
    {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126,
      count: 8,
      type: "VEC3",
      max: [0.8, 0.4, 0.1],
      min: [-0.8, -0.4, -0.1]
    },
    {
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126,
      count: 8,
      type: "VEC3",
      max: [1.0, 1.0, 1.0],
      min: [-1.0, -1.0, -1.0]
    },
    {
      bufferView: 2,
      byteOffset: 0,
      componentType: 5123,
      count: 36,
      type: "SCALAR"
    }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 96, target: 34962 },
    { buffer: 0, byteOffset: 96, byteLength: 96, target: 34962 },
    { buffer: 0, byteOffset: 192, byteLength: 72, target: 34963 }
  ],
  buffers: [
    {
      byteLength: binBuffer.length,
      uri: `data:application/octet-stream;base64,${base64Data}`
    }
  ]
};

// Pack gltfContent into GLB binary container
const jsonStr = JSON.stringify(gltfContent);
const jsonBuf = Buffer.from(jsonStr, 'utf8');

const jsonPadding = (4 - (jsonBuf.length % 4)) % 4;
const jsonChunkLen = jsonBuf.length + jsonPadding;
const totalLen = 12 + 8 + jsonChunkLen;

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546C67, 0); // 'glTF'
header.writeUInt32LE(2, 4);          // version 2
header.writeUInt32LE(totalLen, 8);

const chunkHeader = Buffer.alloc(8);
chunkHeader.writeUInt32LE(jsonChunkLen, 0);
chunkHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

const paddedJson = Buffer.concat([jsonBuf, Buffer.alloc(jsonPadding, 0x20)]);
const glbBuf = Buffer.concat([header, chunkHeader, paddedJson]);

const glbPath = path.join(modelsDir, 'eyewear.glb');
fs.writeFileSync(glbPath, glbBuf);
console.log(`Successfully generated valid GLB model at: ${glbPath} (${glbBuf.length} bytes)`);
