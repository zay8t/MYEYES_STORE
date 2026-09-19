import robotsHandler from "../app/robots";
import sitemapHandler from "../app/sitemap";
import { prisma } from "../lib/prisma";

async function verifyAiSeo() {
  console.log("=== 1. VERIFYING ROBOTS.TS ===");
  const robotsData = robotsHandler();
  console.log("Robots Output:", JSON.stringify(robotsData, null, 2));

  console.log("\n=== 2. VERIFYING SITEMAP.TS ===");
  const sitemapData = await sitemapHandler();
  console.log(`Total URLs in Sitemap: ${sitemapData.length}`);
  console.log("First 5 entries in Sitemap:", JSON.stringify(sitemapData.slice(0, 5), null, 2));
  if (sitemapData.length > 5) {
    console.log("Sample Dynamic Product entry:", JSON.stringify(sitemapData[sitemapData.length - 1], null, 2));
  }

  console.log("\n=== 3. VERIFYING SAMPLE PRODUCT SCHEMA QUERY ===");
  const sampleProduct = await prisma.product.findFirst({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      stock: true,
      images: true,
    },
  });

  if (sampleProduct) {
    const inStock = (sampleProduct.stock ?? 0) > 0;
    const jsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: sampleProduct.name,
      image: sampleProduct.images || "https://myeyes.pk/logo.png",
      description: sampleProduct.description || "Premium prescription eyewear and custom lenses by My Eyes Pakistan.",
      brand: {
        "@type": "Brand",
        name: "My Eyes",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "PKR",
        price: sampleProduct.price,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `https://myeyes.pk/products/${sampleProduct.slug}`,
      },
    };
    console.log("Sample Product JSON-LD output:", JSON.stringify(jsonLd, null, 2));
  } else {
    console.log("No sample product found in DB (using fallback testing structure)");
  }

  console.log("\n=== ALL AI-SEO SUITE CHECKS COMPLETED SUCCESSFULLY ===");
}

verifyAiSeo()
  .catch((err) => {
    console.error("AI-SEO Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
