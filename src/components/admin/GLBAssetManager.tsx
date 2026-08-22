"use client";

import React, { useState } from "react";
import { Upload, Box, Check, Loader2, Trash2 } from "lucide-react";
import { ModelPreviewCanvas } from "./ModelPreviewCanvas";

export interface GLBAssetManagerProps {
  productId?: string;
  initialGlbUrl?: string | null;
  onUrlUpdated: (url: string | null) => void;
}

export function GLBAssetManager({
  productId,
  initialGlbUrl,
  onUrlUpdated,
}: GLBAssetManagerProps) {
  const [glbUrl, setGlbUrl] = useState<string | null>(initialGlbUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".glb")) {
      setUploadError("Please select a valid .glb 3D CAD model file.");
      return;
    }

    // Check file size (< 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File size exceeds 50 MB limit.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const sanitizedName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const publicId = `frame_${productId || Date.now()}_${sanitizedName}`;

      // 1. Fetch secure signature from lightweight API (~50 bytes payload, never 413)
      const signRes = await fetch("/api/admin/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: "myeyes/3d-models",
          public_id: publicId,
        }),
      });

      const signData = await signRes.json().catch(() => null);

      if (signRes.ok && signData?.signature && signData?.cloudName) {
        // 2. Direct browser upload straight to Cloudinary RAW endpoint (bypasses serverless body limit)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", String(signData.timestamp));
        formData.append("signature", signData.signature);
        formData.append("folder", signData.folder);
        if (signData.public_id) {
          formData.append("public_id", signData.public_id);
        }

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/raw/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadRes.json().catch(() => null);

        if (!uploadRes.ok || !uploadData?.secure_url) {
          throw new Error(uploadData?.error?.message || "Cloudinary rejected the 3D raw upload.");
        }

        const finalGlbUrl = uploadData.secure_url;
        setGlbUrl(finalGlbUrl);
        onUrlUpdated(finalGlbUrl);
      } else {
        // Fallback to server route if direct signing is unavailable in local environment
        const formData = new FormData();
        formData.append("file", file);
        if (productId && productId.trim()) {
          formData.append("productId", productId.trim());
        }

        const serverRes = await fetch("/api/admin/upload-3d-model", {
          method: "POST",
          body: formData,
        });
        const serverData = await serverRes.json().catch(() => null);

        if (!serverRes.ok || !serverData?.success || !serverData?.modelUrl) {
          throw new Error(serverData?.error || `Upload failed with status ${serverRes.status}`);
        }

        const finalGlbUrl = serverData.modelUrl;
        setGlbUrl(finalGlbUrl);
        onUrlUpdated(finalGlbUrl);
      }
    } catch (err: unknown) {
      console.error("Direct 3D GLB upload caught error:", err);
      const msg = err instanceof Error ? err.message : "Upload failed. Please check network and file size.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    setGlbUrl(null);
    onUrlUpdated(null);
    setUploadError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#ff7a00] shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">3D CAD Model (.glb)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct-to-Cloudinary raw binary upload bypassing server limits.
            </p>
          </div>
        </div>

        {glbUrl && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>Model Active</span>
          </span>
        )}
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
          {uploadError}
        </div>
      )}

      {/* Upload Container */}
      {!glbUrl ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-[#ff7a00] hover:bg-amber-50/30 rounded-2xl cursor-pointer transition select-none">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
              <span className="text-xs font-bold text-slate-800">
                Streaming 3D CAD Binary to Cloudinary&hellip;
              </span>
              <span className="text-[11px] text-slate-400">Direct client-to-CDN raw transfer</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-800">
                Click to select or drag &amp; drop .glb model
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Direct Cloudinary upload (supports up to 50 MB files)
              </span>
            </div>
          )}
          <input
            type="file"
            accept=".glb"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs gap-3">
            <span className="text-slate-600 font-mono truncate max-w-sm">{glbUrl}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition shadow-2xs"
              >
                {showPreview ? "Hide 3D View" : "Show 3D View"}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Remove Model"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showPreview && <ModelPreviewCanvas modelUrl={glbUrl} />}
        </div>
      )}
    </div>
  );
}

export default GLBAssetManager;
