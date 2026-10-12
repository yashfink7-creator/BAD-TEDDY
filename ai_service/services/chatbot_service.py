"""
BAD TEDDY AI - Chatbot NLP Inference & Fashion Assistant Service
Loads the trained ML Intent Classifier & TF-IDF Vectorizer.
Features:
1. NLP Intent Prediction with confidence scoring
2. Direct Anthropometric Size Recommendation via trained Random Forest model
3. Real-time Live MySQL Catalog Search (Size, Price, Category, Budget, Occasion)
4. Dynamic natural conversation & multi-tier domain-specific fallback
"""

import json
import re
import random
import math
from typing import Dict, Any, List, Optional
import numpy as np
import joblib
import mysql.connector

import config
from services.size_service import size_service

class ChatbotService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.meta = None
        self.intents_dict = {}
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        """Load trained model, vectorizer, and intent metadata from disk."""
        try:
            if not config.CHATBOT_MODEL_PATH.exists() or not config.CHATBOT_VECTORIZER_PATH.exists():
                raise FileNotFoundError("Chatbot model artifacts not found on disk.")

            self.model = joblib.load(config.CHATBOT_MODEL_PATH)
            self.vectorizer = joblib.load(config.CHATBOT_VECTORIZER_PATH)

            with open(config.CHATBOT_INTENTS_META_PATH, "r", encoding="utf-8") as f:
                self.meta = json.load(f)

            self.intents_dict = self.meta.get("intent_metadata", {})
            self.is_loaded = True
            print(f"[+] Chatbot NLP Service Loaded: {self.meta.get('num_classes', 28)} intent classes.")
        except Exception as e:
            print(f"[-] Error loading Chatbot artifacts: {e}")
            self.is_loaded = False

    def clean_text(self, text: str) -> str:
        """Clean input text identical to training preprocessing."""
        text = text.lower().strip()
        text = re.sub(r"[^\w\s\₹\$\€\-\'\"]", "", text)
        text = re.sub(r"\s+", " ", text)
        return text

    def extract_slots(self, text: str) -> Dict[str, Any]:
        """Extract measurement constraints, pricing, sizes, category, and fit hints."""
        slots = {
            "height_cm": None,
            "weight_kg": None,
            "chest_cm": None,
            "waist_cm": None,
            "hips_cm": None,
            "size_filter": None,
            "is_cheapest": False,
            "budget_max": None,
            "category": None,
            "fit": None,
            "occasion": None,
            "color": None
        }

        lower = text.lower()

        # 1. Height Extraction (e.g. 175 cm, 175cm, 5'9", 5 ft 9 in, 5.9 ft)
        height_cm_match = re.search(r"(\d{2,3})\s*(?:cm|cms|centimeters)", lower)
        if height_cm_match:
            try:
                h = float(height_cm_match.group(1))
                if 130 <= h <= 230:
                    slots["height_cm"] = h
            except ValueError:
                pass
        
        # Check feet and inches (e.g. 5'9, 5 ft 9, 6ft)
        if not slots["height_cm"]:
            ft_match = re.search(r"(\d)\s*(?:ft|feet|\')\s*(\d{1,2})?\s*(?:in|inches|\")?", lower)
            if ft_match:
                try:
                    ft = float(ft_match.group(1))
                    inches = float(ft_match.group(2)) if ft_match.group(2) else 0.0
                    total_inches = ft * 12 + inches
                    h_calc = round(total_inches * 2.54, 1)
                    if 130 <= h_calc <= 230:
                        slots["height_cm"] = h_calc
                except ValueError:
                    pass

        # 2. Weight Extraction (e.g. 70 kg, 70kg, 70 kgs, 70 kilo, weight 70)
        weight_match = re.search(r"(?:weigh|weight\s*(?:is|of)?)?\s*(\d{2,3})\s*(?:kg|kgs|kilo|kilograms)", lower)
        if weight_match:
            try:
                w = float(weight_match.group(1))
                if 35 <= w <= 180:
                    slots["weight_kg"] = w
            except ValueError:
                pass
        elif re.search(r"(?:i am|i'm)\s*(\d{2,3})\s*kg", lower):
            m = re.search(r"(?:i am|i'm)\s*(\d{2,3})\s*kg", lower)
            slots["weight_kg"] = float(m.group(1))

        # Fallback numeric pair e.g. "175 70" or "180cm 75kg"
        if not slots["height_cm"] or not slots["weight_kg"]:
            pair_match = re.search(r"(\d{3})\s*(?:cm)?\s*(?:and|,)?\s*(\d{2,3})\s*(?:kg)?", lower)
            if pair_match:
                h_val = float(pair_match.group(1))
                w_val = float(pair_match.group(2))
                if 140 <= h_val <= 220 and 40 <= w_val <= 150:
                    slots["height_cm"] = h_val
                    slots["weight_kg"] = w_val

        # 3. Size Filter Extraction (e.g. "in S size", "size M", "in XXL", "small size")
        size_match = re.search(r"\b(?:size\s+([smlx]+|xxl|small|medium|large|xl|xxl)|([smlx]+|xxl)\s+size)\b", lower)
        if size_match:
            raw_size = (size_match.group(1) or size_match.group(2) or "").upper()
            if raw_size == "SMALL": raw_size = "S"
            elif raw_size == "MEDIUM": raw_size = "M"
            elif raw_size == "LARGE": raw_size = "L"
            if raw_size in ["S", "M", "L", "XL", "XXL"]:
                slots["size_filter"] = raw_size
        elif re.search(r"\bproducts?\s+in\s+([smlx]+|xxl)\b", lower):
            sm = re.search(r"\bproducts?\s+in\s+([smlx]+|xxl)\b", lower)
            slots["size_filter"] = sm.group(1).upper()

        # 4. Cheapest / Lowest Price Intent
        if any(w in lower for w in ["cheapest", "lowest price", "lowest cost", "least expensive", "most affordable"]):
            slots["is_cheapest"] = True

        # 5. Budget extraction (e.g. under 2000, 1500 rs, below 1000)
        budget_match = re.search(r"(?:under|below|less than|within|budget of)?\s*(?:₹|rs\.?|inr)?\s*(\d{3,5})\s*(?:₹|rs\.?|inr|rupees|bucks)?", lower)
        if budget_match:
            try:
                extracted = int(budget_match.group(1))
                if 400 <= extracted <= 10000:
                    slots["budget_max"] = extracted
            except ValueError:
                pass

        # 6. Category extraction (Normalized Controlled List - strictly 5 categories)
        if any(w in lower for w in ["hoodie", "hoodies", "sweatshirt"]):
            slots["category"] = "Hoodies"
        elif any(w in lower for w in ["tee", "tees", "tshirt", "t-shirt", "shirt", "top"]):
            slots["category"] = "T-Shirts"
        elif any(w in lower for w in ["cargo", "cargos", "cargo pant", "cargo pants", "utility pant", "jean", "jeans", "denim", "trousers", "pant", "pants"]):
            slots["category"] = "Cargo Pants"
        elif any(w in lower for w in ["sneaker", "sneakers", "shoes", "kicks", "footwear"]):
            slots["category"] = "Sneakers"
        elif any(w in lower for w in ["cap", "caps", "hat", "hats", "beanie", "accessory", "accessories", "chain", "jewelry", "bag"]):
            slots["category"] = "Caps"

        # 7. Fit extraction
        if any(w in lower for w in ["oversized", "baggy", "loose", "drop shoulder"]):
            slots["fit"] = "oversized"
        elif any(w in lower for w in ["slim", "tight", "fitted"]):
            slots["fit"] = "slim"
        elif "regular" in lower:
            slots["fit"] = "regular"

        # 8. Occasion extraction
        if any(w in lower for w in ["college", "campus", "university", "class", "fest"]):
            slots["occasion"] = "college"
        elif any(w in lower for w in ["party", "club", "clubbing", "nightout", "rave", "concert"]):
            slots["occasion"] = "party"
        elif any(w in lower for w in ["trip", "travel", "vacation", "airport", "holiday", "getaway"]):
            slots["occasion"] = "trip"
        elif any(w in lower for w in ["date", "dinner", "romantic"]):
            slots["occasion"] = "date"
        elif any(w in lower for w in ["gym", "workout", "pump cover", "training"]):
            slots["occasion"] = "gym"

        # 9. Color extraction
        for color_name in ["black", "white", "grey", "gray", "noir", "stone", "beige"]:
            if color_name in lower:
                slots["color"] = color_name
                break

        return slots

    def fetch_mysql_products(
        self,
        category: Optional[str] = None,
        budget_max: Optional[float] = None,
        size_filter: Optional[str] = None,
        is_cheapest: bool = False,
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        """Query live MySQL database for products matching the intent/slots."""
        products = []
        try:
            conn = mysql.connector.connect(**config.DB_CONFIG)
            cursor = conn.cursor(dictionary=True)

            query = "SELECT id, name, description, price, category, style, image, badge, rating, sizes, stock FROM products WHERE 1=1"
            params = []

            if category:
                query += " AND category = %s"
                params.append(category)

            if budget_max:
                query += " AND price <= %s"
                params.append(float(budget_max))

            if size_filter:
                query += " AND (sizes LIKE %s OR sizes LIKE %s OR sizes LIKE %s OR sizes LIKE %s OR sizes = %s)"
                params.extend([
                    f"%{size_filter},%",
                    f"%,{size_filter}%",
                    f"%, {size_filter}%",
                    f"%{size_filter}%",
                    size_filter
                ])

            if is_cheapest:
                query += " ORDER BY price ASC LIMIT %s"
            else:
                query += " ORDER BY rating DESC, is_best_seller DESC, is_trending DESC LIMIT %s"

            params.append(limit)

            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            for row in rows:
                products.append({
                    "id": row["id"],
                    "name": row["name"],
                    "price": float(row["price"]),
                    "category": row["category"],
                    "style": row["style"],
                    "image": row["image"],
                    "badge": row["badge"] or "AI Pick",
                    "rating": float(row["rating"]) if row["rating"] else 4.8,
                    "sizes": row.get("sizes", "S,M,L,XL,XXL"),
                    "stock": int(row.get("stock", 15))
                })
        except Exception as e:
            print(f"[-] MySQL fetch error in chatbot service: {e}")

        return products

    def predict(self, user_message: str) -> Dict[str, Any]:
        """Execute complete NLP inference & intelligent dynamic response on user message."""
        if not self.is_loaded:
            self.load_artifacts()
            if not self.is_loaded:
                return {
                    "success": False,
                    "error": "Chatbot model is not loaded."
                }

        cleaned = self.clean_text(user_message)
        if not cleaned:
            return {
                "success": True,
                "intent": "fallback",
                "confidence": 0.0,
                "reply": "I'm listening! Tell me what style, occasion, size, or outfit you're looking for.",
                "recommended_products": []
            }

        # Step 1: Extract all parameters/slots
        slots = self.extract_slots(user_message)

        # Step 2: Check for DIRECT MEASUREMENT / SIZE PREDICTION IN CHAT
        if slots["height_cm"] is not None and slots["weight_kg"] is not None:
            height = float(slots["height_cm"])
            weight = float(slots["weight_kg"])
            fit_pref = slots["fit"] or "regular"

            # Estimate standard anthropometric baseline if body metrics omitted
            chest = slots["chest_cm"] or round(weight * 1.35 + (height - 170) * 0.1, 1)
            waist = slots["waist_cm"] or round(weight * 1.15 + (height - 170) * 0.05, 1)
            hips = slots["hips_cm"] or round(weight * 1.38 + (height - 170) * 0.08, 1)

            # Call trained Random Forest Size Model
            size_result = size_service.predict_size(
                height=height,
                weight=weight,
                chest=chest,
                waist=waist,
                hips=hips,
                fit=fit_pref
            )

            predicted_size = size_result["size"]
            conf_str = size_result["confidence"]
            fit_note = size_result["fit_note"]

            reply = (
                f"Based on your body measurements (**{height:.0f} cm, {weight:.0f} kg**) and {fit_pref} fit preference, "
                f"our trained AI Size Model recommends **Size {predicted_size}** ({conf_str} confidence).\n\n"
                f"{fit_note}\n\n"
                f"Here are our best in-stock streetwear drops available in Size {predicted_size}:"
            )

            matched_products = self.fetch_mysql_products(size_filter=predicted_size, limit=4)
            if not matched_products:
                matched_products = self.fetch_mysql_products(limit=4)

            return {
                "success": True,
                "intent": "size_fitting_query",
                "confidence": 0.98,
                "confidence_pct": "98.0%",
                "reply": reply,
                "is_size_recommendation": True,
                "predicted_size": predicted_size,
                "size_details": size_result,
                "extracted_slots": slots,
                "recommended_products": matched_products
            }

        # Step 3: Check for CHEAPEST / LOWEST PRICE QUERY
        if slots["is_cheapest"]:
            target_cat = slots["category"]
            matched_products = self.fetch_mysql_products(
                category=target_cat,
                is_cheapest=True,
                limit=3
            )
            if matched_products:
                top = matched_products[0]
                cat_label = f" {target_cat.lower()}" if target_cat else " streetwear item"
                reply = (
                    f"Our most affordable{cat_label} is the **{top['name']}** at just **₹{top['price']:,.0f}**! "
                    f"It's crafted from premium heavyweight cotton with our signature relaxed drape. "
                    f"Here are the lowest-priced options available right now in our live catalog:"
                )
            else:
                reply = "Check out our most affordable streetwear drops below!"
                matched_products = self.fetch_mysql_products(is_cheapest=True, limit=3)

            return {
                "success": True,
                "intent": "product_cheapest",
                "confidence": 0.95,
                "confidence_pct": "95.0%",
                "reply": reply,
                "extracted_slots": slots,
                "recommended_products": matched_products
            }

        # Step 4: Check for DIRECT SIZE INVENTORY QUERY (e.g. "products in S size")
        if slots["size_filter"]:
            req_size = slots["size_filter"]
            matched_products = self.fetch_mysql_products(
                size_filter=req_size,
                category=slots["category"],
                budget_max=slots["budget_max"],
                limit=4
            )
            reply = (
                f"Here are the live Bad Teddy pieces currently in stock and available in **Size {req_size}**! "
                f"All items feature our signature relaxed drop-shoulder cut."
            )
            return {
                "success": True,
                "intent": "product_search_size",
                "confidence": 0.95,
                "confidence_pct": "95.0%",
                "reply": reply,
                "extracted_slots": slots,
                "recommended_products": matched_products
            }

        # Step 5: Check for TRIP / TRAVEL OCCASION
        if slots["occasion"] == "trip":
            matched_products = self.fetch_mysql_products(category="Cargo Pants", limit=2) + self.fetch_mysql_products(category="T-Shirts", limit=2)
            reply = (
                "For a trip or travel, utility and comfort are essential! "
                "I recommend pairing our **Relaxed Cargo Pants** (multi-functional pockets for your passport & essentials) "
                "with our breathable **Oversized Signature Tee** (₹999). "
                "For flights or cooler evenings, layer with our **Premium Black Hoodie** and finish with the **Signature Street Cap**.\n\n"
                "Here are the top pieces to pack for your trip:"
            )
            return {
                "success": True,
                "intent": "outfit_trip_travel",
                "confidence": 0.95,
                "confidence_pct": "95.0%",
                "reply": reply,
                "extracted_slots": slots,
                "recommended_products": matched_products[:4]
            }

        # Step 6: Check for CONVERSATIONAL CONTINUATION ("anything else?")
        if any(p in cleaned for p in ["anything else", "what else", "tell me more", "other options", "suggest something else"]):
            matched_products = self.fetch_mysql_products(category="Caps", limit=2) + self.fetch_mysql_products(category="Hoodies", limit=2)
            reply = (
                "You can also level up your look with our streetwear accessories — like our **Signature Teddy Cap** (₹799) "
                "which adds instant attitude to any oversized tee or cargo combo!\n\n"
                "Another pro styling tip: try monochrome layering with an oversized hoodie under a structured jacket for effortless depth. "
                "Check out these complementary pieces from our catalog:"
            )
            return {
                "success": True,
                "intent": "conversational_continuation",
                "confidence": 0.95,
                "confidence_pct": "95.0%",
                "reply": reply,
                "extracted_slots": slots,
                "recommended_products": matched_products[:4]
            }

        # Step 7: Standard NLP Vectorizer & Model Intent Classification
        vec = self.vectorizer.transform([cleaned])
        pred_intent = self.model.predict(vec)[0]
        probabilities = self.model.predict_proba(vec)[0]
        confidence = float(np.max(probabilities))

        # Check intent metadata
        intent_info = self.intents_dict.get(pred_intent, {})
        responses = intent_info.get("responses", [])

        if responses:
            reply = random.choice(responses)
        else:
            reply = "Here are streetwear recommendations from our live catalog:"

        category_target = slots["category"] or intent_info.get("category_hint")
        budget_target = slots["budget_max"] or intent_info.get("budget_max")

        matched_products = self.fetch_mysql_products(
            category=category_target,
            budget_max=budget_target,
            size_filter=slots["size_filter"],
            is_cheapest=slots["is_cheapest"],
            limit=4
        )

        # Fallback products if specific category had none
        if not matched_products:
            matched_products = self.fetch_mysql_products(limit=4)

        return {
            "success": True,
            "intent": pred_intent,
            "confidence": round(confidence, 4),
            "confidence_pct": f"{confidence * 100:.1f}%",
            "reply": reply,
            "extracted_slots": slots,
            "recommended_products": matched_products
        }

# Global singleton instance
chatbot_service = ChatbotService()
