<?php

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ . "/../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);

    exit;
}

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$email = trim($data["email"] ?? "");

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);

    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO newsletter_subscribers (email)
     VALUES (?)"
);

$stmt->bind_param(
    "s",
    $email
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Welcome to the Bad Teddy Club! 🎉"
    ]);

} else {

    if ($conn->errno === 1062) {

        echo json_encode([
            "success" => false,
            "message" => "You're already part of the Bad Teddy Club."
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Unable to subscribe right now."
        ]);

    }

}

$stmt->close();
$conn->close();

?>