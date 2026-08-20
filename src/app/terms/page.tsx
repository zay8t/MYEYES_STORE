import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | MyEyes Optical Studio",
  description: "Terms and conditions for purchasing prescription eyewear, sunglasses, and optical lenses from MyEyes.",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400 mb-10">
          Last updated: January 2026
        </p>

        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              1. Optical Accuracy & Prescription Verification
            </h2>
            <p>
              By placing an order for prescription eyeglasses or custom lenses, you certify that the prescription details provided are accurate and provided by a licensed optometrist or ophthalmologist. Our lab technicians verify every prescription before edging and mounting lenses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              2. Custom Lab Orders & Returns
            </h2>
            <p>
              Custom-crafted prescription lenses are tailored specifically to your visual parameters. Non-prescription frames and standard sunglasses can be exchanged within 7 days of delivery in pristine condition. If an error is made by our lab, we offer a 100% free remake guarantee.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              3. Nationwide & Global Delivery
            </h2>
            <p>
              Orders are dispatched via express insured couriers across Pakistan and international destinations. Tracking identifiers are provided automatically once your glasses leave our optical laboratory.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              4. Contact & Support
            </h2>
            <p>
              For service questions or order support, reach out to our optical team at{" "}
              <a
                href="mailto:myeyes2026@gmail.com"
                className="text-[#ff7a00] hover:underline font-medium"
              >
                myeyes2026@gmail.com
              </a>{" "}
              or message us on WhatsApp at{" "}
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
