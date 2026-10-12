"""
BAD TEDDY AI - Size Recommendation Inference Service
Loads the trained Random Forest Classifier and StandardScaler from Phase 3.
Predicts optimal clothing size, class probabilities, and confidence metrics.
"""

import json
import numpy as np
import joblib
from pathlib import Path

import config

class SizeRecommendationService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.meta = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        """Load trained size model, scaler, and metadata."""
        try:
            if not config.SIZE_MODEL_PATH.exists() or not config.SIZE_SCALER_PATH.exists():
                raise FileNotFoundError("Size model artifacts not found on disk.")

            self.model = joblib.load(config.SIZE_MODEL_PATH)
            self.scaler = joblib.load(config.SIZE_SCALER_PATH)

            with open(config.SIZE_META_PATH, "r", encoding="utf-8") as f:
                self.meta = json.load(f)

            self.is_loaded = True
            print(f"[+] Size Model Service Loaded: Random Forest with {len(self.model.classes_)} classes.")
        except Exception as e:
            print(f"[-] Error loading Size model artifacts: {e}")
            self.is_loaded = False

    def predict_size(self, height: float, weight: float, chest: float, waist: float, hips: float, fit: str = "regular"):
        """Run ML prediction on input body dimensions."""
        if not self.is_loaded:
            self.load_artifacts()
            if not self.is_loaded:
                return {"success": False, "error": "Size model is not loaded."}

        # 1. Feature Engineering
        fit = fit.lower().strip() if fit else "regular"
        if fit not in ["slim", "regular", "oversized"]:
            fit = "regular"

        bmi = round(float(weight) / ((float(height) / 100.0) ** 2), 2)
        fit_slim = 1.0 if fit == "slim" else 0.0
        fit_regular = 1.0 if fit == "regular" else 0.0
        fit_oversized = 1.0 if fit == "oversized" else 0.0

        raw_features = np.array([[
            float(height),
            float(weight),
            float(chest),
            float(waist),
            float(hips),
            bmi,
            fit_slim,
            fit_regular,
            fit_oversized
        ]])

        # 2. Scale first 6 numerical features using fitted StandardScaler
        scaled_features = raw_features.copy()
        scaled_features[:, :6] = self.scaler.transform(raw_features[:, :6])

        # 3. Model Inference: Prediction & Class Probabilities
        predicted_size = self.model.predict(scaled_features)[0]
        probabilities = self.model.predict_proba(scaled_features)[0]
        max_prob = float(np.max(probabilities))

        class_probabilities = {
            cls: round(float(prob), 4)
            for cls, prob in zip(self.model.classes_, probabilities)
        }

        # 4. Confidence level assessment
        if max_prob >= 0.85:
            confidence_level = "High Confidence"
        elif max_prob >= 0.65:
            confidence_level = "Good Match"
        else:
            confidence_level = "Moderate Match"

        # 5. Fit Note Generation
        fit_descriptions = {
            "slim": "tailored closer to the body with clean lines.",
            "regular": "classic everyday streetwear comfort with balanced drape.",
            "oversized": "relaxed streetwear drop-shoulder silhouette."
        }

        fit_note = f"Based on your measurements ({height}cm, {weight}kg, chest {chest}cm) and {fit} fit preference, Size {predicted_size} provides the optimal {fit_descriptions.get(fit, 'streetwear fit')}."

        return {
            "success": True,
            "recommended_size": predicted_size,
            "size": predicted_size,
            "confidence": f"{max_prob * 100:.1f}%",
            "confidence_score": round(max_prob, 4),
            "confidence_level": confidence_level,
            "class_probabilities": class_probabilities,
            "bmi": bmi,
            "fit_preference": fit,
            "fit_note": fit_note
        }

# Global singleton instance
size_service = SizeRecommendationService()
