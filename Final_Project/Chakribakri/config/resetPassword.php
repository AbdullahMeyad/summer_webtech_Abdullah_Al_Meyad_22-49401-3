<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../service/userService.php';

if (!isset($_GET['token']) || empty($_GET['token'])) {
    die("Invalid request.");
}

$token = trim($_GET['token']);
$userService = new UserService($conn);

try {
    // Validate token → should return user ID if valid
    $userId = $userService->validatePasswordResetToken($token);

    if ($userId) {
        // Safely redirect to password change page
        $userId = urlencode($userId);
        $token  = urlencode($token);
        header("Location: ../html/passwordChange.html?user_id={$userId}&token={$token}");
        exit();
    } else {
        echo "Invalid or expired link.";
    }
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}
?>
