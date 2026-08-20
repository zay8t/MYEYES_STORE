import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | MyEyes Optical Studio",
  description: "Learn how MyEyes protects and manages your personal data and optical prescription records.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-[#ff7a00] transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 mb-10">
          Last updated: January 2026
        </p>

        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              1. Information We Collect
            </h2>
            <p>
              At MyEyes Optical Studio, we collect information necessary to process your optical orders and provide customized eyewear. This includes your contact information (name, email address, phone number, shipping address) and optical prescription details (pupillary distance, sphere, cylinder, axis, and optometrist prescription slips).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              2. How We Use Your Information
            </h2>
            <p>
              We use your data strictly for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Precision lens cutting, optical mounting, and laboratory calibration.</li>
              <li>Order fulfillment, courier delivery, and status notifications via SMS/WhatsApp.</li>
              <li>Customer support, warranty claims, and optical consultations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              3. Data Security & Prescription Confidentiality
            </h2>
            <p>
              Your medical and prescription records are treated with the highest confidentiality. Optical parameters are shared solely with certified optical technicians for lens cutting and never sold, rented, or distributed to third-party marketing services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              4. Direct Inquiries
            </h2>
            <p>
              If you have questions regarding your data or wish to request deletion of your records, contact our optical desk at{" "}
              <a
                href="mailto:myeyes2026@gmail.com"
                className="text-[#ff7a00] hover:underline font-medium"
              >
                myeyes2026@gmail.com
              </a>{" "}
              or via WhatsApp at{" "}
              <a
                href="https://wa.me/923006694928"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff7a00] hover:underline font-medium"
              >
                +92 300 6694928
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
