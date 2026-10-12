<?php
/**
 * BAD TEDDY E-Commerce - Admin Stats & Analytics API
 * GET /admin_stats.php => Real-time dashboard KPI metrics, charts data, recent orders, and stock alerts
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/admin_auth.php";

$method = $_SERVER["REQUEST_METHOD"];

if ($method !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$token = get_bearer_admin_token();
if ($token) {
    $admin = validate_admin_token($token);
    if (!$admin) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid or expired admin authorization token."]);
        exit;
    }
}

try {
    // 1. Total Revenue
    $revRes = $conn->query("SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders WHERE status != 'Cancelled'");
    $totalRevenue = $revRes ? (float)$revRes->fetch_assoc()["total_revenue"] : 0.0;

    // 2. Total Orders
    $ordRes = $conn->query("SELECT COUNT(*) AS total_orders FROM orders");
    $totalOrders = $ordRes ? (int)$ordRes->fetch_assoc()["total_orders"] : 0;

    // 3. Total Customers
    $custRes = $conn->query("SELECT COUNT(*) AS total_customers FROM users");
    $totalCustomers = $custRes ? (int)$custRes->fetch_assoc()["total_customers"] : 0;

    // 4. Total Products
    $prodRes = $conn->query("SELECT COUNT(*) AS total_products FROM products");
    $totalProducts = $prodRes ? (int)$prodRes->fetch_assoc()["total_products"] : 0;

    // 5. Low Stock Count & Items (stock <= 5)
    $lowStockRes = $conn->query("SELECT id, name, stock, price, image FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10");
    $lowStockItems = [];
    if ($lowStockRes) {
        while ($row = $lowStockRes->fetch_assoc()) {
            $lowStockItems[] = [
                "id" => (int)$row["id"],
                "name" => $row["name"],
                "stock" => (int)$row["stock"],
                "price" => (float)$row["price"],
                "image" => $row["image"]
            ];
        }
    }

    // 6. Recent Orders (Top 10)
    $recentOrdRes = $conn->query(
        "SELECT o.id, o.order_number, o.first_name, o.last_name, o.email, o.total, o.status, o.payment_method, o.created_at,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
         FROM orders o
         ORDER BY o.created_at DESC
         LIMIT 10"
    );
    $recentOrders = [];
    if ($recentOrdRes) {
        while ($row = $recentOrdRes->fetch_assoc()) {
            $recentOrders[] = [
                "id" => (int)$row["id"],
                "order_number" => $row["order_number"],
                "customer" => trim($row["first_name"] . " " . $row["last_name"]) ?: ($row["email"] ?? "Customer"),
                "email" => $row["email"],
                "total" => (float)$row["total"],
                "status" => $row["status"],
                "payment_method" => strtoupper($row["payment_method"] ?? "UPI"),
                "items_count" => (int)$row["items_count"],
                "date" => date("d M Y, h:i A", strtotime($row["created_at"])),
                "created_at" => $row["created_at"]
            ];
        }
    }

    // 7. Orders Status Distribution
    $statusDistRes = $conn->query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");
    $statusCounts = [
        "Order Confirmed" => 0,
        "Processing" => 0,
        "Shipped" => 0,
        "Delivered" => 0,
        "Cancelled" => 0
    ];
    if ($statusDistRes) {
        while ($row = $statusDistRes->fetch_assoc()) {
            $st = $row["status"];
            $statusCounts[$st] = (int)$row["count"];
        }
    }

    // 8. Monthly Sales Data (Past 6 months)
    $monthlySales = [];
    $monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Group orders by Year-Month
    $monthlyRes = $conn->query(
        "SELECT 
            DATE_FORMAT(created_at, '%Y-%m') AS ym,
            DATE_FORMAT(created_at, '%b') AS month_name,
            COALESCE(SUM(total), 0) AS revenue,
            COUNT(*) AS orders_count
         FROM orders
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY ym, month_name
         ORDER BY ym ASC"
    );

    if ($monthlyRes && $monthlyRes->num_rows > 0) {
        while ($row = $monthlyRes->fetch_assoc()) {
            $monthlySales[] = [
                "month" => $row["month_name"],
                "revenue" => (float)$row["revenue"],
                "orders" => (int)$row["orders_count"]
            ];
        }
    } else {
        // Provide standard fallback monthly curve if store is new
        $curMonthNum = (int)date('n');
        for ($i = 5; $i >= 0; $i--) {
            $mIdx = ($curMonthNum - $i - 1 + 12) % 12;
            $monthlySales[] = [
                "month" => $monthNames[$mIdx],
                "revenue" => $i === 0 ? (float)$totalRevenue : 0.0,
                "orders" => $i === 0 ? $totalOrders : 0
            ];
        }
    }

    // 9. Top Selling Products
    $topProdRes = $conn->query(
        "SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS total_sold, SUM(oi.price * oi.quantity) AS total_sales
         FROM order_items oi
         GROUP BY oi.product_id, oi.product_name
         ORDER BY total_sold DESC
         LIMIT 5"
    );
    $topProducts = [];
    if ($topProdRes && $topProdRes->num_rows > 0) {
        while ($row = $topProdRes->fetch_assoc()) {
            $topProducts[] = [
                "id" => (int)$row["product_id"],
                "name" => $row["product_name"],
                "sold" => (int)$row["total_sold"],
                "revenue" => (float)$row["total_sales"]
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "stats" => [
            "total_revenue" => $totalRevenue,
            "total_orders" => $totalOrders,
            "total_customers" => $totalCustomers,
            "total_products" => $totalProducts,
            "low_stock_count" => count($lowStockItems),
            "low_stock_items" => $lowStockItems,
            "status_counts" => $statusCounts,
            "monthly_sales" => $monthlySales,
            "recent_orders" => $recentOrders,
            "top_products" => $topProducts
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error generating admin statistics: " . $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
