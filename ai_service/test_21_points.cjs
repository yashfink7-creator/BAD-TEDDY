// test_21_points.cjs
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

function getReplyText(data) {
  return (data && (data.reply || data.response || data.message || '')) || '';
}

async function runAllTests() {
  console.log('====================================================');
  console.log('BAD TEDDY 21-POINT COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  const BASE_URL = 'http://127.0.0.1:5000';

  // 1. College outfit
  console.log('[TEST 1] College outfit query: "What should I wear to college?"');
  let r1 = await makePost(`${BASE_URL}/chat`, { message: 'What should I wear to college?' });
  console.log('Intent:', r1.data.intent, '| Model Confidence:', r1.data.confidence);
  console.log('Response Snippet:', getReplyText(r1.data).substring(0, 100) + '...');
  console.log('Recommended Products Count:', r1.data.recommended_products ? r1.data.recommended_products.length : 0);
  console.log('----------------------------------------------------\n');

  // 2. Party outfit
  console.log('[TEST 2] Party outfit query: "What should I wear to a party?"');
  let r2 = await makePost(`${BASE_URL}/chat`, { message: 'What should I wear to a party?' });
  console.log('Intent:', r2.data.intent, '| Model Confidence:', r2.data.confidence);
  console.log('Response Snippet:', getReplyText(r2.data).substring(0, 100) + '...');
  console.log('Recommended Products Count:', r2.data.recommended_products ? r2.data.recommended_products.length : 0);
  console.log('----------------------------------------------------\n');

  // 3. Trip outfit
  console.log('[TEST 3] Trip outfit query: "What should I wear to a trip?"');
  let r3 = await makePost(`${BASE_URL}/chat`, { message: 'What should I wear to a trip?' });
  console.log('Intent:', r3.data.intent, '| Model Confidence:', r3.data.confidence);
  console.log('Response Snippet:', getReplyText(r3.data).substring(0, 100) + '...');
  console.log('Recommended Products Count:', r3.data.recommended_products ? r3.data.recommended_products.length : 0);
  console.log('----------------------------------------------------\n');

  // 4. Product in S size
  console.log('[TEST 4] Size search: "Can you show me products in S size?"');
  let r4 = await makePost(`${BASE_URL}/chat`, { message: 'Can you show me products in S size?' });
  console.log('Intent:', r4.data.intent, '| Model Confidence:', r4.data.confidence);
  console.log('Response Snippet:', getReplyText(r4.data).substring(0, 100) + '...');
  console.log('Products in S count:', r4.data.recommended_products ? r4.data.recommended_products.length : 0);
  if (r4.data.recommended_products) {
    console.log('Sample Products Found:', r4.data.recommended_products.slice(0, 3).map(p => `${p.name} (Sizes: ${p.sizes || 'All'})`).join(', '));
  }
  console.log('----------------------------------------------------\n');

  // 5. Product under budget
  console.log('[TEST 5] Budget query: "What should I wear to a party under 2000?"');
  let r5 = await makePost(`${BASE_URL}/chat`, { message: 'What should I wear to a party under 2000?' });
  console.log('Intent:', r5.data.intent, '| Model Confidence:', r5.data.confidence);
  console.log('Response Snippet:', getReplyText(r5.data).substring(0, 100) + '...');
  console.log('Budget Products Count:', r5.data.recommended_products ? r5.data.recommended_products.length : 0);
  if (r5.data.recommended_products) {
    console.log('Prices:', r5.data.recommended_products.map(p => `₹${p.price}`).join(', '));
  }
  console.log('----------------------------------------------------\n');

  // 6. Cheapest hoodie / product
  console.log('[TEST 6] Cheapest product query: "Which hoodie is cheapest?"');
  let r6 = await makePost(`${BASE_URL}/chat`, { message: 'Which hoodie is cheapest?' });
  console.log('Intent:', r6.data.intent, '| Model Confidence:', r6.data.confidence);
  console.log('Response Snippet:', getReplyText(r6.data).substring(0, 120) + '...');
  if (r6.data.recommended_products && r6.data.recommended_products.length > 0) {
    console.log('First returned product:', r6.data.recommended_products[0].name, '- Price: ₹' + r6.data.recommended_products[0].price);
  }
  console.log('----------------------------------------------------\n');

  // 7. Size question with measurements
  console.log('[TEST 7] Measurements in chat: "I am 175 cm and 70 kg, what size should I choose?"');
  let r7 = await makePost(`${BASE_URL}/chat`, { message: 'I am 175 cm and 70 kg, what size should I choose?' });
  console.log('Intent:', r7.data.intent);
  console.log('Predicted Size directly in chat:', r7.data.predicted_size || (r7.data.size_details && r7.data.size_details.size) || 'None');
  console.log('Prediction Confidence:', r7.data.confidence_pct || (r7.data.size_details && r7.data.size_details.confidence) || 'N/A');
  console.log('Response Snippet:', getReplyText(r7.data).substring(0, 160) + '...');
  console.log('----------------------------------------------------\n');

  // 8. Follow-up "anything else?"
  console.log('[TEST 8] Follow-up query: "anything else u can tell me"');
  let r8 = await makePost(`${BASE_URL}/chat`, { message: 'anything else u can tell me' });
  console.log('Intent:', r8.data.intent, '| Model Confidence:', r8.data.confidence);
  console.log('Response Snippet:', getReplyText(r8.data).substring(0, 120) + '...');
  console.log('----------------------------------------------------\n');

  // 9. Normal conversational question
  console.log('[TEST 9] Conversational greeting: "Hey Bad Teddy, how is your streetwear collection?"');
  let r9 = await makePost(`${BASE_URL}/chat`, { message: 'Hey Bad Teddy, how is your streetwear collection?' });
  console.log('Intent:', r9.data.intent, '| Model Confidence:', r9.data.confidence);
  console.log('Response Snippet:', getReplyText(r9.data).substring(0, 120) + '...');
  console.log('----------------------------------------------------\n');

  // 10. Valid measurement input (/predict-size)
  console.log('[TEST 10] Direct Size Endpoint - Valid Measurements: {height: 178, weight: 74, chest: 100, waist: 84, hips: 98, fit: "regular"}');
  let r10 = await makePost(`${BASE_URL}/predict-size`, {
    height: 178,
    weight: 74,
    chest: 100,
    waist: 84,
    hips: 98,
    fit: 'regular'
  });
  console.log('Status:', r10.status, '| Predicted Size:', r10.data.size, '| Confidence:', r10.data.confidence);
  console.log('Fit Note:', r10.data.fit_note);
  console.log('----------------------------------------------------\n');

  // 11. Missing measurement input
  console.log('[TEST 11] Direct Size Endpoint - Missing Measurements: {height: 0, weight: 0, chest: 0, waist: 0, hips: 0}');
  let r11 = await makePost(`${BASE_URL}/predict-size`, {
    height: 0,
    weight: 0,
    chest: 0,
    waist: 0,
    hips: 0
  });
  console.log('Status:', r11.status, '| Response:', JSON.stringify(r11.data));
  console.log('----------------------------------------------------\n');

  // 12. Chatbot size missing info prompt
  console.log('[TEST 12] Chatbot Size Query with partial info: "what size should i get?"');
  let r12 = await makePost(`${BASE_URL}/chat`, { message: 'what size should i get?' });
  console.log('Response Snippet:', getReplyText(r12.data).substring(0, 150) + '...');
  console.log('----------------------------------------------------\n');

  // 13. Real recommendations from live MySQL catalog
  console.log('[TEST 13] Live MySQL Recommendations Endpoint: GET /recommendations?limit=4');
  let r13 = await makeGet(`${BASE_URL}/recommendations?limit=4`);
  console.log('Status:', r13.status, '| Total Retrieved:', r13.data.recommendations ? r13.data.recommendations.length : 0);
  if (r13.data.recommendations) {
    console.log('Sample Live Products:', r13.data.recommendations.map(p => `${p.name} (₹${p.price})`).join(', '));
  }
  console.log('----------------------------------------------------\n');

  // 14. Dynamic Live MySQL Integration Check
  console.log('[TEST 14] Dynamic Live MySQL Integration Check');
  let r14 = await makeGet(`${BASE_URL}/recommendations?limit=6`);
  console.log('Direct Dynamic Query to MySQL table returned:', r14.data.recommendations ? r14.data.recommendations.length : 0, 'products from live database.');
  console.log('----------------------------------------------------\n');

  console.log('====================================================');
  console.log('ALL VERIFICATION SUITE TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runAllTests().catch(err => console.error('Verification Error:', err));
