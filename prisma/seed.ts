import { PrismaClient, FrameShape, Material, Category } from "@prisma/client";

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: "Lahore Titanium Minimalist",
    slug: "lahore-titanium-minimalist",
    description: "Ultra-lightweight Japanese grade-5 titanium frame with precision hinges and matte obsidian finish.",
    price: 3450,
    stock: 25,
    frameShape: FrameShape.ROUND,
    material: Material.TITANIUM,
    gender: "UNISEX",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.EYEGLASSES,
    featured: true,
  },
  {
    name: "Karachi Heritage Aviator",
    slug: "karachi-heritage-aviator",
    description: "Classic teardrop aviator silhouette engineered with flexible nose pads and anti-glare sun coating.",
    price: 4200,
    stock: 18,
    frameShape: FrameShape.AVIATOR,
    material: Material.STAINLESS_STEEL,
    gender: "UNISEX",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.SUNGLASSES,
    featured: true,
  },
  {
    name: "Islamabad Bio-Acetate Square",
    slug: "islamabad-bio-acetate-square",
    description: "Handcrafted Italian bio-acetate optical frame with rich tortoiseshell finish and spring hinges.",
    price: 3800,
    stock: 30,
    frameShape: FrameShape.SQUARE,
    material: Material.ACETATE,
    gender: "UNISEX",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.EYEGLASSES,
    featured: true,
  },
  {
    name: "Rawalpindi Polarized Sun",
    slug: "rawalpindi-polarized-sun",
    description: "Heavy-duty UV400 polarized sunglasses with gradient gray tint and scratch-resistant coating.",
    price: 2950,
    stock: 22,
    frameShape: FrameShape.RECTANGLE,
    material: Material.ACETATE,
    gender: "MEN",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.SUNGLASSES,
    featured: true,
  },
  {
    name: "Peshawar Cat-Eye Elegance",
    slug: "peshawar-cat-eye-elegance",
    description: "Sleek cat-eye frame designed for effortless sophistication and crystal-clear vision.",
    price: 3600,
    stock: 15,
    frameShape: FrameShape.CAT_EYE,
    material: Material.ACETATE,
    gender: "WOMEN",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.EYEGLASSES,
    featured: true,
  },
  {
    name: "Quetta Matte Black Round",
    slug: "quetta-matte-black-round",
    description: "Architectural round optical frame with sleek matte black stainless steel arms.",
    price: 3200,
    stock: 20,
    frameShape: FrameShape.ROUND,
    material: Material.STAINLESS_STEEL,
    gender: "UNISEX",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80",
    ]),
    category: Category.EYEGLASSES,
    featured: false,
  },
];

async function main() {
  console.log("Seeding database...");

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: prod,
      create: prod,
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
