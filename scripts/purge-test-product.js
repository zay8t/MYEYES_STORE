const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Searching and purging test frame product from database...");

  try {
    const deleted = await prisma.product.deleteMany({
      where: {
        OR: [
          { name: { contains: "Test Precision Frame", mode: "insensitive" } },
          { slug: "my-eyes-test-precision-frame" },
          { description: { contains: "Test product to verify persistent Render PostgreSQL", mode: "insensitive" } }
        ]
      }
    });

    console.log(`Successfully purged ${deleted.count} test product record(s) from database.`);
  } catch (error) {
    console.error("Purge error (DB might be offline):", error.message);
  }
}

main()
  .catch((e) => {
    console.error("Failed to purge test product:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
