<?php

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];


/* =========================================================
   GET CART
   URL:
   cart.php?user_id=1
========================================================= */

if ($method === "GET") {

    $user_id = isset($_GET["user_id"])
        ? intval($_GET["user_id"])
        : 0;

    if ($user_id <= 0) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid user ID."
        ]);

        exit;
    }

    $sql = "
        SELECT
            c.id,
            c.user_id,
            c.product_id,
            c.size,
            c.quantity,
            COALESCE(p.name, 'Bad Teddy Item') AS name,
            COALESCE(p.description, '') AS description,
            COALESCE(p.price, 0.00) AS price,
            COALESCE(p.category, 'Streetwear') AS category,
            COALESCE(p.style, 'Oversized') AS style,
            COALESCE(p.image, 'prod1.jpeg') AS image,
            COALESCE(p.badge, '') AS badge,
            p.is_new,
            p.is_trending,
            p.is_best_seller,
            COALESCE(p.stock, 10) AS stock,
            p.sizes,
            COALESCE(p.rating, 5.0) AS rating
        FROM cart c
        LEFT JOIN products p
            ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC, c.id DESC
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare cart query.",
            "error" => $conn->error
        ]);

        exit;
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $cart = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $row["user_id"] = (int)$row["user_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["price"] = (float)$row["price"];
        $row["rating"] = (float)($row["rating"] ?? 0);
        $row["stock"] = (int)($row["stock"] ?? 0);
        $row["is_new"] = (bool)($row["is_new"] ?? false);
        $row["is_trending"] = (bool)($row["is_trending"] ?? false);
        $row["is_best_seller"] = (bool)($row["is_best_seller"] ?? false);
        $cart[] = $row;
    }

    echo json_encode([
        "success" => true,
        "cart" => $cart
    ]);

    $stmt->close();
    exit;
}


/* =========================================================
   ADD TO CART
   POST
========================================================= */

if ($method === "POST") {

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    $user_id = intval($input["user_id"] ?? 0);
    $product_id = intval($input["product_id"] ?? 0);
    $quantity = intval($input["quantity"] ?? 1);
    $size = $input["size"] ?? null;

    if ($user_id <= 0 || $product_id <= 0) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid user ID or product ID."
        ]);

        exit;
    }

    if ($quantity <= 0) {
        $quantity = 1;
    }


    /* Check if same product + same size already exists */

    $checkSql = "
        SELECT id, quantity
        FROM cart
        WHERE user_id = ?
        AND product_id = ?
        AND (
            size = ?
            OR (size IS NULL AND ? IS NULL)
        )
        LIMIT 1
    ";

    $checkStmt = $conn->prepare($checkSql);

    $checkStmt->bind_param(
        "iiss",
        $user_id,
        $product_id,
        $size,
        $size
    );

    $checkStmt->execute();

    $result = $checkStmt->get_result();

    if ($result->num_rows > 0) {

        $existing = $result->fetch_assoc();

        $newQuantity =
            intval($existing["quantity"]) + $quantity;

        $updateSql = "
            UPDATE cart
            SET quantity = ?
            WHERE id = ?
        ";

        $updateStmt = $conn->prepare($updateSql);

        $updateStmt->bind_param(
            "ii",
            $newQuantity,
            $existing["id"]
        );

        $updateStmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Cart quantity updated.",
            "cart_id" => $existing["id"],
            "quantity" => $newQuantity
        ]);

        $updateStmt->close();

    } else {

        $insertSql = "
            INSERT INTO cart
            (
                user_id,
                product_id,
                size,
                quantity
            )
            VALUES (?, ?, ?, ?)
        ";

        $insertStmt = $conn->prepare($insertSql);

        $insertStmt->bind_param(
            "iisi",
            $user_id,
            $product_id,
            $size,
            $quantity
        );

        $insertStmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Product added to cart.",
            "cart_id" => $insertStmt->insert_id,
            "quantity" => $quantity
        ]);

        $insertStmt->close();
    }

    $checkStmt->close();
    exit;
}


/* =========================================================
   UPDATE QUANTITY
   PUT
========================================================= */

if ($method === "PUT") {

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    $user_id = intval($input["user_id"] ?? 0);
    $cart_id = intval($input["id"] ?? $input["cart_id"] ?? 0);
    $product_id = intval($input["product_id"] ?? 0);
    $quantity = intval($input["quantity"] ?? 1);
    $size = $input["size"] ?? null;

    if ($user_id <= 0 || $quantity <= 0 || ($cart_id <= 0 && $product_id <= 0)) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid cart information."
        ]);

        exit;
    }

    if ($cart_id > 0) {
        $sql = "UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $quantity, $cart_id, $user_id);
        $stmt->execute();
        $stmt->close();
    } else {
        $sql = "
            UPDATE cart
            SET quantity = ?
            WHERE user_id = ?
            AND product_id = ?
            AND (
                size = ?
                OR (size IS NULL AND ? IS NULL)
            )
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiiss", $quantity, $user_id, $product_id, $size, $size);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Cart quantity updated.",
        "quantity" => $quantity
    ]);

    exit;
}


/* =========================================================
   DELETE CART ITEM
   DELETE
========================================================= */

if ($method === "DELETE") {

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    $user_id = intval($input["user_id"] ?? 0);
    $cart_id = intval($input["id"] ?? $input["cart_id"] ?? 0);
    $product_id = intval($input["product_id"] ?? 0);
    $size = $input["size"] ?? null;

    if ($user_id <= 0 || ($cart_id <= 0 && $product_id <= 0)) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid cart information."
        ]);

        exit;
    }

    if ($cart_id > 0) {
        $sql = "DELETE FROM cart WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $cart_id, $user_id);
        $stmt->execute();
        $stmt->close();
    } else {
        $sql = "
            DELETE FROM cart
            WHERE user_id = ?
            AND product_id = ?
            AND (
                size = ?
                OR (size IS NULL AND ? IS NULL)
            )
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiss", $user_id, $product_id, $size, $size);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Product removed from cart."
    ]);

    exit;
}


/* =========================================================
   INVALID REQUEST
========================================================= */

echo json_encode([
    "success" => false,
    "message" => "Unsupported request method."
]);

?>