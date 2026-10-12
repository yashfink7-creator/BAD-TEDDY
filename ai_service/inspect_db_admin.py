import mysql.connector
import json
import config

def inspect():
    conn = mysql.connector.connect(**config.DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    print("=== LIVE MYSQL DATABASE INSPECTION FOR ADMIN AI ===")
    tables = ['products', 'orders', 'order_items', 'users', 'reviews', 'cart', 'wishlist', 'user_addresses']

    for t in tables:
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {t}")
        cnt = cursor.fetchone()['cnt']
        print(f"Table: {t:16s} | Records: {cnt}")

    print("\n--- SAMPLE USERS (CUSTOMERS) ---")
    cursor.execute("SELECT id, name, email, phone, created_at FROM users LIMIT 5")
    for r in cursor.fetchall():
        print(r)

    print("\n--- SAMPLE REVIEWS ---")
    cursor.execute("SELECT id, product_id, user_name, rating, comment FROM reviews LIMIT 5")
    for r in cursor.fetchall():
        print(r)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    inspect()
