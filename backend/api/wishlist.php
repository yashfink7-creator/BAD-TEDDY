<?php

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";


/*
|--------------------------------------------------------------------------
| GET WISHLIST
| Example:
| wishlist.php?user_id=1
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    if (!isset($_GET["user_id"])) {

        echo json_encode([
            "success" => false,
            "message" => "User ID is required."
        ]);

        exit;
    }

    $user_id = (int) $_GET["user_id"];

    $sql = "SELECT
                wishlist.id,
                wishlist.user_id,
                wishlist.product_id,
                wishlist.created_at,

                products.name,
                products.description,
                products.price,
                products.category,
                products.style,
                products.image,
                products.badge,
                products.stock,
                products.sizes

            FROM wishlist

            INNER JOIN products
                ON wishlist.product_id = products.id

            WHERE wishlist.user_id = ?

            ORDER BY wishlist.created_at DESC";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare wishlist query."
        ]);

        exit;
    }

    $stmt->bind_param("i", $user_id);

    $stmt->execute();

    $result = $stmt->get_result();

    $wishlist = [];

    while ($row = $result->fetch_assoc()) {

        $wishlist[] = [
            "id" => (int) $row["product_id"],
            "wishlistId" => (int) $row["id"],
            "userId" => (int) $row["user_id"],

            "name" => $row["name"],
            "description" => $row["description"],
            "price" => (float) $row["price"],
            "category" => $row["category"],
            "style" => $row["style"],
            "image" => $row["image"],
            "badge" => $row["badge"],
            "stock" => (int) $row["stock"],

            "sizes" => $row["sizes"]
                ? explode(",", $row["sizes"])
                : [],

            "createdAt" => $row["created_at"]
        ];
    }

    echo json_encode([
        "success" => true,
        "wishlist" => $wishlist
    ]);

    $stmt->close();

    exit;
}


/*
|--------------------------------------------------------------------------
| ADD TO WISHLIST
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!$input) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid JSON data."
        ]);

        exit;
    }

    if (
        !isset($input["user_id"]) ||
        !isset($input["product_id"])
    ) {

        echo json_encode([
            "success" => false,
            "message" => "User ID and Product ID are required."
        ]);

        exit;
    }

    $user_id = (int) $input["user_id"];
    $product_id = (int) $input["product_id"];


    /*
    | Check whether product already exists
    */

    $checkSql = "SELECT id
                 FROM wishlist
                 WHERE user_id = ?
                 AND product_id = ?";

    $checkStmt = $conn->prepare($checkSql);

    $checkStmt->bind_param(
        "ii",
        $user_id,
        $product_id
    );

    $checkStmt->execute();

    $checkResult = $checkStmt->get_result();


    if ($checkResult->num_rows > 0) {

        echo json_encode([
            "success" => false,
            "message" => "Product is already in your wishlist."
        ]);

        $checkStmt->close();

        exit;
    }

    $checkStmt->close();


    /*
    | Add product
    */

    $sql = "INSERT INTO wishlist
            (user_id, product_id)
            VALUES (?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare wishlist insert."
        ]);

        exit;
    }

    $stmt->bind_param(
        "ii",
        $user_id,
        $product_id
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Product added to wishlist."
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Unable to add product to wishlist."
        ]);
    }

    $stmt->close();

    exit;
}


/*
|--------------------------------------------------------------------------
| REMOVE FROM WISHLIST
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "DELETE") {

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!$input) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid JSON data."
        ]);

        exit;
    }

    if (
        !isset($input["user_id"]) ||
        !isset($input["product_id"])
    ) {

        echo json_encode([
            "success" => false,
            "message" => "User ID and Product ID are required."
        ]);

        exit;
    }

    $user_id = (int) $input["user_id"];
    $product_id = (int) $input["product_id"];


    $sql = "DELETE FROM wishlist
            WHERE user_id = ?
            AND product_id = ?";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {

        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare wishlist delete."
        ]);

        exit;
    }

    $stmt->bind_param(
        "ii",
        $user_id,
        $product_id
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Product removed from wishlist."
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Unable to remove product from wishlist."
        ]);
    }

    $stmt->close();

    exit;
}


/*
|--------------------------------------------------------------------------
| INVALID REQUEST
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => false,
    "message" => "Invalid request method."
]);

?>