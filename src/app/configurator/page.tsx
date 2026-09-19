"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Glasses, Sparkles, CheckCircle2, ArrowRight, Loader2, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import LensConfiguratorModal, { type FrameDetails } from "@/components/configurator/LensConfiguratorModal";

interface LeadData {
  id: string;
  customerName: string;
  mobileNumber: string;
  frameId?: string | null;
  frameName?: string | null;
  frame?: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    images?: string;
    image_url?: string | null;
    colors?: string[];
    material?: string;
    frameShape?: string;
  } | null;
  step?: string;
}

function ConfiguratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeLeadId = searchParams.get("resumeLeadId") || searchParams.get("leadId");
  const urlFrameId = searchParams.get("frameId");

  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(urlFrameId || null);
  const [selectedFrame, setSelectedFrame] = useState<FrameDetails | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!resumeLeadId) {
      if (urlFrameId) {
        // Fetch frame details if only frameId is provided
        fetch(`/api/products/${urlFrameId}`)
          .then((res) => res.json())
          .then((prod) => {
            if (prod && prod.id) {
              const parsedImages = typeof prod.images === "string" ? prod.images.split(",")[0] : prod.images?.[0];
              setSelectedFrame({
                id: prod.id,
                name: prod.name,
                price: prod.price,
                imageUrl: prod.image_url || parsedImages || "/placeholder-frame.png",
                color: prod.colors?.[0] || "Standard",
              });
              setIsModalOpen(true);
            }
          })
          .catch(() => {});
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/leads/resume?leadId=${encodeURIComponent(resumeLeadId)}`)
      .then((res) => res.json())
      .then((response) => {
        if (response.success && response.data) {
          const data: LeadData = response.data;
          if (data.customerName) setCustomerName(data.customerName);
          if (data.mobileNumber) setMobileNumber(data.mobileNumber);
          if (data.frameId) setSelectedFrameId(data.frameId);

          if (data.frame) {
            const parsedImages = typeof data.frame.images === "string" 
              ? data.frame.images.split(",")[0] 
              : "/placeholder-frame.png";
            
            setSelectedFrame({
              id: data.frame.id,
              name: data.frame.name,
              price: data.frame.price,
              imageUrl: data.frame.image_url || parsedImages || "/placeholder-frame.png",
              color: data.frame.colors?.[0] || "Black",
            });
          } else {
            // Fallback frame object
            setSelectedFrame({
              id: data.frameId || "custom-frame",
              name: data.frameName || "Selected Eyewear Frame",
              price: 3500,
              imageUrl: "/placeholder-frame.png",
              color: "Classic",
            });
          }

          // Fast-forward directly past contact step
          setCurrentStep(2);
          setIsModalOpen(true);
        } else {
          setError(response.error || "Could not retrieve your saved cart session.");
        }
      })
      .catch((err) => {
        console.error("Error restoring session:", err);
        setError("Failed to connect to recovery server.");
      })
      .finally(() => setIsLoading(false));
  }, [resumeLeadId, urlFrameId]);

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Notification Banner */}
        {resumeLeadId && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    1-Click Cart Resume
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Session Restored</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  Welcome back, {customerName || "Valued Customer"}! 👓
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  We kept your customized <strong className="text-slate-900">{selectedFrame?.name || "Frame"}</strong> ready. Complete your prescription configuration in 1 click below.
                </p>
              </div>
            </div>

            {selectedFrame && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <span>Reopen Configurator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-bold text-slate-700">Restoring your saved frame and measurements...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
            >
              <Glasses className="w-4 h-4" />
              <span>Browse Eyewear Catalogue</span>
            </Link>
          </div>
        )}

        {/* Restored Item Showcase Card */}
        {selectedFrame && !isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Image Preview */}
              <div className="relative aspect-4/3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-6 overflow-hidden group">
                <Image
                  src={selectedFrame.imageUrl || "/placeholder-frame.png"}
                  alt={selectedFrame.name}
                  width={400}
                  height={300}
                  className="object-contain max-h-[220px] transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedFrame.color || "Standard"}
                </span>
              </div>

              {/* Specs & Quick Action */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold tracking-widest text-amber-700 uppercase bg-amber-50 border border-amber-200/70 px-3 py-1 rounded-full inline-block">
                    Your Saved Selection
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {selectedFrame.name}
                  </h2>
                  <p className="text-xl font-extrabold text-amber-700">
                    Rs. {Number(selectedFrame.price).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Optical Lab Grade Accuracy Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Upload doctor&apos;s slip or send via WhatsApp anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Nationwide Doorstep Delivery with COD</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Customize Lenses & Checkout</span>
                  </button>

                  <Link
                    href="/catalogue"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Frame</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Frame Selected / Direct Arrival */}
        {!resumeLeadId && !selectedFrame && !isLoading && (
          <div className="text-center py-16 space-y-6 bg-white rounded-3xl border border-slate-200 shadow-xs p-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center justify-center">
              <Glasses className="w-8 h-8 text-[#ff7a00]" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Custom Eyewear Lens Configurator</h2>
              <p className="text-sm text-slate-600 font-medium">
                Choose a stylish frame from our catalogue to pair with certified prescription lenses or computer blue-cut protection.
              </p>
            </div>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md"
            >
              <span>Explore All Frames</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Lens Configurator Modal with Pre-filled Lead State */}
      {selectedFrame && (
        <LensConfiguratorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          frame={selectedFrame}
          initialStep={currentStep}
          initialCustomer={{
            name: customerName,
            phone: mobileNumber,
            whatsapp: mobileNumber,
          }}
          resumeLeadId={resumeLeadId}
        />
      )}
    </div>
  );
}

export default function ConfiguratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <ConfiguratorContent />
    </Suspense>
  );
}
