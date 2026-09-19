import type { Metadata } from "next";
import FAQClient, { FAQ_DATA } from "./FAQClient";

export const metadata: Metadata = {
  title: "Optical FAQ & Eyewear Guide | Prescription, Lenses, Face Shapes",
  description:
    "Explore the My Eyes Pakistan Optical FAQ & Eyewear Guide. Learn how to read optical prescriptions (SPH, CYL, AXIS, PD), choose Blue Cut & progressive lenses, match frames to your face shape, and order nationwide.",
  keywords: [
    "how to read prescription glasses Pakistan",
    "blue cut vs normal lenses",
    "progressive lenses online Pakistan",
    "pupillary distance measurement",
    "face shape frame guide",
    "photochromic transition lenses Pakistan",
    "prescription glasses COD Pakistan",
    "My Eyes FAQ",
  ],
  alternates: {
    canonical: "https://myeyes.pk/faq",
  },
  openGraph: {
    title: "Optical FAQ & Eyewear Guide | MY EYES Pakistan",
    description:
      "Expert optical guide: prescription reading, blue light defense, face shape matching, and custom lens fitting delivered nationwide in Pakistan.",
    url: "https://myeyes.pk/faq",
    siteName: "MY EYES Optical Studio",
    images: [
      {
        url: "https://myeyes.pk/icon-192x192.png",
        width: 192,
        height: 192,
        alt: "MY EYES Optical Studio Guide",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Optical FAQ & Eyewear Guide | MY EYES Pakistan",
    description:
      "Expert optical answers for prescription reading, blue cut lenses, face shape styling, and nationwide delivery.",
  },
};

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.shortAnswer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient />
    </>
  );
}
