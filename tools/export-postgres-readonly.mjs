import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;

async function runExport() {
  const outputDir = path.resolve(process.argv[2] || "./myeyes-db-export");

  // 1. Resolve database URL
  let connUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connUrl) {
    console.error("Error: Neither DIRECT_URL nor DATABASE_URL found in environment.");
    process.exit(1);
  }

  // Ensure normal postgres protocol
  if (connUrl.startsWith("prisma://")) {
    if (process.env.DIRECT_URL && !process.env.DIRECT_URL.startsWith("prisma://")) {
      connUrl = process.env.DIRECT_URL;
    } else {
      console.error(
        "Error: Connection URL is a Prisma Accelerate URL (prisma://). A direct postgresql:// or postgres:// connection is required."
      );
      process.exit(1);
    }
  }

  if (!connUrl.startsWith("postgres://") && !connUrl.startsWith("postgresql://")) {
    console.error(
      `Error: Expected a postgresql:// or postgres:// connection URL, got: ${connUrl.split("://")[0]}://`
    );
    process.exit(1);
  }

  // Parse URL safely for display without leaking credentials
  let sanitizedDbInfo = "PostgreSQL Database";
  try {
    const parsed = new URL(connUrl);
    sanitizedDbInfo = `${parsed.protocol}//***@${parsed.host}${parsed.pathname}`;
  } catch {
    // fallback
  }

  console.log("=================================================");
  console.log(" My Eyes Eyewear Store — PostgreSQL Export Tool  ");
  console.log(" Mode: READ-ONLY Configuration & Catalog Snapshot");
  console.log("=================================================");
  console.log(`Connecting to: ${sanitizedDbInfo}`);
  console.log(`Target directory: ${outputDir}`);

  // 2. Prepare output directory & verify no overwrite
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 3. Connect to PostgreSQL
  const client = new Client({
    connectionString: connUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    // Enforce read-only session
    await client.query("SET default_transaction_read_only = ON;");
    console.log("Database connection established (read-only mode verified).");
  } catch (err) {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  }

  // 4. Discover existing tables in public schema
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));

  // Required model-to-table resolution
  const targetSpecs = [
    {
      modelName: "Product",
      candidates: ["Product", "product", "products"],
      description: "All products with media IDs, model URLs, colors, stock, and pricing",
    },
    {
      modelName: "LensOption",
      candidates: ["LensOption", "lens_option", "lens_options", "lensoption"],
      description: "Lens options including hidden/lab-only options and pricePlus40 values",
    },
    {
      modelName: "LensPrice",
      candidates: ["LensPrice", "lens_price", "lens_prices", "lensprice"],
      description: "Lens pricing matrix across categories and refractive indices",
    },
    {
      modelName: "BasePriceSetting",
      candidates: ["BasePriceSetting", "base_price_setting", "base_price_settings"],
      description: "Base price settings (P1-P4, tier-two keys, raw settings)",
    },
    {
      modelName: "DiscountCode",
      candidates: ["discount_codes", "DiscountCode", "discount_code", "discountcodes"],
      description: "Discount rules, promo codes, inactive/scheduled campaigns, and badge settings",
    },
  ];

  // 5. Check if output files already exist (refuse to overwrite)
  const existingOutputFiles = [];
  for (const spec of targetSpecs) {
    const filePath = path.join(outputDir, `${spec.modelName}.json`);
    if (fs.existsSync(filePath)) {
      existingOutputFiles.push(filePath);
    }
  }
  const manifestPath = path.join(outputDir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    existingOutputFiles.push(manifestPath);
  }

  if (existingOutputFiles.length > 0) {
    console.error("\nRefusing to overwrite existing files:");
    for (const f of existingOutputFiles) {
      console.error(` - ${f}`);
    }
    console.error("\nPlease remove the existing directory or specify a new output folder.\n");
    await client.end();
    process.exit(1);
  }

  // 6. Query and export each table
  const manifest = {
    exportVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    database: sanitizedDbInfo,
    readOnly: true,
    excludedTables: [
      "User",
      "Order",
      "OrderItem",
      "Prescription",
      "saved_prescriptions",
      "addresses",
      "reviews",
      "PaymentAuditLog",
      "Lead",
      "admin_push_subscriptions",
      "order_sequences",
      "OrderSequence",
    ],
    tables: {},
  };

  console.log("\nExporting authoritative configuration tables...");

  for (const spec of targetSpecs) {
    const matchedTable = spec.candidates.find((name) => existingTables.has(name));

    if (!matchedTable) {
      console.warn(`[WARN] Table for ${spec.modelName} not found in database! (Checked: ${spec.candidates.join(", ")})`);
      manifest.tables[spec.modelName] = {
        status: "NOT_FOUND",
        rows: 0,
        description: spec.description,
      };
      continue;
    }

    console.log(` -> Exporting "${matchedTable}" as ${spec.modelName}.json...`);
    const query = `SELECT * FROM "${matchedTable}";`;
    const res = await client.query(query);

    const targetJsonPath = path.join(outputDir, `${spec.modelName}.json`);
    const jsonContent = JSON.stringify(res.rows, null, 2);
    fs.writeFileSync(targetJsonPath, jsonContent, "utf8");

    const hash = crypto.createHash("sha256").update(jsonContent).digest("hex");
    const stat = fs.statSync(targetJsonPath);

    manifest.tables[spec.modelName] = {
      status: "SUCCESS",
      sourceTable: matchedTable,
      rowCount: res.rows.length,
      file: `${spec.modelName}.json`,
      sizeBytes: stat.size,
      sha256: hash,
      description: spec.description,
    };

    console.log(`    Successfully saved ${res.rows.length} rows (${(stat.size / 1024).toFixed(2)} KB).`);
  }

  // 7. Write manifest.json
  const manifestContent = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(manifestPath, manifestContent, "utf8");
  console.log(`\nManifest generated at: ${manifestPath}`);

  await client.end();
  console.log("\nExport completed successfully!");
}

runExport().catch((err) => {
  console.error("Export process failed:", err);
  process.exit(1);
});
