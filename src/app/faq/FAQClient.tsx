"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Glasses,
  ShieldCheck,
  Eye,
  Truck,
  Sparkles,
  Ruler,
  Phone,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  id: string;
  category: "prescription" | "lenses" | "frames" | "shipping" | "warranty";
  categoryLabel: string;
  question: string;
  shortAnswer: string;
  fullAnswer: React.ReactNode;
  tags: string[];
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: "read-prescription",
    category: "prescription",
    categoryLabel: "Prescription & Optical Measurements",
    question: "How do I read my optical prescription (SPH, CYL, AXIS, ADD, PD)?",
    shortAnswer:
      "SPH indicates nearsightedness (-) or farsightedness (+). CYL and AXIS correct astigmatism. ADD specifies reading power for multifocals, and PD (Pupillary Distance) centers lenses precisely in front of your pupils.",
    tags: ["prescription", "sph", "cyl", "axis", "pd", "astigmatism", "reading prescription"],
    fullAnswer: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>Your optical prescription contains parameters that tell our optical lab how to shape your lenses:</p>
        <ul className="space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal">
          <li>
            <strong className="text-slate-900 font-semibold">OD (Oculus Dexter) &amp; OS (Oculus Sinister):</strong> OD is your right eye and OS is your left eye.
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">SPH (Sphere):</strong> The lens power needed to correct nearsightedness (indicated by a minus sign <code className="bg-slate-200/80 px-1 py-0.5 rounded text-xs font-mono">-</code>) or farsightedness (indicated by a plus sign <code className="bg-slate-200/80 px-1 py-0.5 rounded text-xs font-mono">+</code>).
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">CYL (Cylinder) &amp; AXIS (0° - 180°):</strong> Corrects astigmatism caused by an irregularly shaped cornea. If CYL is present, an AXIS number is required.
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">ADD (Near Addition):</strong> Additional magnifying power needed for bifocals or progressive lenses (typically +0.75 to +3.00).
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">PD (Pupillary Distance):</strong> The distance between your pupil centers in millimeters (typically 58mm to 68mm for adults).
          </li>
        </ul>
        <p>
          At <strong>MY EYES</strong>, you can either enter these parameters manually during lens configuration or simply upload a photo of your doctor's prescription slip at checkout.
        </p>
      </div>
    ),
  },
  {
    id: "pupillary-distance-measurement",
    category: "prescription",
    categoryLabel: "Prescription & Optical Measurements",
    question: "What is Pupillary Distance (PD) and how can I measure it online with My Eyes?",
    shortAnswer:
      "PD is the millimeter distance between your pupil centers. My Eyes provides an instant interactive digital camera PD tool, or you can measure it with a credit card and standard millimeter ruler.",
    tags: ["pd", "pupillary distance", "measurement", "camera tool"],
    fullAnswer: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>
          Pupillary Distance (PD) ensures that the optical center of each lens aligns perfectly with your line of sight. Incorrect PD can lead to eyestrain, headaches, or slight distortion.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
            <h5 className="font-bold text-xs text-amber-950 uppercase tracking-wider mb-1">Method 1: My Eyes Digital PD Tool</h5>
            <p className="text-xs text-amber-900">
              Use our built-in camera tool with any standard magnetic card for reference scale to get an exact millimeter measurement in 10 seconds.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-1">Method 2: Mirror &amp; Ruler</h5>
            <p className="text-xs text-slate-600">
              Stand 8 inches in front of a mirror, rest a millimeter ruler on the bridge of your nose, close your right eye and line up 0mm with your left pupil center, then read the mark on your right pupil.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "upload-prescription-slip",
    category: "prescription",
    categoryLabel: "Prescription & Optical Measurements",
    question: "Can I order glasses if I only have a photo of my doctor's prescription slip?",
    shortAnswer:
      "Yes! Simply upload a clear photo of your prescription slip during checkout. Our certified optical lab technicians verify every parameter before lens edging.",
    tags: ["upload slip", "doctor prescription", "optical check", "checkout"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          You do not need to decipher medical handwriting yourself. When ordering any prescription frame on <strong>MY EYES</strong>, choose the <em>&quot;Upload Prescription Slip&quot;</em> option.
        </p>
        <p>
          Our licensed opticians will inspect the image, verify cylindrical signs (+ vs -), check reading additions, and format the digital lens curve for custom edging. If anything is ambiguous, we contact you directly via WhatsApp before edging.
        </p>
      </div>
    ),
  },
  {
    id: "lens-types-single-progressive",
    category: "lenses",
    categoryLabel: "Lens Types, Blue Cut & Coatings",
    question: "What is the difference between Single Vision, Progressive, and Bifocal lenses?",
    shortAnswer:
      "Single Vision has one focal distance (distance or reading). Bifocals have a visible divider line for two fields. Progressives provide smooth, invisible multifocal transitions across distance, computer, and reading zones.",
    tags: ["single vision", "progressive", "bifocal", "reading glasses", "multifocal"],
    fullAnswer: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <div className="space-y-2">
          <p>
            <strong className="text-slate-900 font-semibold">1. Single Vision Lenses:</strong> Contain one single focal correction throughout the entire lens surface. Perfect for general everyday distance vision, driving, or dedicated close-up reading.
          </p>
          <p>
            <strong className="text-slate-900 font-semibold">2. Digital Free-Form Progressives (No Line):</strong> High-definition lenses with a smooth gradient across top (distance), middle (computer monitor 2–3 ft), and bottom (smartphone &amp; reading). No harsh image jump or visible line.
          </p>
          <p>
            <strong className="text-slate-900 font-semibold">3. Traditional Bifocals:</strong> Distinct segmented reading window with a visible horizontal line dividing distance and near vision.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All My Eyes progressive lenses are manufactured using German CNC digital surfacing technology for wide peripheral corridors.</span>
        </div>
      </div>
    ),
  },
  {
    id: "blue-cut-computer-lenses",
    category: "lenses",
    categoryLabel: "Lens Types, Blue Cut & Coatings",
    question: "What is Blue Defense / Blue Cut coating and who needs it?",
    shortAnswer:
      "Blue Cut filters harmful high-energy blue-violet light (415–455nm) from digital screens, laptops, and smartphones to reduce digital eyestrain, headaches, and sleep disruption.",
    tags: ["blue cut", "blue light", "computer glasses", "anti glare", "screen protection"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          Anyone spending 3+ hours daily in front of screens, coding, studying, or working under LED office lighting benefits immensely from <strong>Blue Defense</strong> lenses.
        </p>
        <p>
          Unlike cheap yellow-tinted computer glasses, My Eyes Blue Defense incorporates a selective nanocoating that blocks peak harmful blue frequencies while preserving true optical color clarity and maximum light transmittance.
        </p>
      </div>
    ),
  },
  {
    id: "photochromic-transitions-lenses",
    category: "lenses",
    categoryLabel: "Lens Types, Blue Cut & Coatings",
    question: "How do Sun-Adaptive / Photochromic (Transitions) lenses work in Pakistan's sunlight?",
    shortAnswer:
      "Sun-Adaptive lenses stay crystal clear indoors and rapidly darken to deep sunglasses tint when exposed to natural outdoor UV rays in 30–60 seconds.",
    tags: ["photochromic", "transitions", "sun adaptive", "uv400", "sunglasses"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          In Pakistan&apos;s intense sunlight, photochromic molecules embedded inside the lens matrix activate instantly upon contact with UV radiation, transforming into 100% UV400 protective sunglass lenses.
        </p>
        <p>
          When you step back indoors or into the shade, the lenses quickly fade back to clear. This eliminates the hassle of carrying two separate pairs of glasses (one optical and one sunglasses).
        </p>
      </div>
    ),
  },
  {
    id: "refractive-index-guide",
    category: "lenses",
    categoryLabel: "Lens Types, Blue Cut & Coatings",
    question: "Which lens refractive index (1.56, 1.61, 1.67, 1.74) should I choose for my power?",
    shortAnswer:
      "1.56 Standard for mild prescriptions (0 to ±2.50). 1.61 Slim for moderate (±2.75 to ±4.50). 1.67 Ultra-Thin for high (±4.75 to ±7.00). 1.74 Ultra-Slim for extreme powers (±7.25+).",
    tags: ["refractive index", "1.56", "1.61", "1.67", "1.74", "thin lenses", "high index"],
    fullAnswer: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>A higher refractive index bends light more efficiently, allowing the lens to be significantly thinner and lighter:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block font-bold text-slate-900">1.56 Mid Index</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">0.00 to ±2.50</span>
            <span className="block text-[10px] text-emerald-600 font-semibold mt-1">Standard</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block font-bold text-slate-900">1.61 Slim Index</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">±2.75 to ±4.50</span>
            <span className="block text-[10px] text-amber-600 font-semibold mt-1">20% Thinner</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block font-bold text-slate-900">1.67 Ultra-Thin</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">±4.75 to ±7.00</span>
            <span className="block text-[10px] text-indigo-600 font-semibold mt-1">35% Thinner</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block font-bold text-slate-900">1.74 High Index</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">±7.25 and above</span>
            <span className="block text-[10px] text-rose-600 font-semibold mt-1">50% Thinner</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "face-shape-matching-guide",
    category: "frames",
    categoryLabel: "Frame Selection & Face Shapes",
    question: "Which frame shape best suits my face shape (Oval, Round, Square, Heart, Diamond)?",
    shortAnswer:
      "Contrast is key: Round faces look best in rectangular & square frames; Square faces suit round & oval frames; Oval faces fit virtually any shape; Heart & Diamond faces suit aviators, rimless, and cat-eye frames.",
    tags: ["face shape", "oval", "round", "square", "heart", "diamond", "frame guide"],
    fullAnswer: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>The general aesthetic rule for eyewear is choosing a frame shape that contrasts with your facial contours:</p>
        <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 font-bold block mb-0.5">Round Face:</strong>
            <span>Angular, Rectangle, Square, and Geometric frames add definition and visually lengthen the face.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 font-bold block mb-0.5">Square / Strong Jaw:</strong>
            <span>Round, Oval, and curved Aviator frames soften sharp angles and balance jawlines.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 font-bold block mb-0.5">Heart Face:</strong>
            <span>Bottom-heavy or rimless frames, subtle Cat-Eye, and Wayfarers that balance a broader forehead.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-slate-900 font-bold block mb-0.5">Oval Face:</strong>
            <span>Universal harmony — looks flattering in nearly all frame silhouettes including Wayfarers and Aviators.</span>
          </div>
        </div>
        <p className="pt-1">
          Take our <strong>60-Second AI Style Quiz</strong> to automatically detect your ideal frame matches in real-time.
        </p>
      </div>
    ),
  },
  {
    id: "frame-sizing-numbers",
    category: "frames",
    categoryLabel: "Frame Selection & Face Shapes",
    question: "How do I know my frame size (e.g. 51-19-145 mm)?",
    shortAnswer:
      "Check the inside temple arm of any comfortable pair of glasses you own. You will see three numbers: [Lens Width]-[Bridge Width]-[Temple Arm Length] in millimeters.",
    tags: ["frame size", "measurements", "lens width", "bridge", "temple length"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>On almost every pair of eyeglasses, three measurements are stamped on the inside temple arm (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-xs text-slate-900">51 □ 19 145</code>):</p>
        <ul className="space-y-1.5 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <li><strong>Lens Width (e.g., 51 mm):</strong> Horizontal diameter of one lens.</li>
          <li><strong>Bridge Width (e.g., 19 mm):</strong> Distance between the two lenses across your nose bridge.</li>
          <li><strong>Temple Length (e.g., 145 mm):</strong> Length of the arm from the hinge to the tip behind your ear.</li>
        </ul>
        <p>If your numbers are within 2–3mm of our catalog frame specs, the fit will feel natural and secure.</p>
      </div>
    ),
  },
  {
    id: "delivery-timeline-pakistan",
    category: "shipping",
    categoryLabel: "Orders, Payment & Delivery in Pakistan",
    question: "How long does optical lens fitting and nationwide delivery take across Pakistan?",
    shortAnswer:
      "Ready-to-wear sunglasses and frames ship within 24 hours. Custom prescription and blue-cut glasses undergo optical lab edging and arrive in 2–4 business days via express courier.",
    tags: ["delivery", "shipping time", "pakistan", "karachi", "lahore", "islamabad", "tcs", "courier"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          Every custom prescription order undergoes precision CNC edging, centering verification, and optical quality inspection in our lab.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block">Major Metropolitan Hubs:</span>
            <span className="text-slate-600">Karachi, Lahore, Islamabad, Rawalpindi (2–3 business days).</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-900 block">Nationwide Cities &amp; Regions:</span>
            <span className="text-slate-600">Peshawar, Quetta, Multan, Faisalabad, Sialkot, Hyderabad &amp; all other districts (3–4 business days).</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "cod-advance-policy",
    category: "shipping",
    categoryLabel: "Orders, Payment & Delivery in Pakistan",
    question: "Why is a Rs. 500 advance deposit required for Cash on Delivery (COD) prescription orders?",
    shortAnswer:
      "Prescription lenses are permanently custom-cut to your specific optical powers and cannot be reused for anyone else. The Rs. 500 advance confirms your order and is deducted from your final doorstep COD balance.",
    tags: ["cod", "advance deposit", "cash on delivery", "500 advance", "payment"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          Unlike standard retail goods, prescription eyewear lenses are shaped specifically to your pupillary distance, spherical power, and astigmatism axis. Once edged, the lenses cannot be restocked or repurposed.
        </p>
        <p>
          The small <strong>Rs. 500 advance deposit</strong> covers initial optical lab materials. The remaining balance (e.g. Rs. 2,750 on a Rs. 3,250 order) is paid in cash directly to the courier rider upon delivery at your doorstep.
        </p>
      </div>
    ),
  },
  {
    id: "payment-methods-accepted",
    category: "shipping",
    categoryLabel: "Orders, Payment & Delivery in Pakistan",
    question: "What payment methods does My Eyes accept in Pakistan?",
    shortAnswer:
      "We accept Bank Transfers (Meezan, HBL, Alfalah), JazzCash, Easypaisa, Raast Instant Pay, and Cash on Delivery (COD).",
    tags: ["payment methods", "bank transfer", "jazzcash", "easypaisa", "raast", "cod"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>We provide instant, hassle-free Pakistani digital payment options:</p>
        <ul className="space-y-1 list-disc list-inside bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <li><strong>Raast Instant Payment / Bank Transfer:</strong> Direct zero-fee settlement with automatic transaction ID validation.</li>
          <li><strong>JazzCash &amp; Easypaisa:</strong> Instant mobile wallet transfers with digital QR code scanning.</li>
          <li><strong>Cash on Delivery (COD):</strong> Pay remaining balance to the courier rider at your door.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "warranty-guarantee-policy",
    category: "warranty",
    categoryLabel: "Warranty, Returns & Optical Guarantee",
    question: "What is the My Eyes Optical Accuracy Guarantee & 1-Year Lens Warranty?",
    shortAnswer:
      "We guarantee 100% prescription accuracy according to your submitted slip. In addition, all lenses include a 1-Year coating warranty against spontaneous peeling or delamination.",
    tags: ["warranty", "guarantee", "returns", "optical accuracy", "1 year warranty"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          We take optical health seriously. If your delivered lenses do not match the exact cylinder, sphere, or axis indicated on your doctor&apos;s prescription slip, we will remake and re-edge your lenses completely free of charge.
        </p>
        <p>
          Our <strong>1-Year Lens Warranty</strong> covers anti-reflective coating integrity and manufacturer defects under standard optical care.
        </p>
      </div>
    ),
  },
  {
    id: "return-exchange-policy",
    category: "warranty",
    categoryLabel: "Warranty, Returns & Optical Guarantee",
    question: "What is your 30-Day Return & Frame Exchange Policy?",
    shortAnswer:
      "If a frame does not fit comfortably, you can exchange it within 30 days of delivery. Contact our support team via WhatsApp for an effortless exchange.",
    tags: ["returns", "exchange", "30 day policy", "customer support"],
    fullAnswer: (
      <div className="space-y-2 text-slate-600 text-sm leading-relaxed">
        <p>
          We want you to feel confident in your look. If the frame size or style doesn&apos;t meet your expectations, notify our WhatsApp concierge team (+92 339 0103262) within 30 days.
        </p>
        <p>
          Frames must be in original condition with the protective case and microfiber cloth. We arrange a swift exchange for any alternative frame in our catalog.
        </p>
      </div>
    ),
  },
];

export default function FAQClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "read-prescription": true,
    "lens-types-single-progressive": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inQuestion = item.question.toLowerCase().includes(q);
      const inShort = item.shortAnswer.toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));

      return inQuestion || inShort || inTags;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 sm:pb-28">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-14 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff7a00_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-widest border border-white/10 backdrop-blur-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>AI-Powered Optical Knowledge Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Optical Guide &amp; <span className="text-[#ff7a00]">Eyewear FAQ</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about reading your optical prescription, choosing lens coatings, finding your face shape fit, and ordering custom eyewear in Pakistan.
          </p>

          {/* Realtime Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prescription reading, blue cut, PD tool, shipping times..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ff7a00] focus:bg-slate-900/90 transition-all shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/10 rounded-md cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Visual Optical Cheat Sheet Cards */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/quiz"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#ff7a00]/40 transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff7a00] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#ff7a00] transition-colors">
              Face Shape Style Quiz
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Find your ideal frame contours in 60 seconds with our algorithmic matcher.
            </p>
          </Link>

          <Link
            href="/pricing"
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#ff7a00]/40 transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Lens Pricing Guide
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Transparent rates for CR-39, Blue Defense, Sun-Adaptive, and 1.67 High Index.
            </p>
          </Link>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              100% Lab Accuracy
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every prescription lens is edged and checked by certified optical technicians.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Nationwide Delivery
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Express courier shipping across all cities and districts in Pakistan.
            </p>
          </div>
        </div>
      </section>

      {/* Main FAQ Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Category Filter Pills (Desktop Sticky Sidebar + Mobile Scrollable) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Browse by Topic
              </h3>
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "All Questions", icon: HelpCircle },
                  { id: "prescription", label: "Prescription & Measurements", icon: Ruler },
                  { id: "lenses", label: "Lenses, Blue Cut & Index", icon: Eye },
                  { id: "frames", label: "Frames & Face Shapes", icon: Glasses },
                  { id: "shipping", label: "Delivery & Payment (PK)", icon: Truck },
                  { id: "warranty", label: "Warranty & Returns", icon: ShieldCheck },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap lg:whitespace-normal cursor-pointer",
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 bg-white lg:bg-transparent border border-slate-200/60 lg:border-transparent"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#ff7a00]" : "text-slate-400")} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Need Direct Optical Assistance Box */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Phone className="w-4 h-4 text-[#ff7a00]" />
                <span>Need Personal Optical Guidance?</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Have a complex prescription, high cylindrical power, or want custom lens advice? Our optical concierge is ready to assist you on WhatsApp.
              </p>
              <a
                href="https://wa.me/923390103262"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                <span>WhatsApp Optician</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>

          {/* Questions Accordion List */}
          <main className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedCategory === "all" ? "Frequently Asked Questions" : FAQ_DATA.find((f) => f.category === selectedCategory)?.categoryLabel}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}
              </span>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">No matching optical questions found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching with different keywords like &quot;blue cut&quot;, &quot;prescription&quot;, or &quot;delivery&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = !!openItems[faq.id];
                  return (
                    <div
                      key={faq.id}
                      className={cn(
                        "rounded-2xl border transition-all duration-200 overflow-hidden bg-white",
                        isOpen
                          ? "border-slate-300 shadow-sm"
                          : "border-slate-200/80 hover:border-slate-300"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(faq.id)}
                        className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff7a00]">
                            {faq.categoryLabel}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {faq.question}
                          </h3>
                        </div>
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 transition-transform duration-200 mt-1",
                            isOpen && "rotate-180 bg-slate-900 text-white"
                          )}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
                          {faq.fullAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
