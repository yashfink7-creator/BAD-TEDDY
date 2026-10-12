import urllib.request
import json

def test():
    print("Testing /api/admin/dashboard-intelligence...")
    req = urllib.request.Request("http://127.0.0.1:5000/api/admin/dashboard-intelligence")
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Success:", data.get("success"))
        print("KPIs:", data.get("kpis"))
        print("Stock products:", len(data.get("demand_forecasting", {}).get("products", [])))
        print("Customer cohorts:", len(data.get("customer_segmentation", {}).get("cohorts", [])))

    print("\nTesting /api/admin/ask-ai...")
    queries = [
        "Which product sold the most?",
        "Which products need restocking?",
        "What was our total revenue?",
        "Which category performs best?",
        "How many customers do we have?"
    ]
    for q in queries:
        req_data = json.dumps({"query": q}).encode('utf-8')
        req = urllib.request.Request("http://127.0.0.1:5000/api/admin/ask-ai", data=req_data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"\nQ: {q}")
            print(f"Intent: {res.get('matched_intent')} (Conf: {res.get('confidence')})")
            print(f"Answer: {res.get('answer')}")

if __name__ == "__main__":
    test()
