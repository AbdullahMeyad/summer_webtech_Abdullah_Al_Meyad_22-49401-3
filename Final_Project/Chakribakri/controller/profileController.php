<?php
session_start();
header("Content-Type: application/json");

require_once __DIR__ . '/../service/profileService.php';
require_once __DIR__ . '/../config/db.php';

// Check authentication - your login sets $_SESSION['user'], not $_SESSION['user_id']
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
    exit();
}

// Get user ID from the user object stored in session
$userId = $_SESSION['user']['id'];
$profileService = new ProfileService();
$method = $_SERVER['REQUEST_METHOD'];

// Handle file uploads directory
$uploadDir = '../../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

switch ($method) {
    case 'GET':
        // Fetch user profile
        try {
            $user = $profileService->getUserProfile($userId);
            if ($user) {
                echo json_encode(['success' => true, 'data' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Update user profile
        if (isset($_POST['_method']) && strtoupper($_POST['_method']) === 'UPDATE') {
            try {
                $userData = $_POST;
                $fileData = $_FILES['varsity_id_picture'] ?? null;
                
                $result = $profileService->updateUserProfile($userId, $userData, $fileData, $uploadDir);
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    http_response_code(400); // Bad Request
                    echo json_encode($result);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Update error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['success' => false, 'message' => 'Invalid request method for this endpoint.']);
        }
        break;
        
    case 'DELETE':
        // Delete user account
        try {
            $success = $profileService->deleteUserAccount($userId);
            if ($success) {
                // Unset all of the session variables
                $_SESSION = array();
                // Destroy the session
                session_destroy();
                echo json_encode(['success' => true, 'message' => 'Account deleted successfully.']);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(['success' => false, 'message' => 'Failed to delete account.']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Delete error: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Method not supported.']);
        break;
}
?>