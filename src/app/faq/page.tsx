import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optical Guides & FAQs - My Eyes Pakistan',
  description: 'Learn how to read your prescription (SPH, CYL, Axis), find frames for your face shape, and understand custom lens manufacturing at My Eyes Pakistan.',
};

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I read my optical prescription (SPH, CYL, Axis)?",
      answer: "Your prescription typically includes SPH (Sphere for nearsightedness or farsightedness), CYL (Cylinder for astigmatism), and Axis (the orientation of astigmatism correction). You can easily upload a photo of your prescription during checkout at My Eyes, and our precision lab will handle the exact measurements."
    },
    {
      question: "What are transition or auto-darkening lenses?",
      answer: "Transition lenses automatically darken when exposed to UV sunlight outdoors and return to a completely clear state indoors. They provide continuous UV protection and convenience without needing a separate pair of prescription sunglasses."
    },
    {
      question: "How does the custom lens manufacturing and advance policy work in Pakistan?",
      answer: "Because precision prescription lenses are custom-crafted specifically for your unique vision parameters, My Eyes requires a 25% advance deposit to queue workshop edging, with the remaining balance collected via doorstep Cash on Delivery (COD) across Pakistan."
    },
    {
      question: "How do I choose the right frame size and shape for my face?",
      answer: "As a general rule of thumb, select frame shapes that contrast with your facial structure—for example, angular square frames balance round faces, while round or oval frames soften sharp jawlines. Check our catalog filters on myeyes.pk to sort by style and dimensions."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqs || []).map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#111' }}>
        Optical Guides & Frequently Asked Questions
      </h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        Everything you need to know about ordering precision prescription eyewear online in Pakistan with My Eyes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Array.isArray(faqs) && faqs.map((faq, index) => (
          <div key={index} style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
              {faq.question}
            </h3>
            <p style={{ color: '#444', lineHeight: '1.6', fontSize: '15px' }}>
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
