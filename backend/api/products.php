<?php
/**
 * BAD TEDDY E-Commerce - Products API
 * GET    /products.php?id=X       => Single product detail + reviews + related products + multi-image gallery
 * GET    /products.php            => Product catalog with filters + multi-image gallery support
 * POST   /products.php            => Add new product OR update product (action=edit/update) OR delete (action=delete)
 * PUT    /products.php            => Update existing product
 * DELETE /products.php?id=X       => Delete product
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

/* =========================================================
   HELPER FUNCTIONS FOR GALLERY IMAGES & PATH SANITIZATION
========================================================= */

/**
 * Sanitize an image path or filename to prevent storing local machine paths
 * such as "C:\Users\...", "C:\fakepath\...", or raw system paths.
 */
function sanitizeImagePath($path) {
    if (empty($path) || !is_string($path)) {
        return null;
    }
    $trimmed = trim($path);
    if ($trimmed === "" || $trimmed === "0" || $trimmed === "null" || $trimmed === "undefined") {
        return null;
    }

    // Strip full Windows drive paths like C:\Users\... or Unix /home/...
    if (preg_match('/^[a-zA-Z]:[\\\\\/]/', $trimmed) || preg_match('/^[\\\\\/]Users[\\\\\/]/i', $trimmed)) {
        $trimmed = basename(str_replace('\\', '/', $trimmed));
    }

    // Strip browser security pseudo-paths like C:\fakepath\photo.jpg
    $trimmed = preg_replace('/^.*fakepath[\\\\\/]/i', '', $trimmed);

    // Normalize forward slashes
    $trimmed = str_replace('\\', '/', $trimmed);

    // Strip leading slashes
    $trimmed = ltrim($trimmed, "/");

    return $trimmed !== "" ? $trimmed : null;
}

/**
 * Fetch all gallery images for one or multiple product IDs.
 * Returns an associative map: [product_id => ['images' => [...], 'gallery' => ['front' => ..., 'back' => ...]]]
 */
function fetchProductImagesMap($conn, $productIds) {
    if (empty($productIds)) {
        return [];
    }

    $validIds = array_filter(array_map('intval', (array)$productIds), function($id) {
        return $id > 0;
    });

    if (empty($validIds)) {
        return [];
    }

    $inClause = implode(',', $validIds);
    $sql = "SELECT product_id, image_path, image_type, sort_order 
            FROM product_images 
            WHERE product_id IN ($inClause) 
            ORDER BY sort_order ASC, id ASC";

    $result = $conn->query($sql);
    $map = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $pId = (int)$row['product_id'];
            if (!isset($map[$pId])) {
                $map[$pId] = [
                    'images' => [],
                    'gallery' => [
                        'front' => null,
                        'back' => null,
                        'sitting' => null,
                        'standing' => null
                    ]
                ];
            }

            $cleanPath = sanitizeImagePath($row['image_path']);
            if ($cleanPath) {
                if (!in_array($cleanPath, $map[$pId]['images'])) {
                    $map[$pId]['images'][] = $cleanPath;
                }
                $type = strtolower(trim($row['image_type']));
                if (array_key_exists($type, $map[$pId]['gallery'])) {
                    $map[$pId]['gallery'][$type] = $cleanPath;
                }
            }
        }
    }

    return $map;
}

/**
 * Persist gallery images for a product into product_images table.
 * Supports 4 slots: front (0), back (1), sitting (2), standing (3).
 * Also synchronizes the primary products.image with the front/first available image.
 */
