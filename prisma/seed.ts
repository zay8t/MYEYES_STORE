import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Production seed — no mock products.
 * Use the Admin Portal to add real products.
 */
async function main() {
  console.log("Database ready — no mock data seeded.");
  console.log("Add products via the Admin Portal at /admin/products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
