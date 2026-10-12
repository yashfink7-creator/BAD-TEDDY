<?php
/**
 * BAD TEDDY E-Commerce - Customers Admin API
 * GET    /customers.php             => List all customers with aggregate order stats, search & filtering
 * POST   /customers.php             => Delete customer OR update customer info
 * DELETE /customers.php?id=X        => Delete customer
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/admin_auth.php";

$method = $_SERVER["REQUEST_METHOD"];

$token = get_bearer_admin_token();
if ($token) {
    $admin = validate_admin_token($token);
    if (!$admin) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid or expired admin authorization token."]);
        exit;
    }
}

/* =========================================================
   1. GET REQUESTS (List Customers with Order Stats)
========================================================= */
if ($method === "GET") {
    $search = isset($_GET["search"]) ? trim($_GET["search"]) : "";
    $userId = isset($_GET["id"]) ? intval($_GET["id"]) : 0;

    $sql = "SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,
                COUNT(DISTINCT o.id) AS total_orders,
                COALESCE(SUM(o.total), 0) AS total_spent,
                MAX(o.created_at) AS last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id";

    $params = [];
    $types = "";

    if ($userId > 0) {
        $sql .= " WHERE u.id = ?";
        $params[] = $userId;
        $types .= "i";
    } elseif (!empty($search)) {
        $sql .= " WHERE (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
        $searchTerm = "%" . $search . "%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }

    $sql .= " GROUP BY u.id, u.name, u.email, u.phone, u.created_at ORDER BY u.created_at DESC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $conn->error
        ]);
        exit;
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $customers[] = [
            "id" => (int)$row["id"],
            "name" => $row["name"] ?? "Customer #" . $row["id"],
            "email" => $row["email"] ?? "",
            "phone" => $row["phone"] ?? "N/A",
            "points" => (int)($row["points"] ?? 250),
            "orders" => (int)$row["total_orders"],
            "total_orders" => (int)$row["total_orders"],
            "spent" => "₹" . number_format((float)$row["total_spent"], 2, ".", ""),
            "total_spent" => (float)$row["total_spent"],
            "last_order" => $row["last_order_date"] ? date("d M Y", strtotime($row["last_order_date"])) : "No orders yet",
            "joined" => date("d M Y", strtotime($row["created_at"])),
            "created_at" => $row["created_at"],
            "status" => (int)$row["total_orders"] > 0 ? "Active" : "New",
            "tier" => (float)$row["total_spent"] > 5000 ? "VIP" : ((float)$row["total_spent"] > 2000 ? "Regular" : "Standard")
        ];
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "total" => count($customers),
        "customers" => $customers
    ]);
    $conn->close();
    exit;
}

/* =========================================================
   2. POST REQUESTS (Delete or Update customer)
========================================================= */
if ($method === "POST") {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!$data) {
        $data = $_POST;
    }

    $action = $data["action"] ?? "";
    $customerId = isset($data["id"]) ? intval($data["id"]) : (isset($data["customer_id"]) ? intval($data["customer_id"]) : 0);

    if ($action === "delete" || isset($data["delete"])) {
        if ($customerId <= 0) {
            echo json_encode([
                "success" => false,
                "message" => "Customer ID is required."
            ]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $conn->error
            ]);
            exit;
        }

        $stmt->bind_param("i", $customerId);
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Customer removed successfully."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to delete customer: " . $stmt->error
            ]);
        }
        $stmt->close();
        $conn->close();
        exit;
    }

    if ($action === "update_points") {
        $points = isset($data["points"]) ? intval($data["points"]) : 0;
        $stmt = $conn->prepare("UPDATE users SET points = ? WHERE id = ?");
        $stmt->bind_param("ii", $points, $customerId);
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Customer points updated."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to update points: " . $stmt->error
            ]);
        }
        $stmt->close();
        $conn->close();
        exit;
    }

    echo json_encode([
        "success" => false,
        "message" => "Unknown customer action."
    ]);
    $conn->close();
    exit;
}

/* =========================================================
   3. DELETE REQUEST (Direct DELETE method)
========================================================= */
if ($method === "DELETE") {
    $id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
    if ($id <= 0) {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput, true);
        $id = isset($data["id"]) ? intval($data["id"]) : 0;
    }

    if ($id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Customer ID is required for deletion."
        ]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Customer deleted successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to delete customer: " . $stmt->error
        ]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

http_response_code(405);
echo json_encode([
    "success" => false,
    "message" => "Method not allowed."
]);
