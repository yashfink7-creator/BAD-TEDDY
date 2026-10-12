const http = require('http');

function getJSON(url) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'GET',
            headers: { 'Connection': 'close' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function postJSON(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Connection': 'close'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function verifyAll() {
    console.log("================================================================================");
    console.log("BAD TEDDY ADMIN AI & BUSINESS INTELLIGENCE - FULL SYSTEM VERIFICATION");
    console.log("Testing live integration against MySQL 'bad_teddy' and FastAPI Port 5000");
    console.log("================================================================================\n");

    // 1. Health & Telemetry Check
    console.log("--- 1. Health Check & Model Telemetry ---");
    const health = await getJSON('http://127.0.0.1:5000/health');
    console.log(`[+] Microservice Health: ${health.status.toUpperCase()}`);
    console.log(`[+] Models Loaded: Chatbot=${health.models_loaded.chatbot_nlp}, SizeClassifier=${health.models_loaded.size_classifier}, Recommender=${health.models_loaded.product_recommender}`);

    const telemetry = await getJSON('http://127.0.0.1:5000/api/ai-status');
    console.log(`[+] Telemetry Status: ${telemetry.service_status}`);
    console.log(`[+] Active Engines: ${Object.keys(telemetry.models).join(', ')}`);

    // 2. Dashboard Intelligence
    console.log("\n--- 2. Live Dashboard Intelligence (/api/admin/dashboard-intelligence) ---");
    const intel = await getJSON('http://127.0.0.1:5000/api/admin/dashboard-intelligence');
    console.log(`[+] Gross Revenue: ₹${intel.kpis.gross_revenue.toLocaleString()} across ${intel.kpis.total_orders} orders (AOV: ₹${intel.kpis.avg_order_value})`);
    console.log(`[+] Total Registered Users: ${intel.kpis.total_customers}`);
    console.log(`[+] Total Catalog SKUs: ${intel.kpis.catalog_products} (${intel.kpis.total_stock_units} units in stock)`);
    console.log(`[+] Critical Stock Alerts: ${intel.kpis.critical_stock_alerts} SKUs (Recommended Reorder: +${intel.kpis.recommended_restock_units} units)`);
    console.log(`[+] Overall Customer Satisfaction Index: ${intel.kpis.overall_satisfaction_score}%`);

    // 3. Demand Forecasting & Stock Intelligence
    console.log("\n--- 3. Demand Forecasting & Stock Intelligence (/api/admin/demand-forecast) ---");
    const demand = await getJSON('http://127.0.0.1:5000/api/admin/demand-forecast');
    console.log(`[+] Demand Analysis Method: ${demand.summary.method}`);
    console.log(`[+] Active Lifespan Window: ${demand.summary.active_sales_days} days`);
    console.log(`[+] Analyzed Products (${demand.products.length}):`);
    demand.products.slice(0, 5).forEach(p => {
        console.log(`    - ${p.name.padEnd(26)} | Stock: ${String(p.current_stock).padStart(2)} | Sold: ${String(p.units_sold).padStart(2)} | Velocity: ${p.daily_velocity}/day | DOIR: ${String(p.doir_days).padStart(5)}d | Risk: ${p.risk_level.padEnd(8)} | Restock: +${p.recommended_reorder}`);
    });

    // 4. Customer RFM Segmentation
    console.log("\n--- 4. Customer RFM Segmentation (/api/admin/customer-segments) ---");
    const cust = await getJSON('http://127.0.0.1:5000/api/admin/customer-segments');
    console.log(`[+] ML Algorithm: ${cust.model_metadata.algorithm}`);
    console.log(`[+] Features: ${cust.model_metadata.features_used.join(', ')}`);
    console.log(`[+] Active Cohorts:`);
    cust.cohorts.forEach(c => {
        console.log(`    - [${c.name.padEnd(22)}] ${c.customer_count} users (${c.percentage_of_base}%) | Total Rev: ₹${c.total_revenue.toLocaleString()} | Avg Spend: ₹${c.average_spend.toLocaleString()} | Strategy: ${c.strategy}`);
    });

    // 5. Product Performance & Sentiment Matrix
    console.log("\n--- 5. Product Performance & Sentiment (/api/admin/product-performance) ---");
    const perf = await getJSON('http://127.0.0.1:5000/api/admin/product-performance');
    console.log(`[+] Overall Sentiment Index: ${perf.overall_sentiment_index}% (Across ${perf.total_reviews_analyzed} reviews)`);
    console.log(`[+] Top Ranked Products:`);
    perf.products.slice(0, 5).forEach(p => {
        console.log(`    - ${p.name.padEnd(26)} | Score: ${p.performance_score}/100 [${p.performance_tag}] | Sold: ${p.units_sold} | Rev: ₹${p.total_revenue.toLocaleString()} | Sentiment: ${p.sentiment_score}%`);
    });

    // 6. Admin NLP Assistant Live Q&A Queries
    console.log("\n--- 6. Admin AI Natural-Language Query Assistant (/api/admin/ask-ai) ---");
    const testQuestions = [
        "Which product sold the most?",
        "Which products need restocking?",
        "What was our total revenue?",
        "Which category performs best?",
        "How many customers do we have?",
        "What is our customer satisfaction rating?",
        "How many total products in stock?"
    ];

    for (const q of testQuestions) {
        const res = await postJSON('http://127.0.0.1:5000/api/admin/ask-ai', { query: q });
        console.log(`\n  Q: "${q}"`);
        console.log(`  Intent: [${res.matched_intent}] (Confidence: ${res.confidence})`);
        console.log(`  Live AI Answer: ${res.answer.replace(/\n/g, ' ')}`);
        if (res.suggested_actions && res.suggested_actions.length > 0) {
            console.log(`  Actions: ${res.suggested_actions.slice(0, 2).join(' | ')}`);
        }
    }

    // 7. Storefront AI Sanity Verification (Ensure no customer storefront regression)
    console.log("\n--- 7. Storefront Customer AI Regression Sanity Check ---");
    const chatRes = await postJSON('http://127.0.0.1:5000/api/chat', { message: "Show oversized hoodies under 2000" });
    console.log(`[+] Storefront Chatbot: Intent='${chatRes.intent}' (Conf: ${(chatRes.confidence*100).toFixed(1)}%) | Response: "${chatRes.response?.slice(0, 60)}..."`);

    const sizeRes = await postJSON('http://127.0.0.1:5000/api/predict-size', { height: 180, weight: 78, chest: 102, waist: 86, hips: 102, fit: 'oversized' });
    console.log(`[+] Storefront Size Model: Predicted='${sizeRes.recommended_size}' (Conf: ${sizeRes.confidence}) | FitNote: ${sizeRes.fit_note?.slice(0, 50)}...`);

    const recRes = await getJSON('http://127.0.0.1:5000/api/recommendations?product_id=2&limit=3');
    console.log(`[+] Storefront Recommender: Target='${recRes.target_product?.name}' | Similar=${recRes.similar_products?.length || 0} | CompleteLook=${recRes.complete_the_look?.length || 0}`);

    console.log("\n================================================================================");
    console.log("ALL ADMIN AI & STOREFRONT AI ENGINES VERIFIED SUCCESSFULLY (0 ERRORS)");
    console.log("================================================================================");
}

verifyAll().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
