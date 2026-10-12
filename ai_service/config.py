"""
BAD TEDDY AI Microservice - Configuration
Database credentials & Model file path specifications
"""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
SERVICES_DIR = BASE_DIR / "services"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# MySQL Database Configuration (Matches backend/config/db.php)
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "rubinamirza",
    "database": "bad_teddy",
    "port": 3306
}

# Model File Paths
INTENTS_PATH = DATA_DIR / "intents.json"
SIZE_DATASET_PATH = DATA_DIR / "size_fitting_dataset.csv"

CHATBOT_MODEL_PATH = MODELS_DIR / "chatbot_model.pkl"
CHATBOT_VECTORIZER_PATH = MODELS_DIR / "chatbot_vectorizer.pkl"
CHATBOT_INTENTS_META_PATH = MODELS_DIR / "chatbot_meta.json"

SIZE_MODEL_PATH = MODELS_DIR / "size_model.pkl"
SIZE_SCALER_PATH = MODELS_DIR / "size_scaler.pkl"
SIZE_META_PATH = MODELS_DIR / "size_meta.json"

METRICS_SUMMARY_PATH = MODELS_DIR / "metrics_summary.json"

# AI Service Host/Port
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 5000
