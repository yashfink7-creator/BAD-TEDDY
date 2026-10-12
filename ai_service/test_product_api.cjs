const http = require('http');

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

async function testProductApi() {
  console.log("=== 1. Testing GET /backend/api/products.php?id=1 ===");
  const res1 = await fetchJson("http://127.0.0.1/BAD%20TEDDY/backend/api/products.php?id=1");
  console.log("Status:", res1.status);
  console.log("Success:", res1.data?.success);
  console.log("Product:", {
    id: res1.data?.product?.id,
    name: res1.data?.product?.name,
    category: res1.data?.product?.category,
    price: res1.data?.product?.price,
    stock: res1.data?.product?.stock,
    sizes: res1.data?.product?.sizes,
    badge: res1.data?.product?.badge,
    reviews: res1.data?.product?.reviews?.length,
    related: res1.data?.product?.related_products?.length
  });

  console.log("\n=== 2. Testing All Catalog Products Stock State ===");
  const allRes = await fetchJson("http://127.0.0.1/BAD%20TEDDY/backend/api/products.php");
  if (allRes.data?.success) {
    allRes.data.products.forEach(p => {
      console.log(`ID ${p.id}: "${p.name}" | Stock: ${p.stock} | Cat: ${p.category} | Price: ₹${p.price}`);
    });
  }

  console.log("\n=== 3. Testing Cart API ===");
  const cartRes = await fetchJson("http://127.0.0.1/BAD%20TEDDY/backend/api/cart.php?user_id=1");
  console.log("Cart Status:", cartRes.status, "Items count:", cartRes.data?.cart?.length);

  console.log("\n=== 4. Testing Wishlist API ===");
  const wishRes = await fetchJson("http://127.0.0.1/BAD%20TEDDY/backend/api/wishlist.php?user_id=1");
  console.log("Wishlist Status:", wishRes.status, "Items count:", wishRes.data?.wishlist?.length);
}

testProductApi().catch(console.error);
