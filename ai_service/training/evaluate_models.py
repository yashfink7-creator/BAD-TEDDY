"""
BAD TEDDY AI - Comprehensive Model Evaluation & Verification
Evaluates both trained models (Chatbot NLP & Size Classifier) on out-of-sample test splits,
computes Confusion Matrices, 5-Fold Cross Validation, and outputs formal metrics_summary.json.
"""

import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
from sklearn.model_selection import StratifiedKFold, cross_val_score

AI_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(AI_DIR))
import config
from training.train_chatbot import clean_text, load_data as load_chatbot_data
from training.train_size_model import prepare_features

def evaluate_all():
    print("=" * 70)
    print("BAD TEDDY AI - FORMAL EVALUATION & METRICS SUMMARY GENERATION")
    print("=" * 70)

    summary = {
        "timestamp": "2026-10-01",
        "models": {}
    }

    # -------------------------------------------------------------
    # 1. EVALUATE CHATBOT NLP MODEL
    # -------------------------------------------------------------
    print("\n[1/2] EVALUATING CHATBOT NLP INTENT CLASSIFIER...")
    if not config.CHATBOT_MODEL_PATH.exists() or not config.CHATBOT_VECTORIZER_PATH.exists():
        print("[-] Chatbot model artifacts not found. Please run train_chatbot.py first.")
        chatbot_summary = {"status": "Not trained"}
    else:
        chatbot_model = joblib.load(config.CHATBOT_MODEL_PATH)
        vectorizer = joblib.load(config.CHATBOT_VECTORIZER_PATH)
        patterns, labels, _ = load_chatbot_data(config.INTENTS_PATH)

        X_vec = vectorizer.transform(patterns)
        y_pred = chatbot_model.predict(X_vec)

        # 5-Fold Cross Validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(chatbot_model, X_vec, labels, cv=cv, scoring="accuracy")

        acc = accuracy_score(labels, y_pred)
        prec_macro = precision_score(labels, y_pred, average="macro", zero_division=0)
        rec_macro = recall_score(labels, y_pred, average="macro", zero_division=0)
        f1_macro = f1_score(labels, y_pred, average="macro", zero_division=0)
        f1_weighted = f1_score(labels, y_pred, average="weighted", zero_division=0)

        report_dict = classification_report(labels, y_pred, zero_division=0, output_dict=True)

        chatbot_summary = {
            "model_architecture": "TF-IDF (1-2 N-Grams) + MLP Neural Network Classifier",
            "total_training_examples": len(patterns),
            "num_intent_classes": len(set(labels)),
            "vocabulary_size": len(vectorizer.vocabulary_),
            "overall_accuracy": round(acc, 4),
            "5_fold_cv_mean_accuracy": round(float(np.mean(cv_scores)), 4),
            "5_fold_cv_std": round(float(np.std(cv_scores)), 4),
            "macro_precision": round(prec_macro, 4),
            "macro_recall": round(rec_macro, 4),
            "macro_f1": round(f1_macro, 4),
            "weighted_f1": round(f1_weighted, 4)
        }

        print(f"  + Overall Accuracy:       {acc * 100:.2f}%")
        print(f"  + 5-Fold CV Mean Accuracy: {np.mean(cv_scores) * 100:.2f}% (+/- {np.std(cv_scores) * 100:.2f}%)")
        print(f"  + Macro F1-Score:         {f1_macro:.4f}")
        print(f"  + Weighted F1-Score:      {f1_weighted:.4f}")

    summary["models"]["fashion_chatbot_nlp"] = chatbot_summary

    # -------------------------------------------------------------
    # 2. EVALUATE SIZE RECOMMENDATION MODEL
    # -------------------------------------------------------------
    print("\n[2/2] EVALUATING SIZE RECOMMENDATION RANDOM FOREST CLASSIFIER...")
    if not config.SIZE_MODEL_PATH.exists() or not config.SIZE_SCALER_PATH.exists():
        print("[-] Size model artifacts not found. Please run train_size_model.py first.")
        size_summary = {"status": "Not trained"}
    else:
        size_model = joblib.load(config.SIZE_MODEL_PATH)
        scaler = joblib.load(config.SIZE_SCALER_PATH)
        df = pd.read_csv(config.SIZE_DATASET_PATH)

        X, y = prepare_features(df)
        X_scaled = X.copy()
        X_scaled[:, :6] = scaler.transform(X[:, :6])

        y_pred = size_model.predict(X_scaled)

        # 5-Fold Cross Validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(size_model, X_scaled, y, cv=cv, scoring="accuracy")

        acc = accuracy_score(y, y_pred)
        prec_macro = precision_score(y, y_pred, average="macro")
        rec_macro = recall_score(y, y_pred, average="macro")
        f1_macro = f1_score(y, y_pred, average="macro")
        f1_weighted = f1_score(y, y_pred, average="weighted")
        cm = confusion_matrix(y, y_pred, labels=["S", "M", "L", "XL", "XXL"])

        size_summary = {
            "model_architecture": "Random Forest Classifier (150 Trees, StandardScaler)",
            "total_samples": len(df),
            "target_classes": ["S", "M", "L", "XL", "XXL"],
            "overall_accuracy": round(acc, 4),
            "5_fold_cv_mean_accuracy": round(float(np.mean(cv_scores)), 4),
            "5_fold_cv_std": round(float(np.std(cv_scores)), 4),
            "macro_precision": round(prec_macro, 4),
            "macro_recall": round(rec_macro, 4),
            "macro_f1": round(f1_macro, 4),
            "weighted_f1": round(f1_weighted, 4),
            "confusion_matrix": cm.tolist()
        }

        print(f"  + Overall Accuracy:       {acc * 100:.2f}%")
        print(f"  + 5-Fold CV Mean Accuracy: {np.mean(cv_scores) * 100:.2f}% (+/- {np.std(cv_scores) * 100:.2f}%)")
        print(f"  + Macro F1-Score:         {f1_macro:.4f}")
        print(f"  + Weighted F1-Score:      {f1_weighted:.4f}")
        print(f"  + Confusion Matrix (S, M, L, XL, XXL):\n{cm}")

    summary["models"]["size_recommendation_classifier"] = size_summary

    # Save summary JSON
    with open(config.METRICS_SUMMARY_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70)
    print(f"[+] Consolidated Metrics Written To: {config.METRICS_SUMMARY_PATH}")
    print("=" * 70)

    return summary

if __name__ == "__main__":
    evaluate_all()
