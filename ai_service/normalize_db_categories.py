import mysql.connector
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent))
import config

conn = mysql.connector.connect(**config.DB_CONFIG)
cur = conn.cursor(dictionary=True)

print("=" * 65)
print("EXECUTING DATABASE CATEGORY NORMALIZATION")
print("=" * 65)

# 1. Update Cargo items from 'Jeans' or 'Bottoms' to 'Cargo Pants'
cur.execute("""
    UPDATE products 
    SET category = 'Cargo Pants' 
    WHERE name LIKE '%Cargo%' OR category = 'Bottoms' OR (category = 'Jeans' AND name LIKE '%Cargo%')
""")
print(f"[+] Updated Cargo Pants records: {cur.rowcount} rows affected.")

# 2. Normalize any 'Cap' or 'Capsule' to 'Caps'
cur.execute("""
    UPDATE products 
    SET category = 'Caps' 
    WHERE category IN ('Cap', 'Hat', 'Hats') OR (name LIKE '%Cap%' AND category NOT IN ('T-Shirts', 'Hoodies', 'Jeans', 'Cargo Pants', 'Sneakers', 'Accessories'))
""")
print(f"[+] Normalized Caps records: {cur.rowcount} rows affected.")

# 3. Normalize any 'T-Shirt', 'Tshirt', 'Tee' to 'T-Shirts'
cur.execute("""
    UPDATE products 
    SET category = 'T-Shirts' 
    WHERE category IN ('T-Shirt', 'Tshirt', 'Tshirts', 'Tee', 'Tees', 'Shirts')
""")
print(f"[+] Normalized T-Shirts records: {cur.rowcount} rows affected.")

# 4. Normalize any 'Hoodie' to 'Hoodies'
cur.execute("""
    UPDATE products 
    SET category = 'Hoodies' 
    WHERE category IN ('Hoodie', 'Sweatshirt', 'Sweatshirts')
""")
print(f"[+] Normalized Hoodies records: {cur.rowcount} rows affected.")

# 5. Normalize any 'Sneaker' or 'Shoes' to 'Sneakers'
cur.execute("""
    UPDATE products 
    SET category = 'Sneakers' 
    WHERE category IN ('Sneaker', 'Shoes', 'Footwear')
""")
print(f"[+] Normalized Sneakers records: {cur.rowcount} rows affected.")

# 6. Normalize any 'Accessory' to 'Accessories'
cur.execute("""
    UPDATE products 
    SET category = 'Accessories' 
    WHERE category IN ('Accessory', 'Jewelry', 'Bags')
""")
print(f"[+] Normalized Accessories records: {cur.rowcount} rows affected.")

conn.commit()

print("\n" + "=" * 65)
print("VERIFYING POST-NORMALIZATION MYSQL PRODUCTS")
print("=" * 65)
cur.execute("SELECT id, name, category, price, stock FROM products ORDER BY id ASC")
rows = cur.fetchall()
for r in rows:
    print(f"ID {r['id']:2d} | Category: '{r['category']}' | Name: {r['name']}")

print("\n" + "=" * 65)
print("UPDATED DISTINCT CATEGORY COUNTS IN MYSQL")
print("=" * 65)
cur.execute("SELECT category, COUNT(*) as count FROM products GROUP BY category")
cat_counts = cur.fetchall()
for c in cat_counts:
    print(f"'{c['category']}': {c['count']} products")

cur.close()
conn.close()
print("\n[+] Database Category Normalization Complete!")
