const http = require('http');

async function getJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function postJSON(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    console.log("=== 1. TESTING /api/admin/dashboard-intelligence ===");
    const intel = await getJSON('http://127.0.0.1:5000/api/admin/dashboard-intelligence');
    console.log("Success:", intel.success);
    console.log("Live KPIs:", intel.kpis);
    console.log("Demand Summary:", intel.demand_forecasting?.summary);
    console.log("Customer Cohorts Count:", intel.customer_segmentation?.cohorts?.length);
    console.log("Product Performance Count:", intel.product_performance?.products?.length);

    console.log("\n=== 2. TESTING /api/admin/ask-ai (Natural Language Admin Assistant) ===");
    const testQueries = [
        "Which product sold the most?",
        "Which products need restocking?",
        "What was our total revenue?",
        "Which category performs best?",
        "How many customers do we have?",
        "What is our customer satisfaction rating?",
        "How many total products in stock?"
    ];

    for (const q of testQueries) {
        const res = await postJSON('http://127.0.0.1:5000/api/admin/ask-ai', { query: q });
        console.log(`\n[Question]: "${q}"`);
        console.log(`[Intent]: ${res.matched_intent} (Confidence: ${res.confidence})`);
        console.log(`[Live Answer]:\n${res.answer}`);
        if (res.suggested_actions && res.suggested_actions.length > 0) {
            console.log(`[Suggested Actions]: ${res.suggested_actions.join(" | ")}`);
        }
    }
}

main().catch(err => {
    console.error("Test error:", err);
    process.exit(1);
});
