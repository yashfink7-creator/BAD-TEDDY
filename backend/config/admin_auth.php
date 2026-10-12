<?php
/**
 * BAD TEDDY E-Commerce - Admin Authentication Helper
 * Provides server-side validation for Admin API requests
 */

if (!defined("BAD_TEDDY_ADMIN_SECRET")) {
    define("BAD_TEDDY_ADMIN_SECRET", "BAD_TEDDY_SUPER_ADMIN_SECRET_KEY_2026_JWT_STREETWEAR");
}

/**
 * Generate a secure admin token
 */
function generate_admin_token($email) {
    $header = base64_encode(json_encode(["typ" => "JWT", "alg" => "HS256"]));
    $payload = base64_encode(json_encode([
        "sub" => $email,
        "role" => "super_admin",
        "iat" => time(),
        "exp" => time() + (86400 * 7) // 7 days valid
    ]));
    $signature = hash_hmac("sha256", "$header.$payload", BAD_TEDDY_ADMIN_SECRET);
    return "$header.$payload.$signature";
}

/**
 * Validate an admin token
 */
function validate_admin_token($token) {
    if (empty($token)) {
        return false;
    }

    $parts = explode(".", $token);
    if (count($parts) !== 3) {
        return false;
    }

    list($header, $payload, $signature) = $parts;
    $validSignature = hash_hmac("sha256", "$header.$payload", BAD_TEDDY_ADMIN_SECRET);

    if (!hash_equals($validSignature, $signature)) {
        return false;
    }

    $payloadData = json_decode(base64_decode($payload), true);
    if (!$payloadData || !isset($payloadData["exp"])) {
        return false;
    }

    if ($payloadData["exp"] < time()) {
        return false; // Token expired
    }

    return $payloadData;
}

/**
 * Get token from current request headers or query/body
 */
function get_bearer_admin_token() {
    $headers = [];
    if (function_exists("getallheaders")) {
        $headers = getallheaders();
    } elseif (isset($_SERVER)) {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == "HTTP_") {
                $headers[str_replace(" ", "-", ucwords(strtolower(str_replace("_", " ", substr($name, 5)))))] = $value;
            }
        }
    }

    // Check Authorization header
    $authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? $_SERVER["HTTP_AUTHORIZATION"] ?? "";
    if (preg_match("/Bearer\s+(.*)$/i", $authHeader, $matches)) {
        return trim($matches[1]);
    }

    // Check custom X-Admin-Token header
    $xAdminToken = $headers["X-Admin-Token"] ?? $headers["x-admin-token"] ?? $_SERVER["HTTP_X_ADMIN_TOKEN"] ?? "";
    if (!empty($xAdminToken)) {
        return trim($xAdminToken);
    }

    // Check query parameter fallback
    if (isset($_GET["admin_token"])) {
        return trim($_GET["admin_token"]);
    }

    return null;
}

/**
 * Require admin authentication for protected Admin endpoints
 */
function require_admin_auth() {
    $token = get_bearer_admin_token();
    $adminData = validate_admin_token($token);

    if (!$adminData) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized: Valid Admin authentication token required to access this endpoint.",
            "code" => "ADMIN_AUTH_REQUIRED"
        ]);
        exit;
    }

    return $adminData;
}
?>
