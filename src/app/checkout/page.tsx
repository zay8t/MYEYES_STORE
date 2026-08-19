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
  X,
  FileCheck,
  Building2,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import LogoLoader from "@/components/ui/LogoLoader";

type PaymentMethod = "COD" | "BANK_TRANSFER" | "EASYPAISA" | "JAZZCASH";

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

  // Payment Receipt Verification States
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [checkoutOrderNumber, setCheckoutOrderNumber] = useState("");

  // Transaction ID Fraud Prevention States
  const [transactionId, setTransactionId] = useState("");
  const [paymentSenderName, setPaymentSenderName] = useState("");
  const [paymentSenderPhone, setPaymentSenderPhone] = useState("");
  const [tidCheckStatus, setTidCheckStatus] = useState<"idle" | "checking" | "ok" | "duplicate">("idle");
  const [tidError, setTidError] = useState("");

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
    // Initialize persistent tentative Order Number for transfer remarks & cloudinary tagging
    const storedOrd = sessionStorage.getItem("myeyes_checkout_ord");
    if (storedOrd) {
      setCheckoutOrderNumber(storedOrd);
    } else {
      const gen = Math.floor(10000000 + Math.random() * 90000000).toString();
      sessionStorage.setItem("myeyes_checkout_ord", gen);
      setCheckoutOrderNumber(gen);
    }
  }, []);

  // Redirect if cart is empty after client hydration
  useEffect(() => {
    if (mounted && items.length === 0 && !submitting) {
      router.push("/");
    }
  }, [mounted, items, router, submitting]);

  // Live TID duplicate check (debounced 600ms)
  useEffect(() => {
    if (!transactionId || transactionId.length < 8) {
      setTidCheckStatus("idle");
      setTidError("");
      return;
    }
    setTidCheckStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payments/check-tid?tid=${encodeURIComponent(transactionId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.isDuplicate) {
          setTidCheckStatus("duplicate");
          setTidError(data.message || "This Transaction ID has already been used. Please verify your receipt.");
        } else {
          setTidCheckStatus("ok");
          setTidError("");
        }
      } catch {
        setTidCheckStatus("idle");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [transactionId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setProofFile(file);
    setUploadingProof(true);
    setErrorMsg("");

    // Create local object URL for instant preview before network returns
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "myeyes/payment_receipts");
      formData.append("tag", `receipt_order_${checkoutOrderNumber || "PENDING"}_${Date.now()}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || (!data.url && !data.secure_url)) {
        throw new Error(data.error || "Failed to upload receipt screenshot to Cloudinary.");
      }

      const receiptUrl = data.url || data.secure_url;
      setPaymentReceiptUrl(receiptUrl);
      setPreviewUrl(receiptUrl);
    } catch (err) {
      console.error("Receipt upload error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to upload payment receipt screenshot. Please try again."
      );
      setPaymentReceiptUrl("");
      setPreviewUrl("");
    } finally {
      setUploadingProof(false);
    }
  };

  const removeReceipt = () => {
    setPaymentReceiptUrl("");
    setPreviewUrl("");
    setProofFile(null);
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
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

    const isOnlinePayment = paymentMethod === "BANK_TRANSFER" || paymentMethod === "EASYPAISA" || paymentMethod === "JAZZCASH";

    if (isOnlinePayment && !transactionId) {
      setErrorMsg("Please enter your Transaction ID (TID) / Reference number.");
      return;
    }

    if (isOnlinePayment && !paymentReceiptUrl) {
      setErrorMsg("Please upload your payment verification receipt screenshot before confirming your order.");
      return;
    }

    if (isOnlinePayment && tidCheckStatus === "duplicate") {
      setErrorMsg("Transaction ID already used in another order. Please upload a valid unique receipt.");
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
          paymentStatus: isOnlinePayment ? "PENDING_VERIFICATION" : "PENDING",
          paymentReceiptUrl: isOnlinePayment ? paymentReceiptUrl : null,
          transactionProofUrl: isOnlinePayment ? paymentReceiptUrl : null,
          transactionId: isOnlinePayment && transactionId ? transactionId.trim().toUpperCase() : null,
          paymentSenderName: isOnlinePayment && paymentSenderName ? paymentSenderName.trim() : null,
          paymentSenderPhone: isOnlinePayment && paymentSenderPhone ? paymentSenderPhone.trim() : null,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      if (data.orderNumber || data.orderId) {
        clearCart();
        router.push(`/order-success/${data.orderNumber || data.orderId}`);
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
    return <LogoLoader text="SECURING CHECKOUT SESSION..." />;
  }

  const isOnlinePayment = paymentMethod === "BANK_TRANSFER" || paymentMethod === "EASYPAISA" || paymentMethod === "JAZZCASH";
  const isConfirmDisabled = submitting || uploadingProof || (isOnlinePayment && (!paymentReceiptUrl || !transactionId || tidCheckStatus === "duplicate"));

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
                    <div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("COD");
                        removeReceipt();
                      }}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "COD"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>COD</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Bank Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("EASYPAISA")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "EASYPAISA"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>EasyPaisa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("JAZZCASH")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === "JAZZCASH"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>JazzCash</span>
                    </button>
                  </div>

                  {/* Option 1 Details: Bank Transfer */}
                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-900">Transfer directly via IBFT / Raast:</p>
                          <div className="space-y-1 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed font-medium text-slate-700">
                            <p><strong>Bank:</strong> Bank Alfalah Islamic</p>
                            <p><strong>Account Title:</strong> MUHAMMAD AASIM MUSHTAQ</p>
                            <div className="flex items-center gap-2">
                              <span><strong>Account Number:</strong> <span className="font-mono font-bold text-slate-900">5601005000034907</span></span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard("5601005000034907", "account")}
                                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                                title="Copy Account Number"
                              >
                                {copiedText === "account" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
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

                      {/* Order Remarks Notice */}
                      {checkoutOrderNumber && (
                        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
                          <span>
                            Please mention <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-slate-900">Order #{checkoutOrderNumber}</strong> in your transfer remarks.
                          </span>
                        </div>
                      )}

                      {/* Cloudinary Receipt Upload Component */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Upload Payment Verification Screenshot <span className="text-red-500">*</span>
                        </label>

                        {previewUrl ? (
                          <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                <img src={previewUrl} alt="Payment Receipt Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                                  {proofFile ? proofFile.name : "Payment Receipt Screenshot"}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Cloudinary Upload Verified</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={removeReceipt}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Replace / Remove Screenshot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : uploadingProof ? (
                          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-900 mx-auto" />
                            <p className="text-xs font-bold text-slate-800">Uploading Payment Screenshot to Cloudinary...</p>
                            <p className="text-[10px] text-slate-400">Please wait a moment while your image is processing.</p>
                          </div>
                        ) : (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                              isDragging
                                ? "border-slate-900 bg-slate-100/80"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            }`}
                          >
                            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-800">
                              Drag & drop your receipt screenshot here
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                              Supports JPG, PNG, WEBP images up to 10MB
                            </p>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Transaction ID & Sender Details fields */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Transaction ID (TID / Ref #) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 12345678901"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value.replace(/\s/g, ""))}
                              className={`w-full px-3 py-2.5 text-xs font-mono border rounded-xl bg-white focus:outline-none transition-colors ${
                                tidCheckStatus === "duplicate"
                                  ? "border-red-400 bg-red-50/50"
                                  : tidCheckStatus === "ok"
                                  ? "border-emerald-400"
                                  : "border-slate-200 focus:border-slate-900"
                              }`}
                            />
                            {tidCheckStatus === "checking" && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "ok" && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "duplicate" && (
                              <X className="w-3.5 h-3.5 text-red-600 absolute right-3 top-2.5" />
                            )}
                          </div>
                          {tidError && (
                            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                              ⚠️ {tidError}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Account Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Name on bank account"
                              value={paymentSenderName}
                              onChange={(e) => setPaymentSenderName(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Phone Number
                            </label>
                            <input
                              type="text"
                              placeholder="03XXXXXXXXX"
                              value={paymentSenderPhone}
                              onChange={(e) => setPaymentSenderPhone(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 2 Details: EasyPaisa */}
                  {paymentMethod === "EASYPAISA" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-900">Transfer directly via EasyPaisa:</p>
                          <div className="space-y-1 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed font-medium text-slate-700">
                            <p><strong>Account Title:</strong> MUHAMMAD AASIM MUSHTAQ</p>
                            <div className="flex items-center gap-2">
                              <span><strong>EasyPaisa Number:</strong> <span className="font-mono text-sm font-bold text-slate-900">03006694928</span></span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard("03006694928", "easypaisa_phone")}
                                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                                title="Copy Number"
                              >
                                {copiedText === "easypaisa_phone" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="w-28 h-28 border border-slate-200 rounded-lg bg-white overflow-hidden p-1 flex-shrink-0 flex items-center justify-center">
                          <img src="/jazzcash-qr.jpg" alt="EasyPaisa / JazzCash QR" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* Order Remarks Notice */}
                      {checkoutOrderNumber && (
                        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
                          <span>
                            Please mention <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-slate-900">Order #{checkoutOrderNumber}</strong> in your transfer remarks.
                          </span>
                        </div>
                      )}

                      {/* Cloudinary Receipt Upload Component */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Upload EasyPaisa Receipt Screenshot <span className="text-red-500">*</span>
                        </label>

                        {previewUrl ? (
                          <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                <img src={previewUrl} alt="Payment Receipt Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                                  {proofFile ? proofFile.name : "Payment Receipt Screenshot"}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Cloudinary Upload Verified</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={removeReceipt}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Replace / Remove Screenshot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : uploadingProof ? (
                          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-900 mx-auto" />
                            <p className="text-xs font-bold text-slate-800">Uploading Payment Screenshot to Cloudinary...</p>
                            <p className="text-[10px] text-slate-400">Please wait a moment while your image is processing.</p>
                          </div>
                        ) : (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                              isDragging
                                ? "border-slate-900 bg-slate-100/80"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            }`}
                          >
                            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-800">
                              Drag & drop your EasyPaisa screenshot here
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                              Supports JPG, PNG, WEBP images up to 10MB
                            </p>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Transaction ID & Sender Details fields */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Transaction ID (TID / Ref #) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 12345678901"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value.replace(/\s/g, ""))}
                              className={`w-full px-3 py-2.5 text-xs font-mono border rounded-xl bg-white focus:outline-none transition-colors ${
                                tidCheckStatus === "duplicate"
                                  ? "border-red-400 bg-red-50/50"
                                  : tidCheckStatus === "ok"
                                  ? "border-emerald-400"
                                  : "border-slate-200 focus:border-slate-900"
                              }`}
                            />
                            {tidCheckStatus === "checking" && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "ok" && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "duplicate" && (
                              <X className="w-3.5 h-3.5 text-red-600 absolute right-3 top-2.5" />
                            )}
                          </div>
                          {tidError && (
                            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                              ⚠️ {tidError}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Account Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Name on EasyPaisa account"
                              value={paymentSenderName}
                              onChange={(e) => setPaymentSenderName(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Mobile Number
                            </label>
                            <input
                              type="text"
                              placeholder="03XXXXXXXXX"
                              value={paymentSenderPhone}
                              onChange={(e) => setPaymentSenderPhone(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 3 Details: JazzCash */}
                  {paymentMethod === "JAZZCASH" && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 animate-fade-in-up">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-900">Transfer directly via JazzCash:</p>
                          <div className="space-y-1 bg-white border border-slate-200 p-3 rounded-lg leading-relaxed font-medium text-slate-700">
                            <p><strong>Account Title:</strong> MUHAMMAD AASIM MUSHTAQ</p>
                            <div className="flex items-center gap-2">
                              <span><strong>JazzCash Number:</strong> <span className="font-mono text-sm font-bold text-slate-900">03006694928</span></span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard("03006694928", "jazzcash_phone")}
                                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                                title="Copy Number"
                              >
                                {copiedText === "jazzcash_phone" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 pt-1">
                              <strong>Till ID:</strong> <span className="font-mono font-bold text-slate-900">982789898</span> (Dial <span className="font-mono font-bold">*786*10#</span>)
                            </p>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="w-28 h-28 border border-slate-200 rounded-lg bg-white overflow-hidden p-1 flex-shrink-0 flex items-center justify-center">
                          <img src="/jazzcash-qr.jpg" alt="JazzCash QR" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      {/* Order Remarks Notice */}
                      {checkoutOrderNumber && (
                        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
                          <span>
                            Please mention <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-slate-900">Order #{checkoutOrderNumber}</strong> in your transfer remarks.
                          </span>
                        </div>
                      )}

                      {/* Cloudinary Receipt Upload Component */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">
                          Upload JazzCash Receipt Screenshot <span className="text-red-500">*</span>
                        </label>

                        {previewUrl ? (
                          <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                <img src={previewUrl} alt="Payment Receipt Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                                  {proofFile ? proofFile.name : "Payment Receipt Screenshot"}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Cloudinary Upload Verified</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={removeReceipt}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Replace / Remove Screenshot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : uploadingProof ? (
                          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-900 mx-auto" />
                            <p className="text-xs font-bold text-slate-800">Uploading Payment Screenshot to Cloudinary...</p>
                            <p className="text-[10px] text-slate-400">Please wait a moment while your image is processing.</p>
                          </div>
                        ) : (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center ${
                              isDragging
                                ? "border-slate-900 bg-slate-100/80"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            }`}
                          >
                            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-800">
                              Drag & drop your JazzCash screenshot here
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 mb-3">
                              Supports JPG, PNG, WEBP images up to 10MB
                            </p>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Transaction ID & Sender Details fields */}
                      <div className="border-t border-slate-200/80 pt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Transaction ID (TID / Ref #) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. 12345678901"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value.replace(/\s/g, ""))}
                              className={`w-full px-3 py-2.5 text-xs font-mono border rounded-xl bg-white focus:outline-none transition-colors ${
                                tidCheckStatus === "duplicate"
                                  ? "border-red-400 bg-red-50/50"
                                  : tidCheckStatus === "ok"
                                  ? "border-emerald-400"
                                  : "border-slate-200 focus:border-slate-900"
                              }`}
                            />
                            {tidCheckStatus === "checking" && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "ok" && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-2.5" />
                            )}
                            {tidCheckStatus === "duplicate" && (
                              <X className="w-3.5 h-3.5 text-red-600 absolute right-3 top-2.5" />
                            )}
                          </div>
                          {tidError && (
                            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                              ⚠️ {tidError}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Account Title <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Name on JazzCash account"
                              value={paymentSenderName}
                              onChange={(e) => setPaymentSenderName(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Sender Mobile Number
                            </label>
                            <input
                              type="text"
                              placeholder="03XXXXXXXXX"
                              value={paymentSenderPhone}
                              onChange={(e) => setPaymentSenderPhone(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 4 Details: COD */}
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
                  disabled={isConfirmDisabled}
                  className="w-full mt-4 py-4 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Confirming Order...
                    </>
                  ) : (
                    <>
                      Confirm Order ({formatPrice(grandTotal)})
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
