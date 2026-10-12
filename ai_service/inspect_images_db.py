import mysql.connector
import json

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="rubinamirza",
    database="bad_teddy"
)

cursor = db.cursor(dictionary=True)
cursor.execute("SELECT id, name, category, image FROM products ORDER BY id ASC")
rows = cursor.fetchall()
print("=== PRODUCTS IN MYSQL ===")
for r in rows:
    print(f"ID: {r['id']:2d} | Name: {r['name']:25s} | Category: {r['category']:12s} | Image: {r['image']}")
cursor.close()
db.close()
