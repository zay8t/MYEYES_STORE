import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "@/components/product/ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

function parsePrimaryImage(imagesStr?: string | null): string {
  if (!imagesStr) return "https://myeyes.pk/placeholder-frame.png";
  try {
    let parsed: string[] = [];
    if (imagesStr.startsWith("[")) {
      parsed = JSON.parse(imagesStr);
    } else {
      parsed = imagesStr.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const sanitized = parsed.map((img) => (img === "/logo.png" || !img ? "https://myeyes.pk/placeholder-frame.png" : img.startsWith("http") ? img : `https://myeyes.pk${img.startsWith("/") ? "" : "/"}${img}`));
    return sanitized[0] || "https://myeyes.pk/placeholder-frame.png";
  } catch {
    return imagesStr.startsWith("http") ? imagesStr : `https://myeyes.pk${imagesStr.startsWith("/") ? "" : "/"}${imagesStr}`;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested eyewear frame could not be found.",
    };
  }

  const primaryImage = parsePrimaryImage(product.images);
  const title = `${product.name} | MY EYES Optical Studio`;
  const description =
    product.description ||
    `Order ${product.name} with custom precision prescription lenses or polarized sun tints from My Eyes Pakistan.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://myeyes.pk/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://myeyes.pk/products/${product.slug}`,
      siteName: "MY EYES",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return notFound();
  }

  const inStock = (product.stock ?? 0) > 0;
  const primaryImage = parsePrimaryImage(product.images);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: primaryImage || "https://myeyes.pk/logo.png",
    description:
      product.description ||
      "Premium prescription eyewear and custom lenses by My Eyes Pakistan.",
    brand: {
      "@type": "Brand",
      name: "My Eyes",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://myeyes.pk/products/${product.slug}`,
    },
  };

  const clientProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock: product.stock,
    frameShape: product.frameShape,
    material: product.material,
    gender: product.gender,
    images: product.images,
    category: product.category,
    featured: product.featured,
    modelGlbUrl: product.modelGlbUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={clientProduct} slug={slug} />
    </>
  );
}
