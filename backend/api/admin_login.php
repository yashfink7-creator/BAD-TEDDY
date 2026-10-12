<?php
/**
 * BAD TEDDY E-Commerce - Dedicated Admin Login & Verification API
 * POST /admin_login.php          => Authenticate admin credentials & issue admin JWT token
 * GET  /admin_login.php?verify=1 => Verify existing admin session token
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/admin_auth.php";

$method = $_SERVER["REQUEST_METHOD"];

/* =========================================================
   1. GET: VERIFY ADMIN TOKEN
========================================================= */
if ($method === "GET") {
    $token = get_bearer_admin_token();
    $validData = validate_admin_token($token);

    if ($validData) {
        echo json_encode([
            "success" => true,
            "valid" => true,
            "admin" => [
                "email" => $validData["sub"],
                "role" => $validData["role"]
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "valid" => false,
            "message" => "Admin session is invalid or expired."
        ]);
    }
    exit;
}

/* =========================================================
   2. POST: ADMIN LOGIN
========================================================= */
if ($method === "POST") {
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    if (!$input && !empty($_POST)) {
        $input = $_POST;
    }

    if (!$input && !empty($rawInput)) {
        parse_str($rawInput, $input);
    }

    if (!$input) {
        echo json_encode([
            "success" => false,
            "message" => "No login data received."
        ]);
        exit;
    }

    $email = trim($input["email"] ?? "");
    $password = $input["password"] ?? "";

    if ($email === "" || $password === "") {
        echo json_encode([
            "success" => false,
            "message" => "Admin email and password are required."
        ]);
        exit;
    }

    // Default primary admin credentials
    $defaultAdminEmail = "admin@badteddy.com";
    $defaultAdminPass = "admin123";

    $isAuthenticated = false;
    $adminName = "Bad Teddy Admin";
    $adminRole = "Super Admin";

    // Check against standard super admin credentials
    if (strtolower($email) === strtolower($defaultAdminEmail) && $password === $defaultAdminPass) {
        $isAuthenticated = true;
    } else {
        // Also check if an admin account was configured in users with role/admin flag
        $stmt = $conn->prepare("SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res && $res->num_rows > 0) {
                $user = $res->fetch_assoc();
                if (password_verify($password, $user["password"])) {
                    // Check if this user is designated as admin (email contains admin or matches)
                    if (strpos(strtolower($user["email"]), "admin") !== false) {
                        $isAuthenticated = true;
                        $adminName = $user["name"];
                    }
                }
            }
            $stmt->close();
        }
    }

    if (!$isAuthenticated) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid admin credentials. Access denied."
        ]);
        exit;
    }

    // Generate secure admin token
    $token = generate_admin_token($email);

    echo json_encode([
        "success" => true,
        "message" => "Admin authentication successful.",
        "admin" => [
            "id" => 1,
            "name" => $adminName,
            "email" => $email,
            "role" => $adminRole,
            "token" => $token
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
