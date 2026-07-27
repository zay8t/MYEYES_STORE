const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting PostgreSQL data import...");

  const backupPath = path.join(__dirname, "../prisma/backup.json");
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}. Run export-sqlite.js first.`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const {
    products = [],
    orders = [],
    orderItems = [],
    prescriptions = [],
    lensOptions = [],
    lensPrices = [],
    orderSequences = [],
  } = backupData;

  console.log(`Loaded from backup:`);
  console.log(`- ${products.length} Products`);
  console.log(`- ${orders.length} Orders`);
  console.log(`- ${orderItems.length} OrderItems`);
  console.log(`- ${prescriptions.length} Prescriptions`);
  console.log(`- ${lensOptions.length} LensOptions`);
  console.log(`- ${lensPrices.length} LensPrices`);
  console.log(`- ${orderSequences.length} OrderSequences`);

  // Clear target tables first to prevent duplicates / constraints conflicts
  // We delete in order of dependency: OrderItem -> Order, Prescription, Product, LensOption, LensPrice, OrderSequence
  console.log("Clearing target tables...");
  await prisma.orderItem.deleteMany().catch(e => console.log("OrderItem delete skipped or empty"));
  await prisma.order.deleteMany().catch(e => console.log("Order delete skipped or empty"));
  await prisma.prescription.deleteMany().catch(e => console.log("Prescription delete skipped or empty"));
  await prisma.product.deleteMany().catch(e => console.log("Product delete skipped or empty"));
  await prisma.lensOption.deleteMany().catch(e => console.log("LensOption delete skipped or empty"));
  await prisma.lensPrice.deleteMany().catch(e => console.log("LensPrice delete skipped or empty"));
  await prisma.orderSequence.deleteMany().catch(e => console.log("OrderSequence delete skipped or empty"));

  // Import products
  console.log("Importing products...");
  for (const item of products) {
    await prisma.product.create({
      data: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        stock: item.stock,
        frameShape: item.frameShape,
        material: item.material,
        gender: item.gender,
        images: item.images,
        category: item.category,
        featured: item.featured,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // Import prescriptions
  console.log("Importing prescriptions...");
  for (const item of prescriptions) {
    await prisma.prescription.create({
      data: {
        id: item.id,
        lensType: item.lensType,
        odSph: item.odSph,
        odCyl: item.odCyl,
        odAxis: item.odAxis,
        osSph: item.osSph,
        osCyl: item.osCyl,
        osAxis: item.osAxis,
        pd: item.pd,
        fileUrl: item.fileUrl,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // Import orders
  console.log("Importing orders...");
  for (const item of orders) {
    await prisma.order.create({
      data: {
        id: item.id,
        orderNumber: item.orderNumber,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone,
        shippingAddress: item.shippingAddress,
        shippingCity: item.shippingCity,
        paymentMethod: item.paymentMethod,
        transactionProofUrl: item.transactionProofUrl,
        shippingFee: item.shippingFee,
        stripeSessionId: item.stripeSessionId,
        totalAmount: item.totalAmount,
        status: item.status,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // Import order items
  console.log("Importing order items...");
  for (const item of orderItems) {
    await prisma.orderItem.create({
      data: {
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        prescriptionId: item.prescriptionId,
        price: item.price,
        quantity: item.quantity,
      },
    });
  }

  // Import lens options
  console.log("Importing lens options...");
  for (const item of lensOptions) {
    await prisma.lensOption.create({
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        type: item.type,
        index: item.index,
        createdAt: new Date(item.createdAt),
      },
    });
  }

  // Import lens prices
  console.log("Importing lens prices...");
  for (const item of lensPrices) {
    await prisma.lensPrice.create({
      data: {
        id: item.id,
        category: item.category,
        name: item.name,
        price: item.price,
        description: item.description,
        index: item.index,
        isPopular: item.isPopular,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  // Import order sequences
  console.log("Importing order sequences...");
  for (const item of orderSequences) {
    await prisma.orderSequence.create({
      data: {
        id: item.id,
        lastValue: item.lastValue,
        updatedAt: new Date(item.updatedAt),
      },
    });
  }

  console.log("PostgreSQL import completed successfully!");

  // Validate row counts
  const targetProductsCount = await prisma.product.count();
  const targetOrdersCount = await prisma.order.count();
  console.log(`Validation row counts:`);
  console.log(`- Products: ${targetProductsCount} (expected: ${products.length})`);
  console.log(`- Orders: ${targetOrdersCount} (expected: ${orders.length})`);

  if (targetProductsCount !== products.length || targetOrdersCount !== orders.length) {
    console.warn("Row count mismatch warning! Please verify data manually.");
  } else {
    console.log("All counts match perfectly!");
  }
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
