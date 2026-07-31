"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Copy,
  Check,
  Upload,
  CreditCard,
  Truck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type PaymentMethod = "COD" | "EASYPAISA" | "ALFALAH";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalPrice, clearCart } = useCartStore();

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  // Payment proof states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // General States
  const [copiedText, setCopiedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasProgressiveItem = items.some((item) => {
    const nameMatch = (item.name || "").toLowerCase().includes("progressive") || (item.name || "").toLowerCase().includes("presbyopia");
    const rx = item.prescription as Record<string, unknown> | undefined;
    const usageMatch = typeof rx?.lensUsage === "string" && rx.lensUsage.toLowerCase().includes("progressive");
    const addMatch = rx?.add !== undefined && parseFloat(String(rx.add)) >= 0.50;
    const ageMatch = rx?.age !== undefined && parseInt(String(rx.age)) >= 40;
    return Boolean(nameMatch || usageMatch || (addMatch && ageMatch));
  });

  const subtotal = subtotalPrice();
  const deliveryFee = 250; // Fixed 250 PKR
  const grandTotal = subtotal + deliveryFee;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if cart is empty after client hydration
  useEffect(() => {
    if (mounted && items.length === 0 && !submitting) {
      router.push("/");
    }
  }, [mounted, items, router, submitting]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setUploadingProof(true);
      setErrorMsg("");

      // Simulate a premium upload loading experience (500ms)
      setTimeout(() => {
        // In local development, we mock the uploaded URL
        setProofUrl(`/uploads/proof-${Date.now()}-${file.name}`);
        setUploadingProof(false);
      }, 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!name || !email || !phone || !address || !city) {
      setErrorMsg("Please fill in all customer details.");
      return;
    }

    if ((paymentMethod === "EASYPAISA" || paymentMethod === "ALFALAH") && !proofUrl) {
      setErrorMsg("Please upload your transaction screenshot or payment proof.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: address,
          shippingCity: city,
          paymentMethod,
          transactionProofUrl: proofUrl || null,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      if (data.orderId) {
        clearCart();
        router.push(`/checkout/success?orderId=${data.orderId}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (!mounted || (items.length === 0 && !submitting)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Customer & Payment Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
              
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Checkout Details</h1>
                <p className="text-xs text-slate-500 mt-1">Please provide accurate shipping and payment information.</p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form Fields Section */}
                <div className="space-y-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shipping Destination</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Eleanor Vance"
                          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="eleanor.vance@example.com"
                          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="03001234567"
                          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Lahore"
                          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shipping Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House #, Street name, Area"
                        className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Selector Tab Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Option</h2>
                  
                  {/* Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("COD");
                        setProofFile(null);
                        setProofUrl("");
                      }}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        paymentMethod === "COD"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Cash on Delivery
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("EASYPAISA")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        paymentMethod === "EASYPAISA"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      EasyPaisa / JazzCash
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("ALFALAH")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        paymentMethod === "ALFALAH"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Bank Alfalah
                    </button>
                  </div>

                  {/* Option 1 Details: EasyPaisa / JazzCash */}
                  {paymentMethod === "EASYPAISA" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-900">Transfer directly to Mobile Account:</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                              03006694928
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard("03006694928", "phone")}
                              className="p-1.5 text-slate-400 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                              title="Copy Mobile Number"
                            >
                              {copiedText === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                            <strong>JazzCash Till ID:</strong> <span className="font-mono font-bold text-slate-800">982789898</span> (Dial <span className="font-mono font-bold">*786*10#</span> to pay)
                          </p>
                        </div>

                        {/* QR Code */}
                        <div className="w-28 h-28 border border-slate-200 rounded-lg bg-white overflow-hidden p-1 flex-shrink-0 flex items-center justify-center">
                          <img src="/jazzcash-qr.jpg" alt="JazzCash QR" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* File Upload for Proof */}
                      <div className="border-t border-slate-200/80 pt-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Upload Payment Screenshot / Proof <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-slate-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 bg-white transition-colors">
                            <Upload className="w-4 h-4 text-slate-400" />
                            Choose Screenshot
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                            {proofFile ? proofFile.name : "No file chosen"}
                          </span>
                        </div>

                        {uploadingProof && (
                          <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1.5 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Simulated Uploading Proof...
                          </p>
                        )}
                        {proofUrl && !uploadingProof && (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Proof saved successfully.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Option 2 Details: Bank Alfalah */}
                  {paymentMethod === "ALFALAH" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-900">Transfer directly via IBFT / Raast:</p>
                          <div className="space-y-1 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed font-medium text-slate-700">
                            <p><strong>Bank:</strong> Bank Alfalah Islamic</p>
                            <p><strong>Account Title:</strong> MUHAMMAD AASIM MUSHTAQ</p>
                            <p><strong>Account Number:</strong> 5601005000034907</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span><strong>IBAN:</strong> <span className="font-mono text-[11px] font-bold text-slate-900">PK03ALFH5601005000034907</span></span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard("PK03ALFH5601005000034907", "iban")}
                                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                                title="Copy IBAN"
                              >
                                {copiedText === "iban" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="w-28 h-28 border border-slate-200 rounded-lg bg-white overflow-hidden p-1 flex-shrink-0 flex items-center justify-center">
                          <img src="/bank-qr.jpg" alt="Bank Alfalah QR" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* File Upload for Proof */}
                      <div className="border-t border-slate-200/80 pt-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Upload Payment Screenshot / Proof <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-slate-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 bg-white transition-colors">
                            <Upload className="w-4 h-4 text-slate-400" />
                            Choose Screenshot
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                            {proofFile ? proofFile.name : "No file chosen"}
                          </span>
                        </div>

                        {uploadingProof && (
                          <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1.5 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Simulated Uploading Proof...
                          </p>
                        )}
                        {proofUrl && !uploadingProof && (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Proof saved successfully.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Option 3 Details: COD */}
                  {paymentMethod === "COD" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 animate-fade-in-up">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Truck className="w-4 h-4 text-slate-700" />
                        <span>Pay via Cash on Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Pay for your eyewear purchase in cash upon home delivery. A standard delivery fee of Rs. 250/- applies.
                      </p>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold shadow-2xs">
                        {hasProgressiveItem
                          ? "40% advance must for Cash on Delivery progressive orders."
                          : "25% advance must for Cash on Delivery orders."}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || uploadingProof}
                  className="w-full mt-4 py-4 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order ({formatPrice(grandTotal)})
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Order Summary</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Itemized overview of your purchase.</p>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Quantity: {item.quantity} · {formatPrice(item.price)}
                        </p>
                      </div>

                      <span className="text-xs font-extrabold text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Prescription Details Display */}
                    {item.prescription && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[9px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200/40 pb-1">
                          <span>Lens: {item.prescription.lensUsage || "Prescription"}</span>
                          <span>{item.prescription.lensMaterial || "1.56 Index"}</span>
                        </div>

                        {item.prescription.odSph !== undefined && item.prescription.osSph !== undefined && (
                          <div className="grid grid-cols-2 text-slate-500 font-mono text-[8.5px] pt-0.5 leading-relaxed">
                            <div>OD: SPH {item.prescription.odSph.toFixed(2)} | CYL {item.prescription.odCyl || "0.00"} | AXIS {item.prescription.odAxis || "-"}</div>
                            <div>OS: SPH {item.prescription.osSph.toFixed(2)} | CYL {item.prescription.osCyl || "0.00"} | AXIS {item.prescription.osAxis || "-"}</div>
                          </div>
                        )}
                        {item.prescription.pd && (
                          <span className="block text-[8.5px] text-slate-400">
                            Pupillary Distance (PD): {item.prescription.pd} mm
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-955">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-900">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
