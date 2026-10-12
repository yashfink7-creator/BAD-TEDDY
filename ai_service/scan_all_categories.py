import re
from pathlib import Path

ROOT = Path("c:/xampp/htdocs/BAD TEDDY")

files_to_check = [
    ROOT / "bad-teddy-react/src/components/Home.jsx",
    ROOT / "bad-teddy-react/src/components/shop.jsx",
    ROOT / "bad-teddy-react/src/components/product.jsx",
    ROOT / "bad-teddy-react/src/pages/adminproduct.jsx",
    ROOT / "bad-teddy-react/src/pages/adminreport.jsx",
    ROOT / "bad-teddy-react/src/pages/adminai.jsx",
    ROOT / "bad-teddy-react/src/pages/dashboard.jsx",
    ROOT / "backend/api/products.php",
    ROOT / "ai_service/services/chatbot_service.py",
    ROOT / "ai_service/services/recommender_service.py",
    ROOT / "ai_service/services/admin_ai_service.py",
]

print("=" * 70)
print("SCANNING CODEBASE FOR CATEGORY USAGES AND DEFINITIONS")
print("=" * 70)

keywords = ["category", "categories", "T-Shirts", "Hoodies", "Cargo", "Jeans", "Sneakers", "Caps", "Accessories", "Bottoms"]

for fpath in files_to_check:
    if not fpath.exists():
        print(f"[!] Missing file: {fpath}")
        continue
    content = fpath.read_text(encoding="utf-8", errors="ignore")
    lines = content.splitlines()
    print(f"\n--- {fpath.relative_to(ROOT)} ---")
    matches = []
    for idx, line in enumerate(lines, 1):
        if any(k in line for k in ["categories =", "categoryFilter", "categories.map", "Category", "category:", "category :", "All Categories", "categoriesList", "<select", "<option"]):
            matches.append((idx, line.strip()))
    for idx, l in matches[:10]:
        print(f"  Line {idx:4d}: {l[:100]}")
    if len(matches) > 10:
        print(f"  ... and {len(matches) - 10} more matches")
