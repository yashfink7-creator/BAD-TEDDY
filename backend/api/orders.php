<?php
/**
 * BAD TEDDY E-Commerce - Orders API
 * GET  /orders.php?id=X       => Fetch single order details + items
 * GET  /orders.php?user_id=X  => Fetch order history for a user
 * POST /orders.php            => Create new order (reads cart or direct items, clears cart)
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$method = $_SERVER["REQUEST_METHOD"];

/* =========================================================
   1. GET ORDER(S)
========================================================= */
if ($method === "GET") {

    /* -----------------------------------------------------
       A. GET SINGLE ORDER BY ID OR ORDER NUMBER
    ----------------------------------------------------- */
    if (isset($_GET["id"]) || isset($_GET["order_number"])) {
        $orderId = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
        $orderNumber = trim($_GET["order_number"] ?? "");

        if ($orderId > 0) {
            $stmt = $conn->prepare(
                "SELECT id, order_number, user_id, first_name, last_name, email, phone, address, city, state, pincode,
                        payment_method, subtotal, shipping, discount, total, status, created_at
                 FROM orders WHERE id = ?"
            );
            $stmt->bind_param("i", $orderId);
        } else {
            $stmt = $conn->prepare(
                "SELECT id, order_number, user_id, first_name, last_name, email, phone, address, city, state, pincode,
                        payment_method, subtotal, shipping, discount, total, status, created_at
                 FROM orders WHERE order_number = ?"
            );
            $stmt->bind_param("s", $orderNumber);
        }

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Query preparation failed: " . $conn->error
            ]);
            exit;
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Order not found."
            ]);
            $stmt->close();
            exit;
        }

        $row = $result->fetch_assoc();
        $realOrderId = (int)$row["id"];

        // Fetch order items with product images
        $itemStmt = $conn->prepare(
            "SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.quantity, oi.size,
                    COALESCE(p.image, '') AS image, COALESCE(p.category, 'BAD TEDDY') AS category
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC"
        );
        $itemStmt->bind_param("i", $realOrderId);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();

        $items = [];
        while ($item = $itemResult->fetch_assoc()) {
            $items[] = [
                "id" => (int)$item["product_id"],
                "name" => $item["product_name"],
                "price" => (float)$item["price"],
                "quantity" => (int)$item["quantity"],
                "size" => $item["size"] ?? "N/A",
                "image" => $item["image"],
                "category" => $item["category"]
            ];
        }
        $itemStmt->close();

        $order = [
            "id" => $realOrderId,
            "orderNumber" => $row["order_number"],
            "userId" => (int)$row["user_id"],
            "customer" => [
                "firstName" => $row["first_name"],
                "lastName" => $row["last_name"],
                "name" => trim($row["first_name"] . " " . $row["last_name"]),
                "email" => $row["email"],
                "phone" => $row["phone"],
                "address" => $row["address"],
                "city" => $row["city"],
                "state" => $row["state"],
                "pincode" => $row["pincode"]
            ],
            "paymentMethod" => $row["payment_method"],
            "subtotal" => (float)$row["subtotal"],
            "shipping" => (float)$row["shipping"],
            "discount" => (float)$row["discount"],
            "total" => (float)$row["total"],
            "status" => $row["status"],
            "createdAt" => $row["created_at"],
            "items" => $items
        ];

        echo json_encode([
            "success" => true,
            "order" => $order
        ]);

        $stmt->close();
        exit;
    }

    /* -----------------------------------------------------
       B. GET ALL ORDERS FOR A USER
    ----------------------------------------------------- */
    if (isset($_GET["user_id"])) {
        $userId = intval($_GET["user_id"]);

        if ($userId <= 0) {
            echo json_encode([
                "success" => false,
                "message" => "Valid user ID is required."
            ]);
            exit;
        }

        $stmt = $conn->prepare(
            "SELECT id, order_number, user_id, first_name, last_name, email, phone, address, city, state, pincode,
                    payment_method, subtotal, shipping, discount, total, status, created_at
             FROM orders
             WHERE user_id = ?
             ORDER BY created_at DESC, id DESC"
        );

        if (!$stmt) {
            echo json_encode([
                "success" => false,
                "message" => "Failed to prepare order history query: " . $conn->error
            ]);
            exit;
        }

        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orderId = (int)$row["id"];

            // Fetch items for each order
            $itemStmt = $conn->prepare(
                "SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.quantity, oi.size,
                        COALESCE(p.image, '') AS image, COALESCE(p.category, 'BAD TEDDY') AS category
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?
                 ORDER BY oi.id ASC"
            );
            $itemStmt->bind_param("i", $orderId);
            $itemStmt->execute();
            $itemResult = $itemStmt->get_result();

            $items = [];
            while ($item = $itemResult->fetch_assoc()) {
                $items[] = [
                    "id" => (int)$item["product_id"],
                    "name" => $item["product_name"],
                    "price" => (float)$item["price"],
                    "quantity" => (int)$item["quantity"],
                    "size" => $item["size"] ?? "N/A",
                    "image" => $item["image"],
                    "category" => $item["category"]
                ];
            }
            $itemStmt->close();

            $orders[] = [
                "id" => $orderId,
                "orderNumber" => $row["order_number"],
                "userId" => (int)$row["user_id"],
                "customer" => [
                    "firstName" => $row["first_name"],
                    "lastName" => $row["last_name"],
                    "name" => trim($row["first_name"] . " " . $row["last_name"]),
                    "email" => $row["email"],
                    "phone" => $row["phone"],
                    "address" => $row["address"],
                    "city" => $row["city"],
                    "state" => $row["state"],
                    "pincode" => $row["pincode"]
                ],
                "paymentMethod" => $row["payment_method"],
                "subtotal" => (float)$row["subtotal"],
                "shipping" => (float)$row["shipping"],
                "discount" => (float)$row["discount"],
                "total" => (float)$row["total"],
                "status" => $row["status"],
                "createdAt" => $row["created_at"],
                "items" => $items
            ];
        }

        echo json_encode([
            "success" => true,
            "orders" => $orders
        ]);

        $stmt->close();
        exit;
    }

    /* -----------------------------------------------------
       C. GET ALL STORE ORDERS (FOR ADMIN)
    ----------------------------------------------------- */
    $stmt = $conn->prepare(
        "SELECT id, order_number, user_id, first_name, last_name, email, phone, address, city, state, pincode,
                payment_method, subtotal, shipping, discount, total, status, created_at
         FROM orders
         ORDER BY created_at DESC, id DESC"
    );

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to prepare admin orders query: " . $conn->error
        ]);
        exit;
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orderId = (int)$row["id"];

        // Fetch items for each order
        $itemStmt = $conn->prepare(
            "SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.quantity, oi.size,
                    COALESCE(p.image, '') AS image, COALESCE(p.category, 'BAD TEDDY') AS category
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC"
        );
        $itemStmt->bind_param("i", $orderId);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();

        $items = [];
        while ($item = $itemResult->fetch_assoc()) {
            $items[] = [
                "id" => (int)$item["product_id"],
                "name" => $item["product_name"],
                "price" => (float)$item["price"],
                "quantity" => (int)$item["quantity"],
                "size" => $item["size"] ?? "N/A",
                "image" => $item["image"],
                "category" => $item["category"]
            ];
        }
        $itemStmt->close();

        $orders[] = [
            "id" => $orderId,
            "orderNumber" => $row["order_number"],
            "userId" => (int)$row["user_id"],
            "customer" => [
                "firstName" => $row["first_name"],
                "lastName" => $row["last_name"],
                "name" => trim($row["first_name"] . " " . $row["last_name"]),
                "email" => $row["email"],
                "phone" => $row["phone"],
                "address" => $row["address"],
                "city" => $row["city"],
                "state" => $row["state"],
                "pincode" => $row["pincode"]
            ],
            "paymentMethod" => $row["payment_method"],
            "payment" => strtoupper($row["payment_method"]),
            "subtotal" => (float)$row["subtotal"],
            "shipping" => (float)$row["shipping"],
            "discount" => (float)$row["discount"],
            "total" => (float)$row["total"],
            "status" => $row["status"],
            "createdAt" => $row["created_at"],
            "itemsCount" => count($items),
            "items" => $items
        ];
    }

    echo json_encode([
        "success" => true,
        "total" => count($orders),
        "orders" => $orders
    ]);

    $stmt->close();
    exit;
}

