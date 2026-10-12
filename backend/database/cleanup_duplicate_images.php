<?php
require_once __DIR__ . "/../config/db.php";

echo "Cleaning up duplicate and invalid product images in products table..." . PHP_EOL;

$updates = [
    6  => 'hoodie.png',
    7  => 'crops.png',
    8  => 'tshirt.png',
    9  => 'caps.png',
    12 => 'b1.png'
];

foreach ($updates as $id => $newImage) {
    $stmt = $conn->prepare("UPDATE products SET image = ? WHERE id = ?");
    if ($stmt) {
        $stmt->bind_param("si", $newImage, $id);
        $stmt->execute();
        echo "Updated product ID $id with distinct image: $newImage (affected: {$stmt->affected_rows})" . PHP_EOL;
        $stmt->close();
    }
}

echo PHP_EOL . "Current products table state:" . PHP_EOL;
$res = $conn->query("SELECT id, name, category, image FROM products ORDER BY id ASC");
while ($row = $res->fetch_assoc()) {
    echo "ID: {$row['id']} | Category: {$row['category']} | Image: {$row['image']} | Name: {$row['name']}" . PHP_EOL;
}

$conn->close();
