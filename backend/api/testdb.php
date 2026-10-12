<?php
/**
 * BAD TEDDY E-Commerce - Database & CORS Diagnostic Endpoint
 */

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

$tablesRes = $conn->query("SHOW TABLES");
$tables = [];

if ($tablesRes) {
    while ($row = $tablesRes->fetch_row()) {
        $tableName = $row[0];
        $countRes = $conn->query("SELECT COUNT(*) FROM `$tableName`");
        $rowCount = $countRes ? $countRes->fetch_row()[0] : 0;
        $tables[] = [
            "table" => $tableName,
            "row_count" => (int)$rowCount
        ];
    }
}

echo json_encode([
    "success" => true,
    "message" => "Database connection and CORS are configured and active.",
    "database" => $database,
    "server_version" => $conn->server_info,
    "charset" => $conn->character_set_name(),
    "cors" => [
        "status" => "enabled",
        "allowed_methods" => "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    ],
    "tables_count" => count($tables),
    "tables" => $tables
], JSON_PRETTY_PRINT);