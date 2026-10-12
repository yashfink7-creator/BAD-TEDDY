<?php
/**
 * BAD TEDDY E-Commerce - Product Image Upload API
 * POST /upload.php
 * Handles image uploads from Admin Product creation & edit forms.
 * Validates actual image MIME and binary integrity server-side,
 * enforces safe collision-free filenames, and rejects invalid/corrupted files.
 */

require_once __DIR__ . "/../config/cors.php";

$uploadDir = __DIR__ . "/../uploads/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Map valid MIME types to standard file extensions
$allowedMimeMap = [
    "image/jpeg" => "jpg",
    "image/pjpeg" => "jpg",
    "image/png" => "png",
    "image/x-png" => "png",
    "image/webp" => "webp",
    "image/gif" => "gif"
];

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    /* =========================================================
       1. MULTIPART FORM-DATA FILE UPLOAD
    ========================================================= */
    if (isset($_FILES["image"]) || isset($_FILES["file"])) {
        $file = $_FILES["image"] ?? $_FILES["file"];

        if ($file["error"] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE   => "File exceeds upload_max_filesize directive.",
                UPLOAD_ERR_FORM_SIZE  => "File exceeds MAX_FILE_SIZE specified in form.",
                UPLOAD_ERR_PARTIAL    => "File was only partially uploaded.",
                UPLOAD_ERR_NO_FILE    => "No file was uploaded.",
                UPLOAD_ERR_NO_TMP_DIR => "Missing temporary upload folder.",
                UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk.",
                UPLOAD_ERR_EXTENSION  => "A PHP extension stopped the file upload."
            ];
            echo json_encode([
                "success" => false,
                "message" => $errorMessages[$file["error"]] ?? ("Upload error code: " . $file["error"])
            ]);
            exit;
        }

        // Limit file size (max 10MB)
        if ($file["size"] <= 0 || $file["size"] > 10 * 1024 * 1024) {
            echo json_encode([
                "success" => false,
                "message" => "File size is invalid or exceeds maximum limit of 10MB."
            ]);
            exit;
        }

        $tmpPath = $file["tmp_name"];

        // 1. Server-side MIME validation via finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpPath);
        finfo_close($finfo);

        if (!isset($allowedMimeMap[$mimeType])) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid file type ('$mimeType'). Only real JPG, PNG, WEBP, and GIF images are allowed."
            ]);
            exit;
        }

        // 2. Binary integrity check via getimagesize()
        $imageInfo = @getimagesize($tmpPath);
        if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
            echo json_encode([
                "success" => false,
                "message" => "Corrupted or invalid image file. Could not read image dimensions."
            ]);
            exit;
        }

        // Safe extension derived strictly from verified MIME
        $verifiedExtension = $allowedMimeMap[$mimeType];

        // 3. Generate collision-resistant unique filename
        $uniqueSuffix = bin2hex(random_bytes(8));
        $filename = "prod_" . date("Ymd_His") . "_" . $uniqueSuffix . "." . $verifiedExtension;
        $targetPath = $uploadDir . $filename;

        $moved = is_uploaded_file($tmpPath) ? move_uploaded_file($tmpPath, $targetPath) : @copy($tmpPath, $targetPath);
        if ($moved) {
            $relativeUrl = "uploads/" . $filename;
            $fullUrl = "http://localhost/BAD%20TEDDY/backend/uploads/" . $filename;

            echo json_encode([
                "success" => true,
                "message" => "Image verified and uploaded successfully.",
                "filename" => $filename,
                "image" => $relativeUrl,
                "url" => $fullUrl,
                "slot" => $_POST["slot"] ?? null,
                "width" => $imageInfo[0],
                "height" => $imageInfo[1],
                "mime" => $mimeType
            ]);
            exit;
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to move uploaded file to destination directory."
            ]);
            exit;
        }
    }

    /* =========================================================
       2. BASE64 JSON UPLOAD (Fallback / Direct Transfer)
    ========================================================= */
    $input = json_decode(file_get_contents("php://input"), true) ?? [];
    if (!empty($input["image_base64"])) {
        $base64String = $input["image_base64"];

        if (preg_match('/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/s', $base64String, $matches)) {
            $rawBase64 = $matches[2];
            $decoded = base64_decode($rawBase64, true);

            if ($decoded === false) {
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid base64 encoding."
                ]);
                exit;
            }

            // Check size (max 10MB)
            if (strlen($decoded) > 10 * 1024 * 1024 || strlen($decoded) < 10) {
                echo json_encode([
                    "success" => false,
                    "message" => "Base64 image size is invalid or exceeds 10MB."
                ]);
                exit;
            }

            // 1. Validate MIME using finfo on raw memory buffer
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_buffer($finfo, $decoded);
            finfo_close($finfo);

            if (!isset($allowedMimeMap[$mimeType])) {
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid base64 image MIME type ('$mimeType'). Allowed: JPG, PNG, WEBP, GIF."
                ]);
                exit;
            }

            // 2. Validate binary integrity with getimagesizefromstring()
            $imageInfo = @getimagesizefromstring($decoded);
            if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
                echo json_encode([
                    "success" => false,
                    "message" => "Corrupted or invalid base64 image binary data."
                ]);
                exit;
            }

            $verifiedExtension = $allowedMimeMap[$mimeType];
            $uniqueSuffix = bin2hex(random_bytes(8));
            $filename = "prod_" . date("Ymd_His") . "_" . $uniqueSuffix . "." . $verifiedExtension;
            $targetPath = $uploadDir . $filename;

            if (file_put_contents($targetPath, $decoded) !== false) {
                $relativeUrl = "uploads/" . $filename;
                $fullUrl = "http://localhost/BAD%20TEDDY/backend/uploads/" . $filename;

                echo json_encode([
                    "success" => true,
                    "message" => "Base64 image verified and uploaded successfully.",
                    "filename" => $filename,
                    "image" => $relativeUrl,
                    "url" => $fullUrl,
                    "slot" => $input["slot"] ?? null,
                    "width" => $imageInfo[0],
                    "height" => $imageInfo[1],
                    "mime" => $mimeType
                ]);
                exit;
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Failed to write base64 image to destination directory."
                ]);
                exit;
            }
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Invalid base64 data URI format. Expected 'data:image/...;base64,...'"
            ]);
            exit;
        }
    }

    echo json_encode([
        "success" => false,
        "message" => "No valid image file or base64 payload provided."
    ]);
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "Only POST requests are supported for image uploads."
]);

