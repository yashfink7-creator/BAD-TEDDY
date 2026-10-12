<?php

require_once __DIR__ . "/../config/cors.php";


/* =========================================
   ONLY POST REQUESTS
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
   READ JSON DATA
========================================= */

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!$input) {

    echo json_encode([
        "success" => false,
        "message" => "No registration data received."
    ]);

    exit;
}


/* =========================================
   GET FORM DATA
========================================= */

$name = trim($input["name"] ?? "");

$email = trim($input["email"] ?? "");

$phone = trim($input["phone"] ?? "");

$password = $input["password"] ?? "";


/* =========================================
   VALIDATION
========================================= */

if (
    $name === "" ||
    $email === "" ||
    $phone === "" ||
    $password === ""
) {

    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);

    exit;
}


/* =========================================
   VALIDATE EMAIL
========================================= */

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);

    exit;
}


/* =========================================
   CHECK EXISTING EMAIL
========================================= */

$stmt = $conn->prepare(
    "SELECT id
     FROM users
     WHERE email = ?
     LIMIT 1"
);

$stmt->bind_param("s", $email);

$stmt->execute();

$result = $stmt->get_result();


if ($result->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "An account with this email already exists."
    ]);

    $stmt->close();
    $conn->close();

    exit;
}

$stmt->close();


/* =========================================
   HASH PASSWORD
========================================= */

$hashedPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);


/* =========================================
   INSERT USER
========================================= */

$stmt = $conn->prepare(
    "INSERT INTO users
    (name, email, phone, password)
    VALUES (?, ?, ?, ?)"
);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Registration query failed."
    ]);

    $conn->close();

    exit;
}


$stmt->bind_param(
    "ssss",
    $name,
    $email,
    $phone,
    $hashedPassword
);


if ($stmt->execute()) {

    echo json_encode([

        "success" => true,

        "message" => "Account created successfully.",

        "user" => [
            "id" => (int)$stmt->insert_id,
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "points" => 250
        ]

    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Unable to create account."
    ]);
}


$stmt->close();

$conn->close();

?>