"""
BAD TEDDY AI - Dynamic Product Recommendation Service
Utilizes Content-Based TF-IDF Vector Embeddings and Cosine Similarity
over the live MySQL `bad_teddy.products` catalog.
"""

import time
import numpy as np
import mysql.connector
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import config

class ProductRecommenderService:
    def __init__(self):
        self.products = []
        self.product_map = {}
        self.tfidf_matrix = None
        self.vectorizer = None
        self.sim_matrix = None
        self.last_sync = 0
        self.sync_ttl = 300  # Reload every 5 mins or on demand
        self.sync_catalog()

    def sync_catalog(self, force=False):
        """Fetch all products from live MySQL database and recompute similarity matrix."""
        now = time.time()
        if not force and (now - self.last_sync < self.sync_ttl) and self.products:
            return

        try:
            conn = mysql.connector.connect(**config.DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, name, description, price, category, style, image, badge, rating, stock, is_best_seller, is_trending, is_new
                FROM products
                ORDER BY id ASC
            """)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            if not rows:
                print("[-] Warning: No products found in MySQL database.")
                return

            self.products = []
            self.product_map = {}

            documents = []
            for r in rows:
                p_id = r["id"]
                price = float(r["price"])
                tier = "budget" if price < 1000 else ("mid_range" if price < 2000 else "premium")
                
                # Boost category & style tokens for higher domain relevance
                doc = f"{r['category']} {r['category']} {r['style']} {r['style']} {r['name']} {r['badge'] or ''} {r['description'] or ''} {tier}"
                documents.append(doc)

                p_data = {
                    "id": p_id,
                    "name": r["name"],
                    "price": price,
                    "category": r["category"],
                    "style": r["style"],
                    "image": r["image"],
                    "badge": r["badge"] or ("BEST SELLER" if r["is_best_seller"] else ("TRENDING" if r["is_trending"] else "AI Pick")),
                    "rating": float(r["rating"]) if r["rating"] else 4.8,
                    "stock": r["stock"]
                }
                self.products.append(p_data)
                self.product_map[p_id] = p_data

            # Compute TF-IDF Matrix & Cosine Similarity
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
            self.tfidf_matrix = self.vectorizer.fit_transform(documents)
            self.sim_matrix = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)
            self.last_sync = now

            print(f"[+] Recommender Engine Synced: {len(self.products)} products indexed from MySQL.")
        except Exception as e:
            print(f"[-] Recommender sync error: {e}")

    def get_similar_products(self, product_id: int, limit: int = 4):
        """Return top-K similar products based on content cosine similarity."""
        self.sync_catalog()

        if not self.products or self.sim_matrix is None:
            return []

        # Find index of target product
        target_idx = None
        for idx, p in enumerate(self.products):
            if p["id"] == int(product_id):
                target_idx = idx
                break

        if target_idx is None:
            # Return top bestsellers if product not found
            return [p for p in self.products[:limit]]

        # Rank all products by similarity score
        scores = list(enumerate(self.sim_matrix[target_idx]))
        scores = sorted(scores, key=lambda x: x[1], reverse=True)

        results = []
        for idx, sim_score in scores:
            if idx == target_idx:
                continue  # Skip self

            p = self.products[idx]
            results.append({
                **p,
                "similarity_score": round(float(sim_score), 4),
                "ai_tag": "Similar Style"
            })

            if len(results) >= limit:
                break

        return results

    def get_complete_the_look(self, product_id: int, limit: int = 4):
        """Return cross-category complementary products to build an outfit."""
        self.sync_catalog()

        if not self.products:
            return []

        target_product = self.product_map.get(int(product_id))
        target_cat = target_product["category"].lower() if target_product else ""

        # Cross-category pairings
        # If looking at Top (Tee/Hoodie) -> suggest Bottoms (Cargos/Jeans) + Accessories (Caps)
        results = []
        for p in self.products:
            if p["id"] == int(product_id):
                continue
            
            p_cat = p["category"].lower()
            if p_cat != target_cat:
                results.append({
                    **p,
                    "ai_tag": "Complete The Look"
                })

            if len(results) >= limit:
                break

        # Fallback if catalog has limited cross-categories
        if len(results) < limit:
            for p in self.products:
                if p["id"] != int(product_id) and p not in results:
                    results.append({**p, "ai_tag": "Recommended"})
                if len(results) >= limit:
                    break

        return results

    def get_all_recommendations(self, product_id: int = None, limit: int = 4):
        """Unified endpoint return for product details page."""
        self.sync_catalog()
        
        if product_id:
            similar = self.get_similar_products(product_id, limit=limit)
            complete_look = self.get_complete_the_look(product_id, limit=limit)
        else:
            similar = self.products[:limit]
            complete_look = self.products[limit:limit*2] if len(self.products) >= limit*2 else self.products[:limit]

        return {
            "success": True,
            "product_id": product_id,
            "recommendations": similar,
            "ai_recommendations": similar,
            "complete_look_products": complete_look,
            "total_catalog_items": len(self.products)
        }

# Global singleton instance
recommender_service = ProductRecommenderService()
