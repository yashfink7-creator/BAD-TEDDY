"""
BAD TEDDY AI - Size Recommendation Classifier Training
Model: Random Forest Multi-Class Classifier with StandardScaler Normalization
Input Features: Height, Weight, Chest, Waist, Hips, BMI, One-Hot Encoded Fit Preference
Target Label: Size (S, M, L, XL, XXL)
"""

import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

AI_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(AI_DIR))
import config

FEATURE_COLUMNS = ["height", "weight", "chest", "waist", "hips", "bmi", "fit_slim", "fit_regular", "fit_oversized"]
NUMERICAL_COLS = ["height", "weight", "chest", "waist", "hips", "bmi"]

def prepare_features(df: pd.DataFrame):
    """Preprocess dataframe and generate feature matrix."""
    df_proc = df.copy()
    
    # One-hot encode fit preference
    df_proc["fit_slim"] = (df_proc["fit_preference"] == "slim").astype(float)
    df_proc["fit_regular"] = (df_proc["fit_preference"] == "regular").astype(float)
    df_proc["fit_oversized"] = (df_proc["fit_preference"] == "oversized").astype(float)
    
    X = df_proc[FEATURE_COLUMNS].values
    y = df_proc["size"].values
    return X, y

def train():
    print("=" * 65)
    print("BAD TEDDY AI - TRAINING SIZE RECOMMENDATION CLASSIFIER")
    print("=" * 65)

    # 1. Load Dataset
    df = pd.read_csv(config.SIZE_DATASET_PATH)
    print(f"[*] Loaded {len(df)} anthropometric records from {config.SIZE_DATASET_PATH}")
    print(f"[*] Target Class Distribution: {dict(df['size'].value_counts())}")

    X, y = prepare_features(df)

    # 2. Stratified 80/20 Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"[*] Training Samples: {len(X_train)} | Testing Samples: {len(X_test)}")

    # 3. Fit Standard Scaler on Numerical Features of Training Set Only
    scaler = StandardScaler()
    
    # Scale first 6 numerical features, leave one-hot binary features intact
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    
    X_train_scaled[:, :6] = scaler.fit_transform(X_train[:, :6])
    X_test_scaled[:, :6] = scaler.transform(X_test[:, :6])

    # 4. Train Models & Benchmark
    print("[*] Training Random Forest Classifier (150 Estimators, max_depth=12)...")
    rf_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    rf_model.fit(X_train_scaled, y_train)

    # Benchmark: Gradient Boosting
    gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb_model.fit(X_train_scaled, y_train)

    # 5. Evaluate on Test Split
    rf_pred_train = rf_model.predict(X_train_scaled)
    rf_pred_test = rf_model.predict(X_test_scaled)
    gb_pred_test = gb_model.predict(X_test_scaled)

    train_acc = accuracy_score(y_train, rf_pred_train)
    test_acc = accuracy_score(y_test, rf_pred_test)
    gb_test_acc = accuracy_score(y_test, gb_pred_test)

    print("\n" + "-" * 65)
    print("MODEL PERFORMANCE SUMMARY:")
    print(f"  - Random Forest Train Accuracy:  {train_acc * 100:.2f}%")
    print(f"  - Random Forest Test Accuracy:   {test_acc * 100:.2f}%")
    print(f"  - Gradient Boost Test Accuracy:  {gb_test_acc * 100:.2f}%")
    print("-" * 65)

    # Classification report
    report = classification_report(y_test, rf_pred_test, output_dict=True)
    print("\nCLASSIFICATION METRICS PER SIZE CLASS (Test Set):")
    for size_label in ["S", "M", "L", "XL", "XXL"]:
        if size_label in report:
            metrics = report[size_label]
            print(f"  Size {size_label:3s} -> Precision: {metrics['precision']:.4f} | Recall: {metrics['recall']:.4f} | F1: {metrics['f1-score']:.4f} (Support: {metrics['support']})")

    print(f"\n  Overall Macro F1:    {report['macro avg']['f1-score']:.4f}")
    print(f"  Overall Weighted F1: {report['weighted avg']['f1-score']:.4f}")

    # Feature importances
    importances = dict(zip(FEATURE_COLUMNS, rf_model.feature_importances_))
    print("\nFEATURE IMPORTANCE RANKING:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {feat:16s}: {imp * 100:.2f}%")

    # 6. Save Model & Scaler Artifacts
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_model, config.SIZE_MODEL_PATH)
    joblib.dump(scaler, config.SIZE_SCALER_PATH)

    meta = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 150,
        "feature_columns": FEATURE_COLUMNS,
        "classes": list(rf_model.classes_),
        "train_accuracy": round(train_acc, 4),
        "test_accuracy": round(test_acc, 4),
        "macro_f1": round(report['macro avg']['f1-score'], 4),
        "weighted_f1": round(report['weighted avg']['f1-score'], 4),
        "class_metrics": {
            k: {
                "precision": round(v["precision"], 4),
                "recall": round(v["recall"], 4),
                "f1": round(v["f1-score"], 4),
                "support": int(v["support"])
            }
            for k, v in report.items() if k in ["S", "M", "L", "XL", "XXL"]
        },
        "feature_importances": {k: round(v, 4) for k, v in importances.items()}
    }

    with open(config.SIZE_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print("\n" + "=" * 65)
    print(f"[+] Saved Trained Size Model:   {config.SIZE_MODEL_PATH}")
    print(f"[+] Saved Fitted Size Scaler:   {config.SIZE_SCALER_PATH}")
    print(f"[+] Saved Size Model Metadata:  {config.SIZE_META_PATH}")
    print("=" * 65)

    return meta

if __name__ == "__main__":
    train()
