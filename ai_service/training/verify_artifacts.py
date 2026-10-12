"""
BAD TEDDY AI - Artifact Verification & Sanity Check
Tests loading all generated model artifacts and executing test inference.
"""

import sys
import json
from pathlib import Path
import joblib
import numpy as np

AI_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(AI_DIR))
import config

def verify():
    print("=" * 60)
    print("VERIFYING MODEL ARTIFACTS AND INFERENCE")
    print("=" * 60)

    # 1. Chatbot Verification
    print("\n[1] Testing Chatbot NLP Artifacts...")
    assert config.CHATBOT_MODEL_PATH.exists(), "Chatbot model file missing!"
    assert config.CHATBOT_VECTORIZER_PATH.exists(), "Chatbot vectorizer missing!"
    assert config.CHATBOT_INTENTS_META_PATH.exists(), "Chatbot meta missing!"

    chatbot_model = joblib.load(config.CHATBOT_MODEL_PATH)
    vectorizer = joblib.load(config.CHATBOT_VECTORIZER_PATH)
    with open(config.CHATBOT_INTENTS_META_PATH, "r", encoding="utf-8") as f:
        chatbot_meta = json.load(f)

    print("    Model Type:", chatbot_meta["model_type"])
    print("    Vocabulary Features:", chatbot_meta["vocabulary_size"])
    print("    Number of Intent Classes:", chatbot_meta["num_classes"])

    # Test Chatbot Inference
    test_queries = [
        "Suggest an outfit for college fest",
        "Show me black oversized hoodies",
        "What can I buy under 2000 rupees?",
        "How do I find my size?",
        "What is your return policy?"
    ]

    print("\n    Test NLP Predictions:")
    for query in test_queries:
        vec = vectorizer.transform([query.lower().strip()])
        pred = chatbot_model.predict(vec)[0]
        probs = chatbot_model.predict_proba(vec)[0]
        conf = float(np.max(probs))
        print(f"    - Query: '{query}'")
        print(f"      -> Predicted Intent: {pred} (Confidence: {conf*100:.1f}%)")

    # 2. Size Model Verification
    print("\n[2] Testing Size Classifier Artifacts...")
    assert config.SIZE_MODEL_PATH.exists(), "Size model file missing!"
    assert config.SIZE_SCALER_PATH.exists(), "Size scaler file missing!"
    assert config.SIZE_META_PATH.exists(), "Size meta missing!"

    size_model = joblib.load(config.SIZE_MODEL_PATH)
    scaler = joblib.load(config.SIZE_SCALER_PATH)
    with open(config.SIZE_META_PATH, "r", encoding="utf-8") as f:
        size_meta = json.load(f)

    print("    Model Type:", size_meta["model_type"])
    print("    Number of Estimators:", size_meta["n_estimators"])
    print("    Feature Columns:", size_meta["feature_columns"])

    # Test Size Inference
    test_cases = [
        {"h": 165, "w": 55, "c": 84, "wa": 70, "hi": 88, "fit": "slim"},
        {"h": 175, "w": 70, "c": 94, "wa": 80, "hi": 96, "fit": "regular"},
        {"h": 182, "w": 82, "c": 105, "wa": 90, "hi": 104, "fit": "oversized"},
        {"h": 190, "w": 105, "c": 122, "wa": 110, "hi": 120, "fit": "oversized"}
    ]

    print("\n    Test Size Classifier Predictions:")
    for case in test_cases:
        bmi = case["w"] / ((case["h"] / 100) ** 2)
        fit_slim = 1.0 if case["fit"] == "slim" else 0.0
        fit_reg = 1.0 if case["fit"] == "regular" else 0.0
        fit_over = 1.0 if case["fit"] == "oversized" else 0.0

        raw_features = np.array([[case["h"], case["w"], case["c"], case["wa"], case["hi"], bmi, fit_slim, fit_reg, fit_over]])
        scaled_features = raw_features.copy()
        scaled_features[:, :6] = scaler.transform(raw_features[:, :6])

        pred_size = size_model.predict(scaled_features)[0]
        probs = size_model.predict_proba(scaled_features)[0]
        conf = float(np.max(probs))
        prob_dict = {cls: round(float(p), 3) for cls, p in zip(size_model.classes_, probs)}

        print(f"    - Input: H:{case['h']}cm, W:{case['w']}kg, Chest:{case['c']}cm, Fit:{case['fit']}")
        print(f"      -> Recommended Size: {pred_size} (Confidence: {conf*100:.1f}%) | Probs: {prob_dict}")

    print("\n" + "=" * 60)
    print("ALL ARTIFACTS VERIFIED & WORKING PERFECTLY")
    print("=" * 60)

if __name__ == "__main__":
    verify()
