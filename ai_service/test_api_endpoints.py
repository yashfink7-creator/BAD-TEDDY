"""
BAD TEDDY AI - API Endpoint Tester
Executes real HTTP requests against all FastAPI endpoints and prints formatted outputs.
"""

import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def make_request(method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data else None,
        headers={"Content-Type": "application/json"} if data else {},
        method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
            return status_code, body
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=" * 70)
    print("TESTING BAD TEDDY AI REST API ENDPOINTS")
    print("=" * 70)

    # 1. Health Check
    print("\n[TEST 1] GET /health")
    code, res = make_request("GET", "/health")
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200, "Health check failed!"

    # 2. Chatbot Endpoint - Test 1
    print("\n[TEST 2A] POST /api/chat - College Outfit Query")
    code, res = make_request("POST", "/api/chat", {"message": "Suggest an outfit for college"})
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200 and res.get("success"), "Chatbot test 1 failed!"

    # 2. Chatbot Endpoint - Test 2 (with Budget extraction)
    print("\n[TEST 2B] POST /api/chat - Party Hoodie under 2000")
    code, res = make_request("POST", "/api/chat", {"message": "Suggest an oversized hoodie for a party under 2000"})
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200 and res.get("success"), "Chatbot test 2 failed!"

    # 3. Size Recommendation Endpoint
    print("\n[TEST 3] POST /api/predict-size - Oversized Fit")
    payload = {
        "height": 178,
        "weight": 72,
        "chest": 96,
        "waist": 82,
        "hips": 98,
        "fit": "oversized"
    }
    code, res = make_request("POST", "/api/predict-size", payload)
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200 and res.get("success"), "Size prediction test failed!"

    # 4. Product Recommendations Endpoint
    print("\n[TEST 4] GET /api/recommendations?product_id=2")
    code, res = make_request("GET", "/api/recommendations?product_id=2")
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200 and res.get("success"), "Recommendations test failed!"

    # 5. AI Status Telemetry Endpoint
    print("\n[TEST 5] GET /api/ai-status")
    code, res = make_request("GET", "/api/ai-status")
    print(f"Status Code: {code}")
    print(json.dumps(res, indent=2))
    assert code == 200 and res.get("success"), "AI status test failed!"

    print("\n" + "=" * 70)
    print("ALL API ENDPOINTS TESTED & RETURNING VALID PREDICTIONS")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
