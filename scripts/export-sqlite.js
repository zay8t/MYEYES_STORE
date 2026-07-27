const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting SQLite data export...");

  // Fetch all data from all models
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} Products`);

  const orders = await prisma.order.findMany();
  console.log(`Found ${orders.length} Orders`);

  const orderItems = await prisma.orderItem.findMany();
  console.log(`Found ${orderItems.length} OrderItems`);

  const prescriptions = await prisma.prescription.findMany();
  console.log(`Found ${prescriptions.length} Prescriptions`);

  const lensOptions = await prisma.lensOption.findMany();
  console.log(`Found ${lensOptions.length} LensOptions`);

  const lensPrices = await prisma.lensPrice.findMany();
  console.log(`Found ${lensPrices.length} LensPrices`);

  const orderSequences = await prisma.orderSequence.findMany();
  console.log(`Found ${orderSequences.length} OrderSequences`);

  const backupData = {
    products,
    orders,
    orderItems,
    prescriptions,
    lensOptions,
    lensPrices,
    orderSequences,
  };

  const backupPath = path.join(__dirname, "../prisma/backup.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`SQLite data successfully exported to ${backupPath}`);
}

main()
  .catch((e) => {
    console.error("Export failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
