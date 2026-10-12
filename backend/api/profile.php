<?php
/**
 * BAD TEDDY E-Commerce - User Profile API
 * GET: Fetch profile by ?id=
 * POST: Update profile { id, name, email, phone }
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];

/* =========================================
   GET PROFILE
========================================= */
if ($method === "GET") {
    $userId = isset($_GET["id"]) ? (int)$_GET["id"] : 0;

    if ($userId <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "User ID is required."
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT id, name, email, phone, points, created_at
         FROM users
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

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "User not found."
        ]);
        $stmt->close();
        $conn->close();
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => (int)$user["id"],
            "name" => $user["name"],
            "email" => $user["email"],
            "phone" => $user["phone"] ?? "",
            "points" => (int)($user["points"] ?? 250),
            "created_at" => $user["created_at"]
        ]
    ]);
    exit;
}

/* =========================================
   UPDATE PROFILE (POST / PUT)
========================================= */
if ($method === "POST" || $method === "PUT") {
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true) ?? [];

    $id = isset($input["id"]) ? (int)$input["id"] : (isset($_GET["id"]) ? (int)$_GET["id"] : 0);
    $name = trim($input["name"] ?? "");
    $email = trim($input["email"] ?? "");
    $phone = trim($input["phone"] ?? "");

    if ($id <= 0 || empty($name) || empty($email)) {
        echo json_encode([
            "success" => false,
            "message" => "User ID, name, and email are required."
        ]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "success" => false,
            "message" => "Please enter a valid email address."
        ]);
        exit;
    }

    // Check if email is already taken by another user
    $checkStmt = $conn->prepare(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1"
    );
    $checkStmt->bind_param("si", $email, $id);
    $checkStmt->execute();
    $checkRes = $checkStmt->get_result();

    if ($checkRes->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "message" => "This email is already in use by another account."
        ]);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();

    // Update user record
    $updateStmt = $conn->prepare(
        "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?"
    );
    if (!$updateStmt) {
        echo json_encode([
            "success" => false,
            "message" => "Update query preparation failed: " . $conn->error
        ]);
        $conn->close();
        exit;
    }

    $updateStmt->bind_param("sssi", $name, $email, $phone, $id);

    if ($updateStmt->execute()) {
        $updateStmt->close();
        $conn->close();

        echo json_encode([
            "success" => true,
            "message" => "Profile updated successfully.",
            "user" => [
                "id" => (int)$id,
                "name" => $name,
                "email" => $email,
                "phone" => $phone,
                "points" => 250
            ]
        ]);
    } else {
        $err = $updateStmt->error;
        $updateStmt->close();
        $conn->close();

        echo json_encode([
            "success" => false,
            "message" => "Profile update failed: " . $err
        ]);
    }
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Invalid request method."
]);