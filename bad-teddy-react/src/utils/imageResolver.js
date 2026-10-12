import prod1 from "../assets/prod1.jpeg";
import prod2 from "../assets/prod2.jpg";
import prod3 from "../assets/prod3.jpg";
import prod4 from "../assets/prod4.jpg";
import prod5 from "../assets/prod5.png";
import b1 from "../assets/b1.png";
import bannerimg from "../assets/bannerimg.jpg";
import caps from "../assets/caps.png";
import crops from "../assets/crops.png";
import hoodie from "../assets/hoodie.png";
import tshirt from "../assets/tshirt.png";
import shirt from "../assets/shirt.png";
import jeans from "../assets/jeans.png";

const assetMap = {
    "prod1.jpeg": prod1,
    "prod1.jpg": prod1,
    "prod2.jpg": prod2,
    "prod2.jpeg": prod2,
    "prod3.jpg": prod3,
    "prod3.jpeg": prod3,
    "prod4.jpg": prod4,
    "prod4.jpeg": prod4,
    "prod5.png": prod5,
    "prod5.jpg": prod5,
    "b1.png": b1,
    "bannerimg.jpg": bannerimg,
    "caps.png": caps,
    "cap.png": caps,
    "crops.png": crops,
    "cargo.png": crops,
    "hoodie.png": hoodie,
    "hoodie.jpg": prod2,
    "tshirt.png": tshirt,
    "tshirt.jpg": tshirt,
    "tshirt.jpeg": tshirt,
    "tshirt": tshirt,
    "t-shirt": tshirt,
    "t-shirts": tshirt,
    "shirt.png": shirt,
    "shirt.jpg": shirt,
    "shirt": shirt,
    "shirts": shirt,
    "jeans.png": jeans,
    "jeans.jpg": jeans,
    "jeans.jpeg": jeans,
    "jean.png": jeans,
    "jeans": jeans
};

/**
 * Universal product image resolver for Bad Teddy e-commerce.
 * Maps MySQL image string/path to appropriate bundled asset or Apache backend URL.
 * 
 * @param {string|null|undefined} img - Filename, relative path, or URL from MySQL
 * @returns {string} Fully resolved image URL or imported bundled asset
 */
export const resolveProductImage = (img) => {
    if (!img) return prod1;
    if (typeof img !== "string") return img;

    const trimmed = img.trim();
    if (!trimmed) return prod1;

    // 1. Data URLs or blob preview URLs
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
        return trimmed;
    }

    // 2. Full HTTP/HTTPS URLs (e.g. from Apache backend)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    // 3. Extract clean base filename by stripping common prefixes
    const cleanName = trimmed.replace(/^\/?(backend\/)?(uploads\/|images\/)?/, "");
    const baseName = cleanName.split("/").pop() || "";

    // 4. Exact match in bundled assets
    if (assetMap[baseName]) {
        return assetMap[baseName];
    }
    if (assetMap[cleanName]) {
        return assetMap[cleanName];
    }
    if (assetMap[trimmed]) {
        return assetMap[trimmed];
    }

    // 5. Backend uploaded dynamic image (e.g. "uploads/prod_123.jpg" or "backend/uploads/prod_123.jpg")
    if (trimmed.includes("uploads/")) {
        const uploadFile = trimmed.split("uploads/").pop();
        return `http://localhost/BAD%20TEDDY/backend/uploads/${uploadFile}`;
    }

    // 6. Public static image folder (e.g. "images/filename.jpg")
    if (trimmed.includes("images/")) {
        const imgFile = trimmed.split("images/").pop();
        return `http://localhost/BAD%20TEDDY/images/${imgFile}`;
    }

    // 7. If it is a filename with an image extension, default to backend uploads / images URL
    if (/\.(jpe?g|png|webp|gif)$/i.test(cleanName)) {
        return `http://localhost/BAD%20TEDDY/backend/uploads/${cleanName}`;
    }

    return prod1;
};

export default resolveProductImage;
