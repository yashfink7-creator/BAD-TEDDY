-- =========================================================
-- BAD TEDDY E-COMMERCE DATABASE SCHEMA
-- Fully compatible with MySQL 5.1 / 5.5 / 5.6 / 5.7 / 8.0 & MariaDB
-- =========================================================

CREATE DATABASE IF NOT EXISTS `bad_teddy` 
DEFAULT CHARACTER SET utf8 
COLLATE utf8_unicode_ci;

USE `bad_teddy`;

-- ---------------------------------------------------------
-- 1. USERS TABLE
-- Stores member profiles, login credentials & points
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `points` INT DEFAULT 250,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 2. PRODUCTS TABLE
-- Streetwear catalog matching Bad Teddy assets & styles
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `style` VARCHAR(100) DEFAULT 'Streetwear',
  `image` VARCHAR(255) NOT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `is_new` TINYINT(1) DEFAULT 0,
  `is_trending` TINYINT(1) DEFAULT 0,
  `is_best_seller` TINYINT(1) DEFAULT 0,
  `stock` INT DEFAULT 15,
  `sizes` VARCHAR(100) DEFAULT 'S,M,L,XL,XXL',
  `rating` DECIMAL(3,1) DEFAULT 4.5,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 2b. PRODUCT IMAGES TABLE
-- Multi-image gallery supporting front, back, sitting, and standing views
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `image_type` VARCHAR(50) NOT NULL DEFAULT 'front',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ---------------------------------------------------------
-- 3. CART TABLE
-- Active shopping cart items per user
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `size` VARCHAR(20) DEFAULT 'M',
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cart_user` (`user_id`),
  KEY `idx_cart_product` (`product_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 4. WISHLIST TABLE
-- Saved items per user
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_wishlist` (`user_id`, `product_id`),
  KEY `idx_wishlist_product` (`product_id`),
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 5. ORDERS TABLE
-- Completed checkout orders
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address` VARCHAR(500) NOT NULL,
  `landmark` VARCHAR(150) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'upi',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Order Confirmed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 6. ORDER ITEMS TABLE
-- Line items associated with each order
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `size` VARCHAR(20) DEFAULT 'M',
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 7. USER ADDRESSES TABLE
-- Saved delivery addresses for savedadd.jsx & checkout.jsx
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `landmark` VARCHAR(150) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `is_default` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  KEY `idx_user_addresses_user` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 8. USER PAYMENT METHODS TABLE
-- Saved card identifiers and UPI IDs for paymethod.jsx
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('card', 'upi') NOT NULL,
  `card_name` VARCHAR(100) DEFAULT NULL,
  `last_four` VARCHAR(4) DEFAULT NULL,
  `expiry` VARCHAR(10) DEFAULT NULL,
  `brand` VARCHAR(50) DEFAULT NULL,
  `upi_id` VARCHAR(100) DEFAULT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_payment_user` (`user_id`),
  CONSTRAINT `fk_user_payment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 9. NEWSLETTER SUBSCRIBERS TABLE
-- Subscriptions for newsletter.php
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- 10. REVIEWS TABLE
-- Product customer reviews
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_reviews_product` (`product_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ---------------------------------------------------------
-- INITIAL SEED DATA (Inserts only if not already present)
-- ---------------------------------------------------------

INSERT INTO `products` (`id`, `name`, `description`, `price`, `category`, `style`, `image`, `badge`, `is_new`, `is_trending`, `is_best_seller`, `stock`, `sizes`, `rating`)
VALUES
(1, 'Oversized Signature Tee', 'Premium Bad Teddy oversized heavyweight t-shirt designed for all-day comfort with signature street fit.', 999.00, 'T-Shirts', 'Oversized', 'prod1.jpeg', 'NEW DROP', 1, 1, 0, 25, 'S,M,L,XL,XXL', 4.8),
(2, 'Premium Black Hoodie', 'Signature heavyweight fleece hoodie built with double-layered hood and comfortable ribbed cuffs.', 1799.00, 'Hoodies', 'Streetwear', 'prod2.jpg', 'BEST SELLER', 0, 1, 1, 20, 'S,M,L,XL,XXL', 4.9),
(3, 'Relaxed Cargo Pants', 'Multi-pocket tactical streetwear cargo pants with adjustable ankles and elasticated waistband.', 1599.00, 'Jeans', 'Edgy', 'prod3.jpg', 'TRENDING', 1, 1, 0, 15, 'S,M,L,XL,XXL', 4.7),
(4, 'Street Graphic Tee', 'Bold front and back screen printed graphic t-shirt inspired by modern underground street culture.', 999.00, 'T-Shirts', 'Y2K', 'prod4.jpg', 'HOT', 1, 0, 0, 30, 'S,M,L,XL,XXL', 4.6),
(5, 'Signature Teddy Cap', 'Structured 6-panel streetwear cap featuring high-definition 3D Bad Teddy signature embroidery.', 799.00, 'Caps', 'Minimal', 'prod5.png', 'LIMITED', 0, 0, 1, 10, 'Free Size', 4.5)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `price` = VALUES(`price`),
  `category` = VALUES(`category`),
  `style` = VALUES(`style`),
  `image` = VALUES(`image`),
  `stock` = VALUES(`stock`);

-- Sample initial reviews for seed products
INSERT IGNORE INTO `reviews` (`id`, `product_id`, `user_name`, `rating`, `comment`)
VALUES
(1, 1, 'Rahul Sharma', 5.0, 'Amazing quality! The oversized fit is exactly what I wanted. Definitely buying again.'),
(2, 2, 'Aman Khan', 4.5, 'Great fabric and premium stitching. Worth every rupee.'),
(3, 3, 'Sahil Mehta', 4.0, 'Loved the cargo pockets and fit. Delivery was super fast.');
