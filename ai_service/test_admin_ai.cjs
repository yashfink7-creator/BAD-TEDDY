// test_admin_ai.cjs
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

async function runAdminAITests() {
  console.log('====================================================');
  console.log('BAD TEDDY ADMIN AI LIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  const BASE_URL = 'http://127.0.0.1:5000';

  // 1. Telemetry / AI Status
  console.log('[TEST 1] AI Status Endpoint: GET /api/ai-status');
  const statusRes = await makeGet(`${BASE_URL}/api/ai-status`);
  console.log('Status:', statusRes.status, '| Service Status:', statusRes.data.service_status);
  console.log('Loaded Models:', Object.keys(statusRes.data.models).join(', '));
  console.log('----------------------------------------------------\n');

  // 2. Full Intelligence Dashboard
  console.log('[TEST 2] Full Intelligence: GET /api/admin/intelligence');
  const intelRes = await makeGet(`${BASE_URL}/api/admin/intelligence`);
  console.log('Status:', intelRes.status, '| Success:', intelRes.data.success);
  if (intelRes.data.kpis) {
    console.log('Gross Revenue:', '₹' + (intelRes.data.kpis.gross_revenue || 0).toLocaleString());
    console.log('Total Orders:', intelRes.data.kpis.total_orders);
    console.log('Total Customers:', intelRes.data.kpis.total_customers);
    console.log('Total Stock Units:', intelRes.data.kpis.total_stock_units);
  }
  if (intelRes.data.customer_segmentation) {
    console.log('Customer Cohorts:', intelRes.data.customer_segmentation.cohorts ? intelRes.data.customer_segmentation.cohorts.map(c => `${c.name} (${c.count})`).join(', ') : 'N/A');
  }
  console.log('----------------------------------------------------\n');

  // 3. Ask AI: "Which product sold the most?"
  console.log('[TEST 3] Admin Query: "Which product sold the most?"');
  const q1 = await makePost(`${BASE_URL}/api/admin/ask-ai`, { query: 'Which product sold the most?' });
  console.log('Answer:', q1.data.answer);
  console.log('Intent / Topic:', q1.data.intent || q1.data.topic);
  console.log('----------------------------------------------------\n');

  // 4. Ask AI: "Which products need restocking?"
  console.log('[TEST 4] Admin Query: "Which products need restocking?"');
  const q2 = await makePost(`${BASE_URL}/api/admin/ask-ai`, { query: 'Which products need restocking?' });
  console.log('Answer:', q2.data.answer);
  console.log('----------------------------------------------------\n');

  // 5. Ask AI: "What is our total revenue?"
  console.log('[TEST 5] Admin Query: "What is our total revenue?"');
  const q3 = await makePost(`${BASE_URL}/api/admin/ask-ai`, { query: 'What is our total revenue?' });
  console.log('Answer:', q3.data.answer);
  console.log('----------------------------------------------------\n');

  // 6. Ask AI: "Which category performs best?"
  console.log('[TEST 6] Admin Query: "Which category performs best?"');
  const q4 = await makePost(`${BASE_URL}/api/admin/ask-ai`, { query: 'Which category performs best?' });
  console.log('Answer:', q4.data.answer);
  console.log('----------------------------------------------------\n');

  console.log('====================================================');
  console.log('ADMIN AI SUITE COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runAdminAITests().catch(err => console.error('Admin AI Test Error:', err));
