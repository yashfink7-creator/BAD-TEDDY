<?php
/**
 * BAD TEDDY E-Commerce - User Payment Methods API
 * GET /payment_methods.php?user_id=X => List saved cards & UPI methods
 * POST /payment_methods.php          => Save new payment method OR set default
 * DELETE /payment_methods.php        => Remove saved payment method
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];

/* =========================================================
   1. GET PAYMENT METHODS
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
        "SELECT id, user_id, type, card_name, last_four, expiry, brand, upi_id, is_default, created_at
         FROM user_payment_methods
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

    $methods = [];
    while ($row = $result->fetch_assoc()) {
        $methods[] = [
            "id" => (int)$row["id"],
            "userId" => (int)$row["user_id"],
            "type" => $row["type"],
            "cardName" => $row["card_name"],
            "name" => $row["card_name"],
            "lastFour" => $row["last_four"],
            "expiry" => $row["expiry"],
            "brand" => $row["brand"] ?? "Card",
            "upiId" => $row["upi_id"],
            "isDefault" => (bool)$row["is_default"],
            "createdAt" => $row["created_at"]
        ];
    }

    echo json_encode([
        "success" => true,
        "paymentMethods" => $methods
    ]);

    $stmt->close();
    exit;
}

/* =========================================================
   2. SAVE OR SET DEFAULT PAYMENT METHOD (POST)
========================================================= */
if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    $action = trim($input["action"] ?? $_GET["action"] ?? "");
    $userId = intval($input["user_id"] ?? $input["userId"] ?? 0);

    if ($userId <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "User ID is required."
        ]);
        exit;
    }

    // Handle "set_default" action
    if ($action === "set_default") {
        $methodId = intval($input["id"] ?? 0);
        if ($methodId <= 0) {
            echo json_encode([
                "success" => false,
                "message" => "Payment method ID is required."
            ]);
            exit;
        }

        // Reset all for user
        $conn->query("UPDATE user_payment_methods SET is_default = 0 WHERE user_id = " . $userId);

        // Set target as default
        $stmt = $conn->prepare("UPDATE user_payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $methodId, $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "Default payment method updated."
        ]);
        exit;
    }

    $type = trim($input["type"] ?? "card");
    $cardName = trim($input["cardName"] ?? $input["name"] ?? $input["card_name"] ?? "");
    $cardNumber = trim($input["cardNumber"] ?? $input["card_number"] ?? "");
    $expiry = trim($input["expiry"] ?? "");
    $upiId = trim($input["upiId"] ?? $input["upi_id"] ?? "");
    $isDefault = isset($input["is_default"]) ? (int)$input["is_default"] : (isset($input["isDefault"]) ? (int)$input["isDefault"] : 0);

    // If this is the user's first payment method, make it default automatically
    $countCheck = $conn->query("SELECT COUNT(*) AS total FROM user_payment_methods WHERE user_id = " . $userId);
    $countRow = $countCheck ? $countCheck->fetch_assoc() : ["total" => 0];
    if ((int)$countRow["total"] === 0) {
        $isDefault = 1;
    }

    if ($isDefault === 1) {
        $conn->query("UPDATE user_payment_methods SET is_default = 0 WHERE user_id = " . $userId);
    }

    $lastFour = null;
    $brand = "Card";

    if ($type === "card") {
        if (empty($cardName) || empty($cardNumber)) {
            echo json_encode([
                "success" => false,
                "message" => "Please enter complete card details."
            ]);
            exit;
        }

        $cleanCard = preg_replace('/\D/', '', $cardNumber);
        $lastFour = substr($cleanCard, -4);

        if (strpos($cleanCard, "4") === 0) {
            $brand = "Visa";
        } elseif (preg_match('/^5[1-5]/', $cleanCard)) {
            $brand = "Mastercard";
        } elseif (preg_match('/^(60|65|81|82)/', $cleanCard)) {
            $brand = "RuPay";
        } elseif (preg_match('/^3[47]/', $cleanCard)) {
            $brand = "Amex";
        }
    } elseif ($type === "upi") {
        if (empty($upiId)) {
            echo json_encode([
                "success" => false,
                "message" => "Please enter your UPI ID."
            ]);
            exit;
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Unsupported payment method type."
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO user_payment_methods
        (user_id, type, card_name, last_four, expiry, brand, upi_id, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare insert: " . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param(
        "issssssi",
        $userId,
        $type,
        $cardName,
        $lastFour,
        $expiry,
        $brand,
        $upiId,
        $isDefault
    );

    if ($stmt->execute()) {
        $insertId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Payment method saved successfully.",
            "paymentMethod" => [
                "id" => $insertId,
                "userId" => $userId,
                "type" => $type,
                "cardName" => $cardName,
                "name" => $cardName,
                "lastFour" => $lastFour,
                "expiry" => $expiry,
                "brand" => $brand,
                "upiId" => $upiId,
                "isDefault" => (bool)$isDefault,
                "createdAt" => date("Y-m-d H:i:s")
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to save payment method: " . $stmt->error
        ]);
    }

    $stmt->close();
    exit;
}

/* =========================================================
   3. DELETE PAYMENT METHOD (DELETE)
========================================================= */
if ($method === "DELETE" || ($method === "POST" && isset($_GET["action"]) && $_GET["action"] === "delete")) {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    $id = intval($input["id"] ?? $_GET["id"] ?? 0);
    $userId = intval($input["user_id"] ?? $input["userId"] ?? $_GET["user_id"] ?? 0);

    if ($id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Payment method ID is required."
        ]);
        exit;
    }

    if ($userId > 0) {
        $stmt = $conn->prepare("DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $id, $userId);
    } else {
        $stmt = $conn->prepare("DELETE FROM user_payment_methods WHERE id = ?");
        $stmt->bind_param("i", $id);
    }

    if ($stmt && $stmt->execute()) {
        // If the deleted one was default, set the latest remaining as default
        if ($userId > 0) {
            $defCheck = $conn->query("SELECT id FROM user_payment_methods WHERE user_id = $userId AND is_default = 1");
            if ($defCheck && $defCheck->num_rows === 0) {
                $conn->query("UPDATE user_payment_methods SET is_default = 1 WHERE user_id = $userId ORDER BY id DESC LIMIT 1");
            }
        }

        echo json_encode([
            "success" => true,
            "message" => "Payment method removed successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to delete payment method."
        ]);
    }

    if ($stmt) $stmt->close();
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Unsupported request method."
]);
