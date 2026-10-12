const http = require('http');

const APPROVED_CATEGORIES = [
  "T-Shirts",
  "Hoodies",
  "Cargo Pants",
  "Sneakers",
  "Caps"
];

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("==================================================");
  console.log("  BAD TEDDY CATEGORY SYSTEM FULL VERIFICATION");
  console.log("==================================================\n");

  let allPassed = true;

  // 1. PHP Products API
  console.log("1. Testing PHP Products API for All 5 Categories:");
  const baseProductsRes = await fetchJson("http://127.0.0.1/BAD%20TEDDY/backend/api/products.php");
  if (baseProductsRes.data && baseProductsRes.data.success) {
    const products = baseProductsRes.data.products;
    console.log(`   [PASS] Total products in catalog: ${products.length}`);
    const distinctCategories = [...new Set(products.map(p => p.category))];
    console.log(`   [INFO] Found categories in catalog: ${JSON.stringify(distinctCategories)}`);
    
    // Check if any unexpected categories exist
    const invalidCats = distinctCategories.filter(c => !APPROVED_CATEGORIES.includes(c));
    if (invalidCats.length > 0) {
      console.log(`   [FAIL] Found unapproved categories in database: ${JSON.stringify(invalidCats)}`);
      allPassed = false;
    } else {
      console.log(`   [PASS] All database categories belong strictly to the 5 approved categories!`);
    }

    // Test filtering by each category
    for (const cat of APPROVED_CATEGORIES) {
      const catRes = await fetchJson(`http://127.0.0.1/BAD%20TEDDY/backend/api/products.php?category=${encodeURIComponent(cat)}`);
      if (catRes.data && catRes.data.success) {
        console.log(`   [PASS] Filter '?category=${cat}': returned ${catRes.data.products.length} product(s)`);
      } else {
        console.log(`   [FAIL] Filter '?category=${cat}' failed`);
        allPassed = false;
      }
    }
  } else {
    console.log("   [FAIL] Could not connect to PHP products API");
    allPassed = false;
  }

  // 2. AI Recommendation Service
  console.log("\n2. Testing AI Recommendation Microservice (FastAPI):");
  const recRes = await fetchJson("http://127.0.0.1:5000/api/recommendations?limit=5");
  if (recRes.data && recRes.data.success) {
    console.log(`   [PASS] AI Recommendations returned ${recRes.data.recommendations.length} items.`);
    recRes.data.recommendations.forEach(p => {
      console.log(`          - ID ${p.id}: "${p.name}" (Category: ${p.category})`);
    });
  } else {
    console.log("   [FAIL] AI Recommendations endpoint failed");
    allPassed = false;
  }

  // 3. AI Chatbot Category Extraction & Recommendations
  console.log("\n3. Testing AI Chatbot Category Intelligence:");
  const testChatQueries = [
    { query: "show me your hoodies", expectedCategory: "Hoodies" },
    { query: "do you have cargo pants?", expectedCategory: "Cargo Pants" },
    { query: "recommend some caps for me", expectedCategory: "Caps" },
    { query: "show me oversized t-shirts", expectedCategory: "T-Shirts" }
  ];

  for (const t of testChatQueries) {
    const chatRes = await fetchJson("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { message: t.query }
    });
    if (chatRes.data && chatRes.data.success) {
      const extracted = chatRes.data.extracted_slots?.category;
      const recs = chatRes.data.recommended_products || [];
      const match = extracted === t.expectedCategory;
      console.log(`   [${match ? 'PASS' : 'WARN'}] Query: "${t.query}" -> Extracted: "${extracted}" | Recs: ${recs.length}`);
      if (!match) allPassed = false;
    } else {
      console.log(`   [FAIL] Chatbot endpoint error for "${t.query}"`);
      allPassed = false;
    }
  }

  // 4. Admin AI Insights
  console.log("\n4. Testing Admin AI Performance & Demand Categories:");
  const adminAiRes = await fetchJson("http://127.0.0.1:5000/api/admin/demand-forecast");
  if (adminAiRes.data && (adminAiRes.data.products || adminAiRes.data.summary)) {
    console.log(`   [PASS] Demand Forecast analyzed ${adminAiRes.data.products?.length || 0} live catalog products across all categories.`);
    const catsInForecast = [...new Set(adminAiRes.data.products.map(p => p.category))];
    console.log(`   [PASS] Categories present in demand forecast: ${JSON.stringify(catsInForecast)}`);
  } else {
    console.log("   [FAIL] Admin AI demand forecast failed");
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(allPassed ? "  ALL CATEGORY VERIFICATIONS PASSED SUCCESSFULLY!" : "  SOME VERIFICATIONS FAILED!");
  console.log("==================================================");
}

runVerification().catch(err => {
  console.error("Verification error:", err);
});
