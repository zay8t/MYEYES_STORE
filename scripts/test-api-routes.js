const http = require("http");

function request(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING API ENDPOINT TESTS ===");

  const baseUrl = "http://localhost:3000/api/admin/products";

  // 1. GET ALL
  console.log("\n1. Testing GET /api/admin/products...");
  const listRes = await request(baseUrl, { method: "GET" });
  console.log(`Status: ${listRes.statusCode}`);
  console.log(`Product list length: ${Array.isArray(listRes.data) ? listRes.data.length : typeof listRes.data}`);

  // 2. POST CREATE
  console.log("\n2. Testing POST /api/admin/products...");
  const testProduct = {
    name: "API Test Frame " + Date.now(),
    description: "Ultra-premium testing frame",
    price: 3499.00,
    stock: 5,
    frameShape: "AVIATOR",
    material: "TITANIUM",
    gender: "Men",
    images: ["/logo.png"],
    featured: false,
    category: "SUNGLASSES",
  };
  const createRes = await request(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, testProduct);
  console.log(`Status: ${createRes.statusCode}`);
  console.log("Created Product Data:", JSON.stringify(createRes.data, null, 2));

  if (createRes.statusCode !== 201 || !createRes.data || !createRes.data.id) {
    throw new Error("Failed to create product!");
  }

  const newId = createRes.data.id;

  // 3. PATCH UPDATE
  console.log(`\n3. Testing PATCH /api/admin/products/${newId}...`);
  const patchData = {
    price: 3999.00,
    stock: 8,
    frameShape: "RECTANGLE",
    material: "METAL",
    gender: "Unisex",
  };
  const patchRes = await request(`${baseUrl}/${newId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  }, patchData);
  console.log(`Status: ${patchRes.statusCode}`);
  console.log("Updated Product Data:", JSON.stringify(patchRes.data, null, 2));

  if (patchRes.statusCode !== 200 || patchRes.data.price !== 3999 || patchRes.data.frameShape !== "RECTANGLE" || patchRes.data.material !== "METAL") {
    throw new Error("Failed to patch product or fields did not update!");
  }

  // 4. DELETE
  console.log(`\n4. Testing DELETE /api/admin/products/${newId}...`);
  const deleteRes = await request(`${baseUrl}/${newId}`, { method: "DELETE" });
  console.log(`Status: ${deleteRes.statusCode}`);
  console.log("Deleted response:", JSON.stringify(deleteRes.data, null, 2));

  if (deleteRes.statusCode !== 200 || !deleteRes.data.success) {
    throw new Error("Failed to delete product!");
  }

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
