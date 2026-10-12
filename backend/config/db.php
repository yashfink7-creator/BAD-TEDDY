<?php
/**
 * BAD TEDDY E-Commerce - Database Configuration & Connection
 * Version: 1.0.0
 */

$host = "localhost";
$user = "root";
$password = "rubinamirza";
$database = "bad_teddy";
$port = 3306;

try {
    $conn = new mysqli($host, $user, $password, $database, $port);
    $conn->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    if (!headers_sent()) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(500);
    }
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit;
}