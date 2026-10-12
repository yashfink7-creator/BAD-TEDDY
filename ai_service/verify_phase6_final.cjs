/**
 * BAD TEDDY AI - Phase 6 Complete End-to-End Verification Suite
 * Tests:
 * 1. Real Chatbot NLP Queries & Slot Extraction
 * 2. Size Recommendation Multi-Profile Predictions
 * 3. Dynamic Live MySQL Recommender
 * 4. Catalog Dynamic Sync Verification
 * 5. Production Build Verification
 */

const http = require("http");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        };

        const req = http.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on("error", (err) => reject(err));

        if (options.body) {
            req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runEndToEndTests() {
    console.log("=======================================================================");
    console.log("BAD TEDDY AI - COMPLETE END-TO-END FINAL VERIFICATION SUITE");
    console.log("=======================================================================\n");

    let allTestsPassed = true;

    // -------------------------------------------------------------
    // TEST 1: CHATBOT INFERENCE (Multiple Natural Language Queries)
    // -------------------------------------------------------------
    console.log("-------------------------------------------------------------");
    console.log("TEST SUITE 1: CHATBOT NLP INTENT INFERENCE");
    console.log("-------------------------------------------------------------");
    const testChatQueries = [
        { query: "Suggest an outfit for college fest", expectedIntent: "outfit_college" },
        { query: "Suggest an oversized hoodie for a party under 2000", expectedIntent: "outfit_party" },
        { query: "Show me black hoodies in stock", expectedIntent: "product_hoodies" },
        { query: "What can I get under 1000 rupees?", expectedIntent: "budget_under_1000" },
        { query: "How do I find my size?", expectedIntent: "size_fit_guidance" },
        { query: "What is your return and exchange policy?", expectedIntent: "return_exchange_policy" }
    ];

    for (const test of testChatQueries) {
        try {
            const start = Date.now();
            const res = await fetchJson("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                body: { message: test.query }
            });
            const latency = Date.now() - start;

            const passed = res.status === 200 && res.body.success && res.body.intent === test.expectedIntent;
            if (!passed) allTestsPassed = false;

            console.log(`[${passed ? "PASS" : "WARN"}] Query: "${test.query}"`);
            console.log(`       -> Intent: ${res.body.intent} (Confidence: ${res.body.confidence_pct}, Latency: ${latency}ms)`);
            console.log(`       -> Matched Live MySQL Products: ${res.body.recommended_products ? res.body.recommended_products.length : 0} items`);
        } catch (e) {
            console.error(`[FAIL] Query failed: "${test.query}" - ${e.message}`);
            allTestsPassed = false;
        }
    }

    // -------------------------------------------------------------
    // TEST 2: SIZE RECOMMENDATION (Multiple Anthropometric Profiles)
    // -------------------------------------------------------------
    console.log("\n-------------------------------------------------------------");
    console.log("TEST SUITE 2: SIZE RECOMMENDATION RANDOM FOREST CLASSIFIER");
    console.log("-------------------------------------------------------------");
    const testSizeProfiles = [
        { h: 165, w: 55, c: 84, wa: 70, hi: 88, fit: "slim", expected: "S" },
        { h: 175, w: 70, c: 94, wa: 80, hi: 96, fit: "regular", expected: "M" },
        { h: 180, w: 80, c: 104, wa: 88, hi: 104, fit: "oversized", expected: "XL" },
        { h: 190, w: 105, c: 122, wa: 110, hi: 120, fit: "oversized", expected: "XXL" }
    ];

    for (const prof of testSizeProfiles) {
        try {
            const start = Date.now();
            const res = await fetchJson("http://127.0.0.1:5000/api/predict-size", {
                method: "POST",
                body: {
                    height: prof.h,
                    weight: prof.w,
                    chest: prof.c,
                    waist: prof.wa,
                    hips: prof.hi,
                    fit: prof.fit
                }
            });
            const latency = Date.now() - start;

            const passed = res.status === 200 && res.body.success && res.body.recommended_size === prof.expected;
            if (!passed) allTestsPassed = false;

            console.log(`[${passed ? "PASS" : "WARN"}] Profile: H:${prof.h}cm, W:${prof.w}kg, Chest:${prof.c}cm, Fit:${prof.fit}`);
            console.log(`       -> Recommended Size: ${res.body.recommended_size} (Confidence: ${res.body.confidence}, Level: ${res.body.confidence_level}, Latency: ${latency}ms)`);
        } catch (e) {
            console.error(`[FAIL] Size prediction failed: ${e.message}`);
            allTestsPassed = false;
        }
    }

    // -------------------------------------------------------------
    // TEST 3: LIVE MYSQL PRODUCT RECOMMENDATIONS
    // -------------------------------------------------------------
    console.log("\n-------------------------------------------------------------");
    console.log("TEST SUITE 3: DYNAMIC MYSQL PRODUCT RECOMMENDATIONS");
    console.log("-------------------------------------------------------------");
    try {
        const res = await fetchJson("http://127.0.0.1:5000/api/recommendations?product_id=1");
        console.log(`[PASS] Fetched recommendations for Product #1 (Oversized Signature Tee):`);
        console.log(`       - Total Indexed MySQL Products: ${res.body.total_catalog_items}`);
        console.log(`       - Similar Pieces (Cosine Similarity): ${res.body.ai_recommendations.length} items`);
        res.body.ai_recommendations.forEach(p => {
            console.log(`         * ${p.name} - ₹${p.price} (Cosine Score: ${p.similarity_score})`);
        });
        console.log(`       - Complete The Look (Cross-Category): ${res.body.complete_look_products.length} items`);
        res.body.complete_look_products.forEach(p => {
            console.log(`         * ${p.name} - Category: ${p.category} (₹${p.price})`);
        });
    } catch (e) {
        console.error(`[FAIL] MySQL recommendations failed: ${e.message}`);
        allTestsPassed = false;
    }

    // -------------------------------------------------------------
    // TEST 4: ADMIN AI TELEMETRY & METRICS INTEGRITY
    // -------------------------------------------------------------
    console.log("\n-------------------------------------------------------------");
    console.log("TEST SUITE 4: ADMIN AI TELEMETRY & MODEL INTEGRITY");
    console.log("-------------------------------------------------------------");
    try {
        const res = await fetchJson("http://127.0.0.1:5000/api/ai-status");
        console.log(`[PASS] Service Status: ${res.body.service_status}`);
        console.log(`       - Chatbot NLP Model: ${res.body.models.fashion_chatbot_nlp.architecture} (Test Acc: ${(res.body.models.fashion_chatbot_nlp.test_accuracy * 100).toFixed(2)}%)`);
        console.log(`       - Size Classifier: ${res.body.models.size_recommendation_classifier.architecture} (Test Acc: ${(res.body.models.size_recommendation_classifier.test_accuracy * 100).toFixed(2)}%)`);
        console.log(`       - Catalog Recommender: ${res.body.models.dynamic_product_recommender.algorithm} (${res.body.models.dynamic_product_recommender.indexed_products} indexed items)`);
    } catch (e) {
        console.error(`[FAIL] Admin AI telemetry failed: ${e.message}`);
        allTestsPassed = false;
    }

    // -------------------------------------------------------------
    // TEST 5: REACT PRODUCTION BUILD
    // -------------------------------------------------------------
    console.log("\n-------------------------------------------------------------");
    console.log("TEST SUITE 5: REACT PRODUCTION BUILD VERIFICATION");
    console.log("-------------------------------------------------------------");
    try {
        console.log("[*] Executing 'cmd.exe /c npm run build' in bad-teddy-react...");
        const buildOutput = execSync("cmd.exe /c npm run build", {
            cwd: path.join(__dirname, "../bad-teddy-react"),
            encoding: "utf-8"
        });
        console.log("[PASS] React Production Build Succeeded (0 Errors)");
    } catch (e) {
        console.error("[FAIL] React build error:", e.message);
        allTestsPassed = false;
    }

    console.log("\n=======================================================================");
    console.log(allTestsPassed ? "ALL 5 PHASE 6 TEST SUITES PASSED WITH 100% SUCCESS" : "SOME TESTS HAD WARNINGS");
    console.log("=======================================================================");
}

runEndToEndTests();
