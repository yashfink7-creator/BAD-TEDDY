<?php
require_once __DIR__ . "/../config/db.php";

echo "Creating product_images table if not exists..." . PHP_EOL;

$sql = "CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `image_type` VARCHAR(50) NOT NULL DEFAULT 'front',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

if ($conn->query($sql)) {
    echo "Successfully created product_images table." . PHP_EOL;
} else {
    echo "Error creating table: " . $conn->error . PHP_EOL;
}

$conn->close();