function syncProductImages($conn, $productId, $galleryInput, $primaryFallback = null) {
    $productId = (int)$productId;
    if ($productId <= 0) {
        return;
    }

    $slotDefinitions = [
        'front'    => 0,
        'back'     => 1,
        'sitting'  => 2,
        'standing' => 3
    ];

    $slotsToSave = [];

    if (is_array($galleryInput)) {
        // Check if associative keys (front, back, sitting, standing)
        $hasSlotKeys = false;
        foreach (array_keys($slotDefinitions) as $slotKey) {
            if (array_key_exists($slotKey, $galleryInput)) {
                $hasSlotKeys = true;
                break;
            }
        }

        if ($hasSlotKeys) {
            foreach ($slotDefinitions as $slotKey => $sortOrder) {
                if (!empty($galleryInput[$slotKey])) {
                    $cleaned = sanitizeImagePath($galleryInput[$slotKey]);
                    if ($cleaned) {
                        $slotsToSave[] = [
                            'path' => $cleaned,
                            'type' => $slotKey,
                            'order' => $sortOrder
                        ];
                    }
                }
            }
        } else {
            // Sequential array of image paths
            $slotKeys = array_keys($slotDefinitions);
            foreach ($galleryInput as $idx => $img) {
                $cleaned = sanitizeImagePath($img);
                if ($cleaned) {
                    $slotKey = $slotKeys[$idx] ?? 'gallery';
                    $slotsToSave[] = [
                        'path' => $cleaned,
                        'type' => $slotKey,
                        'order' => $idx
                    ];
                }
            }
        }
    }

    // Delete existing gallery images for this product
    $del = $conn->prepare("DELETE FROM product_images WHERE product_id = ?");
    if ($del) {
        $del->bind_param("i", $productId);
        $del->execute();
        $del->close();
    }

    // Insert new gallery slots
    if (!empty($slotsToSave)) {
        $ins = $conn->prepare("INSERT INTO product_images (product_id, image_path, image_type, sort_order) VALUES (?, ?, ?, ?)");
        if ($ins) {
            foreach ($slotsToSave as $item) {
                $ins->bind_param("issi", $productId, $item['path'], $item['type'], $item['order']);
                $ins->execute();
            }
            $ins->close();
        }
    }

    // Determine the primary image to update products.image (keep backward compatibility)
    $primaryImage = null;
    foreach ($slotsToSave as $item) {
        if ($item['type'] === 'front') {
            $primaryImage = $item['path'];
            break;
        }
    }
    if (!$primaryImage && !empty($slotsToSave)) {
        $primaryImage = $slotsToSave[0]['path'];
    }
    if (!$primaryImage && $primaryFallback) {
        $primaryImage = sanitizeImagePath($primaryFallback);
    }

    if ($primaryImage) {
        $up = $conn->prepare("UPDATE products SET image = ? WHERE id = ?");
        if ($up) {
            $up->bind_param("si", $primaryImage, $productId);
            $up->execute();
            $up->close();
        }
    }
}

