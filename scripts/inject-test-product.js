const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking if test product exists...");
  
  const slug = "my-eyes-test-precision-frame";
  const existing = await prisma.product.findUnique({
    where: { slug }
  });
  
  if (existing) {
    console.log("Test product already exists. Skipping injection.");
    return;
  }
  
  console.log("Injecting test product...");
  const product = await prisma.product.create({
    data: {
      name: "MY EYES Test Precision Frame",
      slug: slug,
      description: "Test product to verify persistent Render PostgreSQL storage and Cloudinary CDN rendering.",
      price: 2500,
      stock: 10,
      frameShape: "RECTANGLE",
      material: "TITANIUM",
      gender: "Men",
      images: JSON.stringify(["/placeholder-frame.png"]),
      category: "EYEGLASSES",
      featured: true,
      image_url: "/placeholder-frame.png",
      image_public_id: "placeholder"
    }
  });
  
  console.log("Test product injected successfully:", product.id);
}

main()
  .catch((e) => {
    console.error("Failed to inject test product:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
