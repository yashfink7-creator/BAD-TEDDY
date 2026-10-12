import mysql.connector
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent))
import config

conn = mysql.connector.connect(**config.DB_CONFIG)
cur = conn.cursor(dictionary=True)

print("=" * 60)
print("CURRENT MYSQL PRODUCTS & CATEGORIES")
print("=" * 60)
cur.execute("SELECT id, name, category, price, stock FROM products ORDER BY id ASC")
rows = cur.fetchall()
for r in rows:
    print(f"ID {r['id']:2d} | Category: '{r['category']}' | Price: Rs.{r['price']} | Stock: {r['stock']} | Name: {r['name']}")

print("\n" + "=" * 60)
print("DISTINCT CATEGORY COUNTS IN MYSQL")
print("=" * 60)
cur.execute("SELECT category, COUNT(*) as count FROM products GROUP BY category")
cat_counts = cur.fetchall()
for c in cat_counts:
    print(f"'{c['category']}': {c['count']} products")

cur.close()
conn.close()