/* =========================================================
   1. GET REQUESTS (Single Product OR Catalog List)
========================================================= */
if ($method === "GET") {

    /* -----------------------------------------------------
       A. GET SINGLE PRODUCT DETAIL
    ----------------------------------------------------- */
    if (isset($_GET["id"]) && !empty($_GET["id"])) {
        $id = intval($_GET["id"]);

        $stmt = $conn->prepare(
            "SELECT
                id,
                name,
                description,
                price,
                category,
                style,
                image,
                badge,
                is_new,
                is_trending,
                is_best_seller,
                stock,
                sizes,
                rating,
                created_at
             FROM products
             WHERE id = ?
             LIMIT 1"
        );

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Database query failed: " . $conn->error
            ]);
            exit;
        }

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Product not found."
            ]);
            $stmt->close();
            $conn->close();
            exit;
        }

        $product = $result->fetch_assoc();
        $stmt->close();

        // Format fields
        $product["id"] = (int)$product["id"];
        $product["price"] = (float)$product["price"];
        $product["rating"] = (float)($product["rating"] ?? 4.5);
        $product["stock"] = (int)($product["stock"] ?? 10);
        $product["is_new"] = (bool)$product["is_new"];
        $product["is_trending"] = (bool)$product["is_trending"];
        $product["is_best_seller"] = (bool)$product["is_best_seller"];
        $product["image"] = sanitizeImagePath($product["image"]) ?: "prod1.jpeg";

        // Format sizes array
        if (!empty($product["sizes"])) {
            $product["sizes"] = array_values(
                array_filter(
                    array_map(
                        "trim",
                        explode(",", $product["sizes"])
                    )
                )
            );
        } else {
            $product["sizes"] = ["S", "M", "L", "XL", "XXL"];
        }

        // Fetch gallery images
        $galleryMap = fetchProductImagesMap($conn, [$id]);
        if (isset($galleryMap[$id]) && !empty($galleryMap[$id]['images'])) {
            $product["images"] = $galleryMap[$id]['images'];
            $product["gallery"] = $galleryMap[$id]['gallery'];
            // Ensure primary image matches front view if available
            if (!empty($product["gallery"]["front"])) {
                $product["image"] = $product["gallery"]["front"];
            }
        } else {
            // Backward-compatibility: product has only 1 image
            $product["images"] = [$product["image"]];
            $product["gallery"] = [
                "front" => $product["image"],
                "back" => null,
                "sitting" => null,
                "standing" => null
            ];
        }

        // Fetch customer reviews for this product
        $reviews = [];
        $revStmt = $conn->prepare(
            "SELECT id, user_name AS name, rating, comment AS text, created_at
             FROM reviews
             WHERE product_id = ?
             ORDER BY id DESC"
        );
        if ($revStmt) {
            $revStmt->bind_param("i", $id);
            $revStmt->execute();
            $revRes = $revStmt->get_result();
            while ($rev = $revRes->fetch_assoc()) {
                $reviews[] = [
                    "id" => (int)$rev["id"],
                    "name" => $rev["name"],
                    "rating" => (float)$rev["rating"],
                    "text" => $rev["text"],
                    "created_at" => $rev["created_at"]
                ];
            }
            $revStmt->close();
        }
        $product["reviews"] = $reviews;

        // Fetch related products (same category or style, excluding current)
        $relStmt = $conn->prepare(
            "SELECT id, name, price, image, category, badge, rating
             FROM products
             WHERE (category = ? OR style = ?) AND id != ?
             LIMIT 4"
        );
        $related = [];
        if ($relStmt) {
            $relStmt->bind_param("ssi", $product["category"], $product["style"], $id);
            $relStmt->execute();
            $relRes = $relStmt->get_result();
            while ($rel = $relRes->fetch_assoc()) {
                $rel["id"] = (int)$rel["id"];
                $rel["price"] = (float)$rel["price"];
                $rel["rating"] = (float)($rel["rating"] ?? 4.5);
                $rel["image"] = sanitizeImagePath($rel["image"]) ?: "prod1.jpeg";
                $related[] = $rel;
            }
            $relStmt->close();
        }
        $product["related_products"] = $related;

        echo json_encode([
            "success" => true,
            "product" => $product
        ]);
        $conn->close();
        exit;
    }

    /* -----------------------------------------------------
       B. GET PRODUCT CATALOG (WITH FILTERS, SEARCH, SORT)
    ----------------------------------------------------- */
    $whereConditions = [];
    $params = [];
    $types = "";

    // Search filter
    if (isset($_GET["search"]) && trim($_GET["search"]) !== "") {
        $search = "%" . trim($_GET["search"]) . "%";
        $whereConditions[] = "(name LIKE ? OR description LIKE ? OR category LIKE ? OR style LIKE ?)";
        $params[] = $search;
        $params[] = $search;
        $params[] = $search;
        $params[] = $search;
        $types .= "ssss";
    }

    // Category filter
    if (isset($_GET["category"]) && trim($_GET["category"]) !== "" && strtolower($_GET["category"]) !== "all" && strtolower($_GET["category"]) !== "all categories") {
        $whereConditions[] = "category = ?";
        $params[] = trim($_GET["category"]);
        $types .= "s";
    }

    // Style filter
    if (isset($_GET["style"]) && trim($_GET["style"]) !== "" && strtolower($_GET["style"]) !== "all") {
        $whereConditions[] = "style = ?";
        $params[] = trim($_GET["style"]);
        $types .= "s";
    }

    // Max Price filter
    if (isset($_GET["max_price"]) && floatval($_GET["max_price"]) > 0) {
        $whereConditions[] = "price <= ?";
        $params[] = floatval($_GET["max_price"]);
        $types .= "d";
    }

    // Min Rating filter
    if (isset($_GET["min_rating"]) && floatval($_GET["min_rating"]) > 0) {
        $whereConditions[] = "rating >= ?";
        $params[] = floatval($_GET["min_rating"]);
        $types .= "d";
    }

    $whereSql = "";
    if (!empty($whereConditions)) {
        $whereSql = "WHERE " . implode(" AND ", $whereConditions);
    }

    // Sorting
    $orderBy = "ORDER BY id ASC";
    if (isset($_GET["sort"])) {
        switch (strtolower(trim($_GET["sort"]))) {
            case "price-low-high":
            case "price_asc":
            case "price low-high":
                $orderBy = "ORDER BY price ASC";
                break;
            case "price-high-low":
            case "price_desc":
            case "price high-low":
                $orderBy = "ORDER BY price DESC";
                break;
            case "rating":
                $orderBy = "ORDER BY rating DESC";
                break;
            case "newest":
                $orderBy = "ORDER BY id DESC";
                break;
            case "oldest":
                $orderBy = "ORDER BY id ASC";
                break;
            case "popular":
                $orderBy = "ORDER BY is_best_seller DESC, is_trending DESC, id ASC";
                break;
            default:
                $orderBy = "ORDER BY id ASC";
                break;
        }
    }

    // Limit
    $limitSql = "";
    if (isset($_GET["limit"]) && intval($_GET["limit"]) > 0) {
        $limitSql = "LIMIT " . intval($_GET["limit"]);
    }

    $sql = "
        SELECT
            id,
            name,
            description,
            price,
            category,
            style,
            image,
            badge,
            is_new,
            is_trending,
            is_best_seller,
            stock,
            sizes,
            rating,
            created_at
        FROM products
        $whereSql
        $orderBy
        $limitSql
    ";

    $stmt = $conn->prepare($sql);

    if ($stmt) {
        if (!empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];
        $productIds = [];

        while ($row = $result->fetch_assoc()) {
            $row["id"] = (int)$row["id"];
            $row["price"] = (float)$row["price"];
            $row["rating"] = (float)($row["rating"] ?? 4.5);
            $row["stock"] = (int)($row["stock"] ?? 10);
            $row["is_new"] = (bool)$row["is_new"];
            $row["is_trending"] = (bool)$row["is_trending"];
            $row["is_best_seller"] = (bool)$row["is_best_seller"];
            $row["status"] = ($row["stock"] <= 0) ? "Out of Stock" : (($row["stock"] <= 5) ? "Low Stock" : "Active");
            $row["image"] = sanitizeImagePath($row["image"]) ?: "prod1.jpeg";

            if (!empty($row["sizes"])) {
                $row["sizes"] = array_values(
                    array_filter(
                        array_map(
                            "trim",
                            explode(",", $row["sizes"])
                        )
                    )
                );
            } else {
                $row["sizes"] = ["S", "M", "L", "XL", "XXL"];
            }

            $products[] = $row;
            $productIds[] = $row["id"];
        }
        $stmt->close();

        // Fetch gallery images for all catalog products in a single optimized query
        $galleryMap = fetchProductImagesMap($conn, $productIds);

        foreach ($products as &$p) {
            $pId = $p["id"];
            if (isset($galleryMap[$pId]) && !empty($galleryMap[$pId]['images'])) {
                $p["images"] = $galleryMap[$pId]['images'];
                $p["gallery"] = $galleryMap[$pId]['gallery'];
                if (!empty($p["gallery"]["front"])) {
                    $p["image"] = $p["gallery"]["front"];
                }
            } else {
                $p["images"] = [$p["image"]];
                $p["gallery"] = [
                    "front" => $p["image"],
                    "back" => null,
                    "sitting" => null,
                    "standing" => null
                ];
            }
        }
        unset($p);

        echo json_encode([
            "success" => true,
            "total" => count($products),
            "products" => $products
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to query products: " . $conn->error
        ]);
    }

    $conn->close();
    exit;
}

