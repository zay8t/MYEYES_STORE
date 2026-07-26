const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        name: "Onyx Minimalist Titanium",
        slug: "onyx-minimalist-titanium",
        description: "Ultra-lightweight aerospace titanium optical frame with matte black finish.",
        price: 4999,
        stock: 15,
        frameShape: "RECTANGLE",
        material: "TITANIUM",
        gender: "Men",
        images: JSON.stringify(["/logo.png"]),
        category: "EYEGLASSES",
        featured: true,
      },
      {
        name: "Luxe Gold Browline",
        slug: "luxe-gold-browline",
        description: "Classic 24K gold plated browline frame crafted from premium acetate & metal.",
        price: 5499,
        stock: 12,
        frameShape: "SQUARE",
        material: "HYBRID",
        gender: "Unisex",
        images: JSON.stringify(["/logo.png"]),
        category: "EYEGLASSES",
        featured: true,
      },
      {
        name: "Rose Gold Cat-Eye Luxe",
        slug: "rose-gold-cat-eye-luxe",
        description: "Feminine cat-eye design with rose gold titanium hardware.",
        price: 5999,
        stock: 8,
        frameShape: "CAT_EYE",
        material: "TITANIUM",
        gender: "Women",
        images: JSON.stringify(["/logo.png"]),
        category: "EYEGLASSES",
        featured: true,
      },
      {
        name: "Aviator Dark Polarized",
        slug: "aviator-dark-polarized",
        description: "Iconic teardrop aviator sunglasses with UV400 dark polarized lenses.",
        price: 4299,
        stock: 20,
        frameShape: "AVIATOR",
        material: "STAINLESS_STEEL",
        gender: "Men",
        images: JSON.stringify(["/logo.png"]),
        category: "SUNGLASSES",
        featured: true,
      },
      {
        name: "Wayfarer Classic Polarized",
        slug: "wayfarer-classic-polarized",
        description: "Timeless wayfarer shape in high-durability TR90 flexible polymer.",
        price: 3899,
        stock: 18,
        frameShape: "WAYFARER",
        material: "TR90",
        gender: "Unisex",
        images: JSON.stringify(["/logo.png"]),
        category: "SUNGLASSES",
        featured: true,
      },
      {
        name: "Junior Flexible Eyeglasses",
        slug: "junior-flexible-eyeglasses",
        description: "Super flexible, impact-resistant TR90 optical glasses engineered for kids.",
        price: 3299,
        stock: 14,
        frameShape: "ROUND",
        material: "TR90",
        gender: "Kids",
        images: JSON.stringify(["/logo.png"]),
        category: "EYEGLASSES",
        featured: true,
      },
    ],
  });

  console.log("Database seeded successfully with initial optical products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
