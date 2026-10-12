<?php

require_once __DIR__ . "/../config/cors.php";


/* =========================================
   ONLY POST ALLOWED
========================================= */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);

    exit;
}


/* =========================================
   DATABASE
========================================= */

require_once __DIR__ . "/../config/db.php";


/* =========================================
   READ JSON
========================================= */

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!$input) {

    echo json_encode([
        "success" => false,
        "message" => "No login data received."
    ]);

    exit;
}


/* =========================================
   GET EMAIL + PASSWORD
========================================= */

$email = trim($input["email"] ?? "");

$password = $input["password"] ?? "";


if ($email === "" || $password === "") {

    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);

    exit;
}


/* =========================================
   FIND USER
========================================= */

$stmt = $conn->prepare(
    "SELECT id, name, email, phone, password, created_at
     FROM users
     WHERE email = ?
     LIMIT 1"
);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Database query failed."
    ]);

    exit;
}


$stmt->bind_param("s", $email);

$stmt->execute();

$result = $stmt->get_result();


/* =========================================
   USER NOT FOUND
========================================= */

if ($result->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);

    $stmt->close();
    $conn->close();

    exit;
}


/* =========================================
   GET USER
========================================= */

$user = $result->fetch_assoc();


/* =========================================
   CHECK PASSWORD
========================================= */

if (!password_verify($password, $user["password"])) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);

    $stmt->close();
    $conn->close();

    exit;
}


/* =========================================
   LOGIN SUCCESS
========================================= */

echo json_encode([

    "success" => true,

    "message" => "Login successful.",

    "user" => [

        "id" => (int)$user["id"],

        "name" => $user["name"],

        "email" => $user["email"],

        "phone" => $user["phone"],

        "points" => isset($user["points"]) ? (int)$user["points"] : 250

    ]

]);


$stmt->close();

$conn->close();

?>