/* =========================================================
   2. POST REQUESTS (Create OR Update OR Delete Product)
========================================================= */
if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];
    $action = trim($input["action"] ?? "");

    /* -----------------------------------------------------
       A. DELETE ACTION VIA POST
    ----------------------------------------------------- */
    if ($action === "delete") {
        $productId = intval($input["id"] ?? 0);
        if ($productId <= 0) {
            echo json_encode(["success" => false, "message" => "Valid product ID is required."]);
            exit;
        }

        // Delete gallery images first
        $delImg = $conn->prepare("DELETE FROM product_images WHERE product_id = ?");
        if ($delImg) {
            $delImg->bind_param("i", $productId);
            $delImg->execute();
            $delImg->close();
        }

        $delStmt = $conn->prepare("DELETE FROM products WHERE id = ?");
        $delStmt->bind_param("i", $productId);
        if ($delStmt->execute()) {
            echo json_encode(["success" => true, "message" => "Product and gallery images deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete product: " . $delStmt->error]);
        }
        $delStmt->close();
        $conn->close();
        exit;
    }

    /* -----------------------------------------------------
       B. UPDATE PRODUCT ACTION
    ----------------------------------------------------- */
    if ($action === "edit" || $action === "update" || (!empty($input["id"]) && intval($input["id"]) > 0 && !isset($input["create_new"]))) {
        $id = intval($input["id"]);
        $name = trim($input["name"] ?? "");
        $category = trim($input["category"] ?? "T-Shirts");
        $price = (float)str_replace([",", "₹", " "], "", (string)($input["price"] ?? 0));
        $stock = intval($input["stock"] ?? 10);
        $style = trim($input["style"] ?? "Streetwear");
        $badge = trim($input["badge"] ?? "");
        $description = trim($input["description"] ?? "Premium Bad Teddy Streetwear piece.");

        // Extract gallery input if provided
        $galleryInput = $input["gallery"] ?? $input["images"] ?? null;

        // Resolve primary image from gallery front slot or raw image input
        $image = sanitizeImagePath($input["image"] ?? "prod1.jpeg") ?: "prod1.jpeg";
        if (is_array($galleryInput)) {
            if (!empty($galleryInput["front"])) {
                $image = sanitizeImagePath($galleryInput["front"]) ?: $image;
            } elseif (!empty($galleryInput[0])) {
                $image = sanitizeImagePath($galleryInput[0]) ?: $image;
            }
        }

        if ($id <= 0 || empty($name) || $price <= 0) {
            echo json_encode(["success" => false, "message" => "Valid product ID, name, and price are required."]);
            exit;
        }

        $upStmt = $conn->prepare("
            UPDATE products 
            SET name = ?, category = ?, price = ?, stock = ?, style = ?, badge = ?, image = ?, description = ?
            WHERE id = ?
        ");
        $upStmt->bind_param("ssdissdsi", $name, $category, $price, $stock, $style, $badge, $image, $description, $id);

        if ($upStmt->execute()) {
            // Update gallery images if gallery was provided
            if ($galleryInput !== null) {
                syncProductImages($conn, $id, $galleryInput, $image);
            }

            // Fetch updated gallery for response
            $galleryMap = fetchProductImagesMap($conn, [$id]);
            $savedGallery = $galleryMap[$id] ?? null;

            $responseImages = $savedGallery['images'] ?? [$image];
            $responseGallery = $savedGallery['gallery'] ?? [
                "front" => $image,
                "back" => null,
                "sitting" => null,
                "standing" => null
            ];

            echo json_encode([
                "success" => true,
                "message" => "Product and gallery updated successfully.",
                "product" => [
                    "id" => $id,
                    "name" => $name,
                    "category" => $category,
                    "price" => $price,
                    "stock" => $stock,
                    "style" => $style,
                    "badge" => $badge,
                    "image" => $responseGallery["front"] ?? $image,
                    "images" => $responseImages,
                    "gallery" => $responseGallery,
                    "status" => ($stock <= 0) ? "Out of Stock" : (($stock <= 5) ? "Low Stock" : "Active")
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update product: " . $upStmt->error]);
        }
        $upStmt->close();
        $conn->close();
        exit;
    }

    /* -----------------------------------------------------
       C. CREATE NEW PRODUCT
    ----------------------------------------------------- */
    $name = trim($input["name"] ?? "");
    $category = trim($input["category"] ?? "T-Shirts");
    $price = (float)str_replace([",", "₹", " "], "", (string)($input["price"] ?? 0));
    $stock = intval($input["stock"] ?? 10);
    $style = trim($input["style"] ?? "Streetwear");
    $badge = trim($input["badge"] ?? "NEW DROP");
    $description = trim($input["description"] ?? "Premium Bad Teddy Streetwear piece.");
    $sizes = trim($input["sizes"] ?? "S,M,L,XL,XXL");

    $galleryInput = $input["gallery"] ?? $input["images"] ?? null;

    $image = sanitizeImagePath($input["image"] ?? "prod1.jpeg") ?: "prod1.jpeg";
    if (is_array($galleryInput)) {
        if (!empty($galleryInput["front"])) {
            $image = sanitizeImagePath($galleryInput["front"]) ?: $image;
        } elseif (!empty($galleryInput[0])) {
            $image = sanitizeImagePath($galleryInput[0]) ?: $image;
        }
    }

    if (empty($name) || $price <= 0) {
        echo json_encode(["success" => false, "message" => "Product name and a valid price are required."]);
        exit;
    }

    $insStmt = $conn->prepare("
        INSERT INTO products (name, description, price, category, style, image, badge, stock, sizes, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 4.8)
    ");
    $insStmt->bind_param("ssdssssis", $name, $description, $price, $category, $style, $image, $badge, $stock, $sizes);

    if ($insStmt->execute()) {
        $newId = (int)$insStmt->insert_id;

        // Persist gallery images
        if ($galleryInput !== null) {
            syncProductImages($conn, $newId, $galleryInput, $image);
        } else {
            // Also store primary image into product_images for slot 'front'
            syncProductImages($conn, $newId, ["front" => $image], $image);
        }

        $galleryMap = fetchProductImagesMap($conn, [$newId]);
        $savedGallery = $galleryMap[$newId] ?? null;

        $responseImages = $savedGallery['images'] ?? [$image];
        $responseGallery = $savedGallery['gallery'] ?? [
            "front" => $image,
            "back" => null,
            "sitting" => null,
            "standing" => null
        ];

        echo json_encode([
            "success" => true,
            "message" => "Product added successfully with gallery.",
            "product" => [
                "id" => $newId,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "category" => $category,
                "style" => $style,
                "image" => $responseGallery["front"] ?? $image,
                "images" => $responseImages,
                "gallery" => $responseGallery,
                "badge" => $badge,
                "stock" => $stock,
                "sizes" => ["S", "M", "L", "XL", "XXL"],
                "rating" => 4.8,
                "status" => ($stock <= 0) ? "Out of Stock" : (($stock <= 5) ? "Low Stock" : "Active")
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add product: " . $insStmt->error]);
    }

    $insStmt->close();
    $conn->close();
    exit;
}

/* =========================================================
   3. PUT REQUEST (Update Product)
========================================================= */
if ($method === "PUT") {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];
    $id = intval($input["id"] ?? $_GET["id"] ?? 0);
    $name = trim($input["name"] ?? "");
    $category = trim($input["category"] ?? "T-Shirts");
    $price = (float)str_replace([",", "₹", " "], "", (string)($input["price"] ?? 0));
    $stock = intval($input["stock"] ?? 10);
    $style = trim($input["style"] ?? "Streetwear");
    $badge = trim($input["badge"] ?? "");

    $galleryInput = $input["gallery"] ?? $input["images"] ?? null;
    $image = sanitizeImagePath($input["image"] ?? "prod1.jpeg") ?: "prod1.jpeg";
    if (is_array($galleryInput)) {
        if (!empty($galleryInput["front"])) {
            $image = sanitizeImagePath($galleryInput["front"]) ?: $image;
        } elseif (!empty($galleryInput[0])) {
            $image = sanitizeImagePath($galleryInput[0]) ?: $image;
        }
    }

    if ($id <= 0 || empty($name) || $price <= 0) {
        echo json_encode(["success" => false, "message" => "Valid product ID, name, and price are required."]);
        exit;
    }

    $upStmt = $conn->prepare("
        UPDATE products 
        SET name = ?, category = ?, price = ?, stock = ?, style = ?, badge = ?, image = ?
        WHERE id = ?
    ");
    $upStmt->bind_param("ssdissdi", $name, $category, $price, $stock, $style, $badge, $image, $id);

    if ($upStmt->execute()) {
        if ($galleryInput !== null) {
            syncProductImages($conn, $id, $galleryInput, $image);
        }

        $galleryMap = fetchProductImagesMap($conn, [$id]);
        $savedGallery = $galleryMap[$id] ?? null;

        echo json_encode([
            "success" => true,
            "message" => "Product updated successfully.",
            "product" => [
                "id" => $id,
                "name" => $name,
                "category" => $category,
                "price" => $price,
                "stock" => $stock,
                "style" => $style,
                "badge" => $badge,
                "image" => $savedGallery['gallery']['front'] ?? $image,
                "images" => $savedGallery['images'] ?? [$image],
                "gallery" => $savedGallery['gallery'] ?? ["front" => $image, "back" => null, "sitting" => null, "standing" => null]
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update product: " . $upStmt->error]);
    }
    $upStmt->close();
    $conn->close();
    exit;
}

/* =========================================================
   4. DELETE REQUEST (Delete Product)
========================================================= */
if ($method === "DELETE") {
    $raw = json_decode(file_get_contents("php://input"), true) ?? [];
    $productId = intval($_GET["id"] ?? $raw["id"] ?? 0);

    if ($productId <= 0) {
        echo json_encode(["success" => false, "message" => "Valid product ID is required."]);
        exit;
    }

    // Delete gallery images first
    $delImg = $conn->prepare("DELETE FROM product_images WHERE product_id = ?");
    if ($delImg) {
        $delImg->bind_param("i", $productId);
        $delImg->execute();
        $delImg->close();
    }

    $delStmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $delStmt->bind_param("i", $productId);
    if ($delStmt->execute()) {
        echo json_encode(["success" => true, "message" => "Product deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete product: " . $delStmt->error]);
    }
    $delStmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);