/* =========================================================
   2. CREATE OR MANAGE ORDERS (POST)
========================================================= */
if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true) ?? [];

    /* -----------------------------------------------------
       A. UPDATE ORDER STATUS (ADMIN ACTION)
    ----------------------------------------------------- */
    if (isset($input["action"]) && $input["action"] === "update_status") {
        $orderId = intval($input["order_id"] ?? $input["id"] ?? 0);
        $orderNumber = trim($input["order_number"] ?? "");
        $newStatus = trim($input["status"] ?? "Confirmed");

        if ($orderId > 0) {
            $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $newStatus, $orderId);
        } else {
            $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE order_number = ?");
            $stmt->bind_param("ss", $newStatus, $orderNumber);
        }

        if ($stmt && $stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Order status updated to $newStatus."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to update order status: " . ($stmt ? $stmt->error : $conn->error)
            ]);
        }
        if ($stmt) $stmt->close();
        exit;
    }

    /* -----------------------------------------------------
       B. DELETE ORDER (ADMIN ACTION)
    ----------------------------------------------------- */
    if (isset($input["action"]) && $input["action"] === "delete") {
        $orderId = intval($input["order_id"] ?? $input["id"] ?? 0);
        $orderNumber = trim($input["order_number"] ?? "");

        if ($orderId > 0) {
            $stmt = $conn->prepare("DELETE FROM orders WHERE id = ?");
            $stmt->bind_param("i", $orderId);
        } else {
            $stmt = $conn->prepare("DELETE FROM orders WHERE order_number = ?");
            $stmt->bind_param("s", $orderNumber);
        }

        if ($stmt && $stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Order deleted successfully."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to delete order: " . ($stmt ? $stmt->error : $conn->error)
            ]);
        }
        if ($stmt) $stmt->close();
        exit;
    }

    /* -----------------------------------------------------
       C. CANCEL ORDER ACTION
    ----------------------------------------------------- */
    if (isset($input["action"]) && $input["action"] === "cancel") {
        $orderId = intval($input["order_id"] ?? 0);
        $orderNumber = trim($input["order_number"] ?? "");
        $userId = intval($input["user_id"] ?? 0);

        if ($orderId > 0) {
            $stmt = $conn->prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?");
            $stmt->bind_param("i", $orderId);
        } else {
            $stmt = $conn->prepare("UPDATE orders SET status = 'Cancelled' WHERE order_number = ?");
            $stmt->bind_param("s", $orderNumber);
        }

        if ($stmt && $stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Order cancelled successfully."
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to cancel order: " . ($stmt ? $stmt->error : $conn->error)
            ]);
        }
        if ($stmt) $stmt->close();
        exit;
    }

    $userId = intval($input["user_id"] ?? 0);
    $customer = $input["customer"] ?? [];

    $firstName = trim($customer["firstName"] ?? $customer["first_name"] ?? "");
    $lastName = trim($customer["lastName"] ?? $customer["last_name"] ?? "");
    $email = trim($customer["email"] ?? "");
    $phone = trim($customer["phone"] ?? "");
    $address = trim($customer["address"] ?? "");
    $city = trim($customer["city"] ?? "");
    $state = trim($customer["state"] ?? "");
    $pincode = trim($customer["pincode"] ?? "");
    $paymentMethod = trim($input["payment_method"] ?? "upi");

    if (empty($firstName) || empty($phone) || empty($address) || empty($city) || empty($pincode)) {
        echo json_encode([
            "success" => false,
            "message" => "Please complete all required delivery details (Name, Phone, Address, City, Pincode)."
        ]);
        exit;
    }

    /* -----------------------------------------------------
       A. GATHER ORDER ITEMS:
       1) From database cart table for user
       2) Fallback to database cart_items table
       3) Fallback to input["items"] if provided
    ----------------------------------------------------- */
    $orderItems = [];
    $subtotal = 0.0;

    if ($userId > 0) {
        $cartSql = "
            SELECT c.product_id, c.quantity, c.size, p.name, p.price, p.image
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        ";
        $cartStmt = $conn->prepare($cartSql);
        if ($cartStmt) {
            $cartStmt->bind_param("i", $userId);
            $cartStmt->execute();
            $cartResult = $cartStmt->get_result();

            while ($row = $cartResult->fetch_assoc()) {
                $pPrice = (float)$row["price"];
                $pQty = max(1, (int)$row["quantity"]);
                $subtotal += $pPrice * $pQty;

                $orderItems[] = [
                    "product_id" => (int)$row["product_id"],
                    "name" => $row["name"],
                    "price" => $pPrice,
                    "quantity" => $pQty,
                    "size" => $row["size"] ?? "M",
                    "image" => $row["image"] ?? ""
                ];
            }
            $cartStmt->close();
        }

        // Fallback to cart_items table if cart was empty
        if (count($orderItems) === 0) {
            $ciSql = "
                SELECT ci.product_id, ci.quantity, ci.size, p.name, p.price, p.image
                FROM cart_items ci
                INNER JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?
            ";
            $ciStmt = $conn->prepare($ciSql);
            if ($ciStmt) {
                $ciStmt->bind_param("i", $userId);
                $ciStmt->execute();
                $ciResult = $ciStmt->get_result();

                while ($row = $ciResult->fetch_assoc()) {
                    $pPrice = (float)$row["price"];
                    $pQty = max(1, (int)$row["quantity"]);
                    $subtotal += $pPrice * $pQty;

                    $orderItems[] = [
                        "product_id" => (int)$row["product_id"],
                        "name" => $row["name"],
                        "price" => $pPrice,
                        "quantity" => $pQty,
                        "size" => $row["size"] ?? "M",
                        "image" => $row["image"] ?? ""
                    ];
                }
                $ciStmt->close();
            }
        }
    }

    // Fallback to input items array if DB cart had no records
    if (count($orderItems) === 0 && !empty($input["items"]) && is_array($input["items"])) {
        foreach ($input["items"] as $item) {
            $pId = intval($item["id"] ?? $item["product_id"] ?? 0);
            $pName = trim($item["name"] ?? "Bad Teddy Item");
            $cleanPrice = (float)str_replace([",", "₹", " "], "", (string)($item["price"] ?? 0));
            $pQty = max(1, intval($item["quantity"] ?? 1));
            $pSize = trim($item["size"] ?? "M");
            $pImage = trim($item["image"] ?? "");

            $subtotal += $cleanPrice * $pQty;
            $orderItems[] = [
                "product_id" => $pId,
                "name" => $pName,
                "price" => $cleanPrice,
                "quantity" => $pQty,
                "size" => $pSize,
                "image" => $pImage
            ];
        }
    }

    if (count($orderItems) === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Your cart is empty. Please add products to checkout."
        ]);
        exit;
    }

    // Calculate delivery shipping & grand total
    $shipping = ($subtotal >= 1999 || $subtotal == 0) ? 0.0 : 99.0;
    $discount = 0.0;
    $total = $subtotal - $discount + $shipping;

    // Generate unique order number (e.g., BT2026092812345678)
    $orderNumber = "BT" . date("YmdHis") . rand(10, 99);
    $status = "Order Confirmed";

    /* -----------------------------------------------------
       B. INSERT INTO orders TABLE
    ----------------------------------------------------- */
    $orderSql = "
        INSERT INTO orders
        (order_number, user_id, first_name, last_name, email, phone, address, city, state, pincode,
         payment_method, subtotal, shipping, discount, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $orderStmt = $conn->prepare($orderSql);
    if (!$orderStmt) {
        echo json_encode([
            "success" => false,
            "message" => "Unable to prepare order query: " . $conn->error
        ]);
        exit;
    }

    $orderStmt->bind_param(
        "sisssssssssdddds",
        $orderNumber,
        $userId,
        $firstName,
        $lastName,
        $email,
        $phone,
        $address,
        $city,
        $state,
        $pincode,
        $paymentMethod,
        $subtotal,
        $shipping,
        $discount,
        $total,
        $status
    );

    if (!$orderStmt->execute()) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to create order: " . $orderStmt->error
        ]);
        $orderStmt->close();
        exit;
    }

    $orderId = $orderStmt->insert_id;
    $orderStmt->close();

    /* -----------------------------------------------------
       C. INSERT INTO order_items TABLE
    ----------------------------------------------------- */
    $itemSql = "
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, size)
        VALUES (?, ?, ?, ?, ?, ?)
    ";
    $itemStmt = $conn->prepare($itemSql);
    if ($itemStmt) {
        foreach ($orderItems as $item) {
            $itemStmt->bind_param(
                "iisdis",
                $orderId,
                $item["product_id"],
                $item["name"],
                $item["price"],
                $item["quantity"],
                $item["size"]
            );
            $itemStmt->execute();
        }
        $itemStmt->close();
    }

    /* -----------------------------------------------------
       D. CLEAR CART AFTER SUCCESSFUL ORDER
    ----------------------------------------------------- */
    if ($userId > 0) {
        $clearCartStmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
        if ($clearCartStmt) {
            $clearCartStmt->bind_param("i", $userId);
            $clearCartStmt->execute();
            $clearCartStmt->close();
        }

        $clearCiStmt = $conn->prepare("DELETE FROM cart_items WHERE user_id = ?");
        if ($clearCiStmt) {
            $clearCiStmt->bind_param("i", $userId);
            $clearCiStmt->execute();
            $clearCiStmt->close();
        }
    }

    /* -----------------------------------------------------
       E. ASSEMBLE FULL ORDER RESPONSE
    ----------------------------------------------------- */
    $createdDate = date("Y-m-d H:i:s");
    $fullOrder = [
        "id" => $orderId,
        "orderNumber" => $orderNumber,
        "userId" => $userId,
        "customer" => [
            "firstName" => $firstName,
            "lastName" => $lastName,
            "name" => trim($firstName . " " . $lastName),
            "email" => $email,
            "phone" => $phone,
            "address" => $address,
            "city" => $city,
            "state" => $state,
            "pincode" => $pincode
        ],
        "items" => $orderItems,
        "subtotal" => $subtotal,
        "shipping" => $shipping,
        "discount" => $discount,
        "total" => $total,
        "paymentMethod" => $paymentMethod,
        "status" => $status,
        "createdAt" => $createdDate
    ];

    echo json_encode([
        "success" => true,
        "message" => "Order placed successfully.",
        "order" => $fullOrder
    ]);
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Invalid request method."
]);