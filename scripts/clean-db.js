const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;
  for (const product of products) {
    if (
      !product.images ||
      product.images.includes("unsplash") ||
      product.images.includes("http://") ||
      product.images.includes("https://")
    ) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: JSON.stringify(["/logo.png"]),
        },
      });
      updatedCount++;
    }
  }

  console.log(`Cleaned ${updatedCount} products with external online image links.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
