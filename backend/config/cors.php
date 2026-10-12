<?php
/**
 * BAD TEDDY E-Commerce - CORS & API Headers Middleware
 * Version: 1.0.0
 */

// Allowed origins for development and production
$allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost"
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!headers_sent()) {
    if (in_array($origin, $allowed_origins) || empty($origin)) {
        header("Access-Control-Allow-Origin: " . ($origin ?: "*"));
    } else {
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
    header("Content-Type: application/json; charset=UTF-8");
}

// Immediately respond to preflight OPTIONS requests
$request_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($request_method === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "ok", "message" => "CORS preflight OK"]);
    exit;
}
