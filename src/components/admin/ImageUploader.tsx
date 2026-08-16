"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CloudUpload,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploaderProps {
  images: string[];
  productId?: string;
  onChange: (newImages: string[]) => void;
}

interface ImageItem {
  id: string;
  previewUrl: string;
  cloudUrl?: string;
  isUploading: boolean;
  progress: number;
  error?: string;
}

export default function ImageUploader({ images, productId, onChange }: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync incoming images to items
  const [items, setItems] = useState<ImageItem[]>(() =>
    images.map((url, idx) => ({
      id: `existing-${idx}-${url.slice(-10)}`,
      previewUrl: url,
      cloudUrl: url,
      isUploading: false,
      progress: 100,
    }))
  );

  // Keep items synced if prop changes externally
  useEffect(() => {
    setItems((prev) => {
      // If currently uploading any file, don't overwrite with old props
      const isAnyUploading = prev.some((i) => i.isUploading);
      if (isAnyUploading) return prev;

      const currentCloudUrls = prev.map((i) => i.cloudUrl || i.previewUrl).filter(Boolean);
      const isSame =
        images.length === currentCloudUrls.length &&
        images.every((u, i) => u === currentCloudUrls[i]);

      if (isSame) return prev;

      return images.map((url, idx) => ({
        id: `existing-${idx}-${url.slice(-10)}`,
        previewUrl: url,
        cloudUrl: url,
        isUploading: false,
        progress: 100,
      }));
    });
  }, [images]);

  const notifyParent = useCallback(
    (updatedItems: ImageItem[]) => {
      const validUrls = updatedItems
        .filter((item) => !item.isUploading && !item.error)
        .map((item) => item.cloudUrl || item.previewUrl)
        .filter((url) => url && url.trim() !== "" && !url.startsWith("blob:"));
      onChange(validUrls);
    },
    [onChange]
  );

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const uploadFileToCloudinary = async (file: File, itemId: string) => {
    try {
      // Step 1: Simulate initial upload start
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, progress: 30 } : it))
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "myeyes/frames");
      formData.append("tag", "catalog_frame");

      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, progress: 65 } : it))
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success && data.secure_url) {
        let optimizedUrl = data.secure_url;
        // Inject high-res auto format and quality if Cloudinary URL
        if (optimizedUrl.includes("cloudinary.com") && optimizedUrl.includes("/upload/")) {
          optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
        }

        setItems((prev) => {
          const updated = prev.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  cloudUrl: optimizedUrl,
                  previewUrl: optimizedUrl,
                  isUploading: false,
                  progress: 100,
                }
              : it
          );
          notifyParent(updated);
          return updated;
        });

        showNotification("Image uploaded & optimized successfully!", "success");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Cloudinary upload failed for item:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to upload image";
      setItems((prev) => {
        const updated = prev.map((it) =>
          it.id === itemId
            ? { ...it, isUploading: false, error: errMsg }
            : it
        );
        notifyParent(updated);
        return updated;
      });
      showNotification(`Upload failed: ${errMsg}`, "error");
    }
  };

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const MAX_SIZE = 15 * 1024 * 1024; // 15MB max
      const fileArray = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && f.size <= MAX_SIZE
      );

      if (fileArray.length === 0) {
        showNotification("Please select valid image files under 15MB.", "error");
        return;
      }

      // Generate instant preview items
      const newItems: ImageItem[] = fileArray.map((file) => {
        const blobUrl = URL.createObjectURL(file);
        return {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          previewUrl: blobUrl,
          isUploading: true,
          progress: 10,
        };
      });

      setItems((prev) => [...prev, ...newItems]);

      // Execute uploads in parallel
      fileArray.forEach((file, index) => {
        const targetId = newItems[index].id;
        uploadFileToCloudinary(file, targetId);
      });
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const newItem: ImageItem = {
      id: `url-${Date.now()}`,
      previewUrl: url,
      cloudUrl: url,
      isUploading: false,
      progress: 100,
    };
    setItems((prev) => {
      const updated = [...prev, newItem];
      notifyParent(updated);
      return updated;
    });
    setUrlInput("");
    showNotification("Image link added to gallery", "success");
  };

  const handleDeleteImage = async (item: ImageItem) => {
    const targetUrl = item.cloudUrl || item.previewUrl;
    setDeletingId(item.id);

    try {
      // If it's a Cloudinary URL or remote asset, call image delete API
      if (targetUrl && (targetUrl.includes("cloudinary.com") || productId)) {
        await fetch("/api/admin/images/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: productId || undefined,
            imageUrl: targetUrl,
          }),
        });
      }

      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== item.id);
        notifyParent(updated);
        return updated;
      });

      showNotification("Image asset removed successfully", "success");
    } catch (err) {
      console.error("Error deleting image:", err);
      // Still remove locally
      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== item.id);
        notifyParent(updated);
        return updated;
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert Banner */}
      {notification && (
        <div
          className={cn(
            "p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all animate-in slide-in-from-top-2",
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "file"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Direct Cloudinary Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "url"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste URL Link</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 font-mono">
            {items.length} Asset{items.length === 1 ? "" : "s"}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-extrabold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Auto-Optimized CDN
          </span>
        </div>
      </div>

      {/* Tab 1: Direct Cloudinary Drag & Drop */}
      {activeTab === "file" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden group",
            isDragging
              ? "border-amber-500 bg-amber-50/70 scale-[1.01]"
              : "border-slate-300 hover:border-slate-900 bg-slate-50/50 hover:bg-slate-100/60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/avif"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300/60 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Drag & Drop Frame Assets or <span className="text-amber-600 underline">Browse Local Files</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Automatic high-resolution Cloudinary pipeline · PNG, JPG, WebP up to 15MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: URL Input */}
      {activeTab === "url" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (e.g. https://res.cloudinary.com/... or https://...)"
            className="flex-1 px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Thumbnails Showcase Gallery */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {items.map((item, idx) => {
            const isDeleting = deletingId === item.id;
            const isPrimary = idx === 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative aspect-square rounded-2xl bg-slate-100 border overflow-hidden group shadow-2xs transition-all",
                  isPrimary ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80",
                  isDeleting ? "opacity-40 pointer-events-none" : ""
                )}
              >
                <Image
                  src={item.previewUrl}
                  alt={`Frame Asset ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                  className="object-cover"
                />

                {/* Upload Progress Bar */}
                {item.isUploading && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-3 gap-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-extrabold text-amber-300">
                      Uploading... {item.progress}%
                    </span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {item.error && (
                  <div className="absolute inset-0 bg-rose-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center text-white">
                    <AlertCircle className="w-5 h-5 text-rose-300 mb-1" />
                    <span className="text-[9px] font-bold leading-tight">{item.error}</span>
                  </div>
                )}

                {/* Primary Tag */}
                {isPrimary && !item.isUploading && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider shadow-sm">
                    Primary
                  </span>
                )}

                {/* Badge Number */}
                {!isPrimary && !item.isUploading && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                    #{idx + 1}
                  </span>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(item)}
                  disabled={isDeleting || item.isUploading}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  title="Delete image asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
