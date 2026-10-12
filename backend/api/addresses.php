<?php
/**
 * BAD TEDDY E-Commerce - User Saved Addresses API
 * GET /addresses.php?user_id=X => List saved addresses for a user
 * POST /addresses.php          => Add/Update an address
 * DELETE /addresses.php        => Delete an address
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];

/* =========================================================
   1. GET ADDRESSES
   Example: /addresses.php?user_id=1
========================================================= */
if ($method === "GET") {
    $userId = isset($_GET["user_id"]) ? intval($_GET["user_id"]) : 0;

    if ($userId <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "User ID is required."
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT id, user_id, first_name, last_name, phone, address, landmark, city, state, pincode, is_default, created_at
         FROM user_addresses
         WHERE user_id = ?
         ORDER BY is_default DESC, id DESC"
    );

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Query preparation failed: " . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $addresses = [];
    while ($row = $result->fetch_assoc()) {
        $addresses[] = [
            "id" => (int)$row["id"],
            "userId" => (int)$row["user_id"],
            "firstName" => $row["first_name"],
            "lastName" => $row["last_name"],
            "phone" => $row["phone"],
            "address" => $row["address"],
            "landmark" => $row["landmark"] ?? "",
            "city" => $row["city"],
            "state" => $row["state"],
            "pincode" => $row["pincode"],
            "isDefault" => (bool)$row["is_default"],
            "createdAt" => $row["created_at"]
        ];
    }

    echo json_encode([
        "success" => true,
        "addresses" => $addresses
    ]);

    $stmt->close();
    exit;
}

/* =========================================================
   2. SAVE OR UPDATE ADDRESS (POST)
========================================================= */
if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    $addressId = intval($input["id"] ?? $input["address_id"] ?? 0);
    $userId = intval($input["user_id"] ?? $input["userId"] ?? 0);
    $firstName = trim($input["firstName"] ?? $input["first_name"] ?? "");
    $lastName = trim($input["lastName"] ?? $input["last_name"] ?? "");
    $phone = trim($input["phone"] ?? "");
    $address = trim($input["address"] ?? "");
    $landmark = trim($input["landmark"] ?? "");
    $city = trim($input["city"] ?? "");
    $state = trim($input["state"] ?? "");
    $pincode = trim($input["pincode"] ?? "");
    $isDefault = isset($input["is_default"]) ? (int)$input["is_default"] : (isset($input["isDefault"]) ? (int)$input["isDefault"] : 1);

    if ($userId <= 0 || empty($firstName) || empty($phone) || empty($address) || empty($city) || empty($pincode)) {
        echo json_encode([
            "success" => false,
            "message" => "Please provide all required address fields."
        ]);
        exit;
    }

    // If setting as default, clear any other default address for this user
    if ($isDefault === 1) {
        $clearStmt = $conn->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?");
        if ($clearStmt) {
            $clearStmt->bind_param("i", $userId);
            $clearStmt->execute();
            $clearStmt->close();
        }
    }

    // Check if updating an existing address or inserting
    if ($addressId > 0) {
        $stmt = $conn->prepare(
            "UPDATE user_addresses
             SET first_name = ?, last_name = ?, phone = ?, address = ?, landmark = ?, city = ?, state = ?, pincode = ?, is_default = ?
             WHERE id = ? AND user_id = ?"
        );

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Failed to prepare update: " . $conn->error
            ]);
            exit;
        }

        $stmt->bind_param(
            "ssssssssiii",
            $firstName,
            $lastName,
            $phone,
            $address,
            $landmark,
            $city,
            $state,
            $pincode,
            $isDefault,
            $addressId,
            $userId
        );

        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Address updated successfully.",
                "address" => [
                    "id" => $addressId,
                    "userId" => $userId,
                    "firstName" => $firstName,
                    "lastName" => $lastName,
                    "phone" => $phone,
                    "address" => $address,
                    "landmark" => $landmark,
                    "city" => $city,
                    "state" => $state,
                    "pincode" => $pincode,
                    "isDefault" => (bool)$isDefault
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to update address: " . $stmt->error
            ]);
        }
        $stmt->close();
        exit;
    }

    // Otherwise INSERT
    $stmt = $conn->prepare(
        "INSERT INTO user_addresses
        (user_id, first_name, last_name, phone, address, landmark, city, state, pincode, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare insert: " . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "issssssssi",
        $userId,
        $firstName,
        $lastName,
        $phone,
        $address,
        $landmark,
        $city,
        $state,
        $pincode,
        $isDefault
    );

    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Address saved successfully.",
            "address" => [
                "id" => $newId,
                "userId" => $userId,
                "firstName" => $firstName,
                "lastName" => $lastName,
                "phone" => $phone,
                "address" => $address,
                "landmark" => $landmark,
                "city" => $city,
                "state" => $state,
                "pincode" => $pincode,
                "isDefault" => (bool)$isDefault
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to save address: " . $stmt->error
        ]);
    }

    $stmt->close();
    exit;
}

/* =========================================================
   3. DELETE ADDRESS (DELETE / POST)
========================================================= */
if ($method === "DELETE" || ($method === "POST" && isset($_GET["action"]) && $_GET["action"] === "delete")) {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    $id = intval($input["id"] ?? $_GET["id"] ?? 0);
    $userId = intval($input["user_id"] ?? $_GET["user_id"] ?? 0);

    if ($id <= 0 && $userId > 0) {
        // Delete all addresses for this user (e.g. on reset)
        $stmt = $conn->prepare("DELETE FROM user_addresses WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "All addresses cleared for user."
        ]);
        exit;
    }

    if ($id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Address ID is required."
        ]);
        exit;
    }

    if ($userId > 0) {
        $stmt = $conn->prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $id, $userId);
    } else {
        $stmt = $conn->prepare("DELETE FROM user_addresses WHERE id = ?");
        $stmt->bind_param("i", $id);
    }

    if ($stmt && $stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Address deleted successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to delete address."
        ]);
    }

    if ($stmt) $stmt->close();
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Unsupported request method."
]);
