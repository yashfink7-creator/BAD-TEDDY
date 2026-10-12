"""
BAD TEDDY AI - Chatbot NLP Intent Classifier Training
Model: TF-IDF Vectorizer (1-2 ngrams) + Multi-Layer Perceptron (MLP) Neural Network Classifier
Evaluates on an 80/20 train-test split and exports artifacts for inference.
"""

import json
import re
import sys
from pathlib import Path
import numpy as np
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

AI_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(AI_DIR))
import config

def clean_text(text: str) -> str:
    """Normalize and clean input text for NLP vectorization."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s\₹\$\€\-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text

def load_data(filepath: Path):
    """Load and unpack intents dataset."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    patterns = []
    labels = []
    intent_metadata = {}

    for intent in data["intents"]:
        tag = intent["tag"]
        intent_metadata[tag] = {
            "responses": intent.get("responses", []),
            "category_hint": intent.get("category_hint", None),
            "budget_max": intent.get("budget_max", None),
            "context_set": intent.get("context_set", "")
        }

        for pattern in intent["patterns"]:
            cleaned = clean_text(pattern)
            if cleaned:
                patterns.append(cleaned)
                labels.append(tag)

    return patterns, labels, intent_metadata

def train():
    print("=" * 65)
    print("BAD TEDDY AI - TRAINING NLP INTENT CLASSIFIER")
    print("=" * 65)

    patterns, labels, intent_metadata = load_data(config.INTENTS_PATH)
    print(f"[*] Loaded {len(patterns)} pattern examples across {len(set(labels))} unique intent classes.")

    # 80/20 Stratified Train/Test Split
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        patterns,
        labels,
        test_size=0.20,
        random_state=42,
        stratify=labels
    )

    print(f"[*] Training Samples: {len(X_train_raw)} | Testing Samples: {len(X_test_raw)}")

    # 1. Feature Extraction: TF-IDF N-Gram Vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        strip_accents="unicode"
    )

    X_train_vec = vectorizer.fit_transform(X_train_raw)
    X_test_vec = vectorizer.transform(X_test_raw)
    print(f"[*] TF-IDF Vocabulary Size: {len(vectorizer.vocabulary_)} features")

    # 2. Train Neural Network (MLP) and Linear Model
    print("[*] Training MLP Neural Classifier (Hidden Layers: [128, 64], learning_rate_init=0.005, max_iter=400)...")
    mlp = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        learning_rate_init=0.005,
        alpha=0.0001,
        max_iter=400,
        random_state=42
    )
    mlp.fit(X_train_vec, y_train)

    mlp_train_acc = accuracy_score(y_train, mlp.predict(X_train_vec))
    mlp_test_acc = accuracy_score(y_test, mlp.predict(X_test_vec))

    # Also train Logistic Regression with tuned C
    logreg = LogisticRegression(C=10.0, max_iter=400, random_state=42)
    logreg.fit(X_train_vec, y_train)
    logreg_train_acc = accuracy_score(y_train, logreg.predict(X_train_vec))
    logreg_test_acc = accuracy_score(y_test, logreg.predict(X_test_vec))

    print("\n" + "-" * 65)
    print("MODEL PERFORMANCE COMPARISON:")
    print(f"  - MLP Neural Net Train Acc:  {mlp_train_acc * 100:.2f}% | Test Acc: {mlp_test_acc * 100:.2f}%")
    print(f"  - LogReg Classifier Train Acc: {logreg_train_acc * 100:.2f}% | Test Acc: {logreg_test_acc * 100:.2f}%")
    print("-" * 65)

    # Select the model with highest test accuracy (or MLP if equal/better)
    if mlp_test_acc >= logreg_test_acc:
        selected_model = mlp
        model_name = "MLPClassifier (Neural Network)"
        test_acc = mlp_test_acc
        train_acc = mlp_train_acc
    else:
        selected_model = logreg
        model_name = "LogisticRegression (Tuned C=10.0)"
        test_acc = logreg_test_acc
        train_acc = logreg_train_acc

    print(f"[+] Selected Best Model for Deployment: {model_name}")

    y_pred_test = selected_model.predict(X_test_vec)
    report = classification_report(y_test, y_pred_test, zero_division=0, output_dict=True)

    print("\nCLASSIFICATION METRICS (Test Set):")
    print(f"  - Test Accuracy:   {test_acc * 100:.2f}%")
    print(f"  - Macro Precision: {report['macro avg']['precision']:.4f}")
    print(f"  - Macro Recall:    {report['macro avg']['recall']:.4f}")
    print(f"  - Macro F1-Score:  {report['macro avg']['f1-score']:.4f}")
    print(f"  - Weighted F1:     {report['weighted avg']['f1-score']:.4f}")

    # 3. Save Model Artifacts
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected_model, config.CHATBOT_MODEL_PATH)
    joblib.dump(vectorizer, config.CHATBOT_VECTORIZER_PATH)

    meta = {
        "model_type": model_name,
        "vocabulary_size": len(vectorizer.vocabulary_),
        "num_classes": len(selected_model.classes_),
        "classes": list(selected_model.classes_),
        "train_accuracy": round(train_acc, 4),
        "test_accuracy": round(test_acc, 4),
        "macro_precision": round(report['macro avg']['precision'], 4),
        "macro_recall": round(report['macro avg']['recall'], 4),
        "macro_f1": round(report['macro avg']['f1-score'], 4),
        "weighted_f1": round(report['weighted avg']['f1-score'], 4),
        "intent_metadata": intent_metadata
    }

    with open(config.CHATBOT_INTENTS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(f"[+] Saved Trained Model:       {config.CHATBOT_MODEL_PATH}")
    print(f"[+] Saved Fitted Vectorizer:   {config.CHATBOT_VECTORIZER_PATH}")
    print(f"[+] Saved Chatbot Metadata:    {config.CHATBOT_INTENTS_META_PATH}")
    print("=" * 65)

    return meta

if __name__ == "__main__":
    train()
