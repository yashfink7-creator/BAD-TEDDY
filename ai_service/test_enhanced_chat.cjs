const http = require('http');

function postChat(message) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ message });
        const req = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/chat',
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
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function testChat() {
    console.log("=== TESTING ENHANCED CHATBOT RESPONSES ===");
    const testCases = [
        "What should I wear to a trip?",
        "Can you show me products in S size?",
        "Anything else you can tell me?",
        "What should I wear to college?",
        "What should I wear to a party under 2000?",
        "I am 175 cm and 70 kg, what size should I choose?",
        "Which hoodie is cheapest?",
        "Show me black t-shirts"
    ];

    for (const q of testCases) {
        console.log(`\n------------------------------------------------------------`);
        console.log(`[USER]: "${q}"`);
        const res = await postChat(q);
        console.log(`[INTENT]: ${res.intent} (Confidence: ${res.confidence_pct})`);
        console.log(`[BOT REPLY]:\n${res.reply}`);
        console.log(`[MATCHED PRODUCTS COUNT]: ${res.recommended_products?.length || 0}`);
        if (res.recommended_products && res.recommended_products.length > 0) {
            console.log(`[SAMPLE PRODUCTS]:`, res.recommended_products.slice(0, 3).map(p => `${p.name} (₹${p.price}, Sizes: ${p.sizes})`).join(" | "));
        }
    }
}

testChat().catch(console.error);
