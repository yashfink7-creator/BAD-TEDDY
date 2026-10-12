// test_category_consistency.cjs
const http = require('http');

async function makePost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch(e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function makeGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch(e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    }).on('error', reject);
  });
}

async function runCategoryTests() {
  console.log('====================================================');
  console.log('BAD TEDDY CATEGORY NORMALIZATION AUDIT SUITE');
  console.log('====================================================\n');

  const CONTROLLED_CATEGORIES = [
    'T-Shirts',
    'Hoodies',
    'Cargo Pants',
    'Jeans',
    'Sneakers',
    'Caps',
    'Accessories'
  ];

  console.log('[CONTROLLED CATEGORIES (7)]:', CONTROLLED_CATEGORIES.join(', '));
  console.log('----------------------------------------------------\n');

  const PHP_BASE = 'http://localhost/BAD%20TEDDY/backend/api';
  const PY_BASE = 'http://127.0.0.1:5000';

  // 1. Check PHP backend category filtering for all 7 categories
  console.log('[TEST 1] Testing PHP Backend Category Filter (/products.php?category=...)');
  for (const cat of CONTROLLED_CATEGORIES) {
    try {
      const res = await makeGet(`${PHP_BASE}/products.php?category=${encodeURIComponent(cat)}`);
      const count = res.data && Array.isArray(res.data.products) ? res.data.products.length : 0;
      console.log(`  - Category: '${cat}' -> Status: ${res.status} | Found: ${count} product(s)`);
    } catch(err) {
      console.log(`  - Category: '${cat}' -> Error connecting to PHP backend`);
    }
  }
  console.log('----------------------------------------------------\n');

  // 2. Chatbot category queries
  console.log('[TEST 2] Testing Chatbot Category Extraction in Chat (/chat)');
  
  // Cargo pants query
  const cargoRes = await makePost(`${PY_BASE}/chat`, { message: 'Can you show me your cargo pants collection?' });
  console.log('Query: "Can you show me your cargo pants collection?"');
  console.log('Extracted Category Slot:', cargoRes.data.extracted_slots ? cargoRes.data.extracted_slots.category : 'N/A');
  console.log('Returned Products Count:', cargoRes.data.recommended_products ? cargoRes.data.recommended_products.length : 0);
  if (cargoRes.data.recommended_products && cargoRes.data.recommended_products.length > 0) {
    console.log('First Product:', cargoRes.data.recommended_products[0].name, `[Category: ${cargoRes.data.recommended_products[0].category}]`);
  }
  console.log('\n');

  // Hoodies query
  const hoodieRes = await makePost(`${PY_BASE}/chat`, { message: 'Show me black hoodies' });
  console.log('Query: "Show me black hoodies"');
  console.log('Extracted Category Slot:', hoodieRes.data.extracted_slots ? hoodieRes.data.extracted_slots.category : 'N/A');
  console.log('Returned Products Count:', hoodieRes.data.recommended_products ? hoodieRes.data.recommended_products.length : 0);
  if (hoodieRes.data.recommended_products && hoodieRes.data.recommended_products.length > 0) {
    console.log('First Product:', hoodieRes.data.recommended_products[0].name, `[Category: ${hoodieRes.data.recommended_products[0].category}]`);
  }
  console.log('\n');

  // Caps query
  const capRes = await makePost(`${PY_BASE}/chat`, { message: 'Do you have caps or hats?' });
  console.log('Query: "Do you have caps or hats?"');
  console.log('Extracted Category Slot:', capRes.data.extracted_slots ? capRes.data.extracted_slots.category : 'N/A');
  console.log('Returned Products Count:', capRes.data.recommended_products ? capRes.data.recommended_products.length : 0);
  if (capRes.data.recommended_products && capRes.data.recommended_products.length > 0) {
    console.log('First Product:', capRes.data.recommended_products[0].name, `[Category: ${capRes.data.recommended_products[0].category}]`);
  }
  console.log('----------------------------------------------------\n');

  // 3. Admin AI Category Insights
  console.log('[TEST 3] Testing Admin AI Category Insights (/api/admin/ask-ai)');
  const adminCatRes = await makePost(`${PY_BASE}/api/admin/ask-ai`, { query: 'Which category performs best?' });
  console.log('Query: "Which category performs best?"');
  console.log('Admin AI Answer:', adminCatRes.data.answer);
  console.log('----------------------------------------------------\n');

  console.log('====================================================');
  console.log('CATEGORY NORMALIZATION AUDIT COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runCategoryTests().catch(err => console.error('Category Test Error:', err));
