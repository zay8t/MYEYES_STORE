"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, Trash2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/nativeStorage";

export interface ImageUploaderProps {
  images: string[];
  onChange: (newImages: string[]) => void;
}

interface ImageItem {
  id: string;
  previewUrl: string;
  dataUrl?: string;
  isUploading: boolean;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert string URLs to initial item list
  const [items, setItems] = useState<ImageItem[]>(() =>
    images.map((url, idx) => ({
      id: `init-${idx}-${Date.now()}`,
      previewUrl: url,
      dataUrl: url,
      isUploading: false,
    }))
  );

  const notifyChange = useCallback((updatedItems: ImageItem[]) => {
    const validUrls = updatedItems
      .map((item) => item.dataUrl || item.previewUrl)
      .filter((url) => url && url.trim() !== "");
    onChange(validUrls);
  }, [onChange]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB max bounds for high-res eyewear frames
    const oversize = Array.from(files).filter((file) => file.size > MAX_SIZE);
    if (oversize.length > 0) {
      alert("Some files exceed the 10MB size limit and were skipped.");
    }

    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/") && file.size <= MAX_SIZE
    );

    if (fileArray.length === 0) return;

    // 1. INSTANT 0ms BLOB PREVIEW GENERATION
    const newItems: ImageItem[] = fileArray.map((file) => {
      const blobUrl = URL.createObjectURL(file);
      return {
        id: `blob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: blobUrl,
        isUploading: true,
      };
    });

    setItems((prev) => {
      const updated = [...prev, ...newItems];
      notifyChange(updated);
      return updated;
    });

    // 2. ASYNCHRONOUS BACKGROUND FILE CONVERSION WITH HIGH-RES RETINA PRESERVATION (Non-blocking UI Thread)
    fileArray.forEach((file, index) => {
      const targetId = newItems[index].id;

      setTimeout(() => {
        compressImage(file, 2400, 2400, 0.92)
          .then((compressedBase64) => {
            setItems((prev) => {
              const updated = prev.map((item) =>
                item.id === targetId
                  ? { ...item, dataUrl: compressedBase64, isUploading: false }
                  : item
              );
              notifyChange(updated);
              return updated;
            });
          })
          .catch((err) => {
            console.error("Image compression failed, falling back to raw reader:", err);
            const reader = new FileReader();
            reader.onload = (e) => {
              const resultStr = e.target?.result as string;
              setItems((prev) => {
                const updated = prev.map((item) =>
                  item.id === targetId
                    ? { ...item, dataUrl: resultStr, isUploading: false }
                    : item
                );
                notifyChange(updated);
                return updated;
              });
            };
            reader.onerror = (readerErr) => {
              console.error("FileReader failed for image file:", readerErr);
              setItems((prev) => {
                const updated = prev.map((item) =>
                  item.id === targetId
                    ? { ...item, isUploading: false }
                    : item
                );
                notifyChange(updated);
                return updated;
              });
            };
            reader.readAsDataURL(file);
          });
      }, 10 * index);
    });
  }, [notifyChange]);

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
      dataUrl: url,
      isUploading: false,
    };
    setItems((prev) => {
      const updated = [...prev, newItem];
      notifyChange(updated);
      return updated;
    });
    setUrlInput("");
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      notifyChange(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Tabs */}
      <div className="flex items-center justify-between">
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
            <Upload className="w-3.5 h-3.5" />
            <span>Drag & Drop File Upload</span>
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

        <span className="text-[11px] font-bold text-slate-400 font-mono">
          {items.length} Asset(s) Attached
        </span>
      </div>

      {/* Tab 1: Drag & Drop Dropzone */}
      {activeTab === "file" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden group",
            isDragging
              ? "border-amber-500 bg-amber-50/60 scale-[1.01]"
              : "border-slate-300 hover:border-slate-900 bg-slate-50/50 hover:bg-slate-100/60"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300/60 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Drag & Drop High-Res Frame Assets or <span className="text-amber-600 underline">Browse Local Files</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Instant 0ms blob preview rendering · Supports PNG, JPG, WebP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Direct URL Input */}
      {activeTab === "url" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter direct image URL (e.g. /products/frame1.jpg or https://...)"
            className="flex-1 px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
          >
            Add Image Link
          </button>
        </div>
      )}

      {/* Instant Rendered Thumbnails Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden group shadow-2xs transition-transform hover:scale-[1.02]"
            >
              <Image
                src={item.previewUrl}
                alt={`Frame Asset ${idx + 1}`}
                fill
                sizes="120px"
                unoptimized
                className="object-cover"
              />

              {/* Uploading Spinner Badge */}
              {item.isUploading && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Badge Number */}
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                #{idx + 1}
              </span>

              {/* Delete Trigger */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
