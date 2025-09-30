<?php
// Set header to return JSON responses
header("Content-Type: application/json");

// Include dependencies
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../service/userService.php';

// Initialize a default response array
$response = ['success' => false, 'message' => 'Invalid Request'];

try {
    // Ensure the request method is POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405); // Method Not Allowed
        throw new Exception("Invalid request method.");
    }
    
    // Initialize the user service
    // $conn is typically initialized in db.php
    $userService = new UserService($conn);
    $action = $_POST['action'] ?? '';

    switch ($action) {

        // ==================== REGISTER ====================
        case "register":
            // (Your existing registration code is fine)
            $first_name = trim($_POST['first_name']);
            $last_name  = trim($_POST['last_name']);
            $gender     = trim($_POST['gender']);
            $email      = trim($_POST['email']);
            $phone_number = trim($_POST['phone']);
            $nid        = trim($_POST['nid']);
            $varsity_id = trim($_POST['varsity_id']);
            $university = trim($_POST['university']);
            $department = trim($_POST['department']);
            $role       = trim($_POST['role']);
            $password   = trim($_POST['password']);

            // Handle file upload
            $varsity_id_picture = '';
            if (isset($_FILES['varsity_id_picture']) && $_FILES['varsity_id_picture']['error'] === 0) {
                $uploadDir = __DIR__ . '/../uploads/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $filename = time() . '_' . basename($_FILES['varsity_id_picture']['name']);
                $targetFile = $uploadDir . $filename;
                if (move_uploaded_file($_FILES['varsity_id_picture']['tmp_name'], $targetFile)) {
                    $varsity_id_picture = $filename;
                }
            }

            $userService->registerUser(
                $first_name, $last_name, $gender, $email, $phone_number,
                $nid, $varsity_id, $university, $department, $role,
                $password, $varsity_id_picture
            );

            $response = ['success' => true, 'message' => 'Account created! Please check your email to confirm.'];
            break;

        // ==================== LOGIN (UPDATED) ====================
        case "login":
            $email = trim($_POST['email']);
            $password = trim($_POST['password']);
            
            // ✅ Check if the 'remember' checkbox was checked from the form.
            $remember = isset($_POST['remember']);

            // ✅ Pass the 'remember' status to the service function.
            $user = $userService->loginUser($email, $password, $remember);

            session_start();
            $_SESSION['user'] = $user;

            $response = ['success' => true, 'message' => 'Login successful!', 'user' => $user];
            break;

        // ==================== CHECK UNIQUE FIELDS ====================
        case "checkUnique":
            if (empty($_POST['field']) || empty($_POST['value'])) {
                throw new Exception("Field name and value are required.");
            }
            
            $field = trim($_POST['field']);
            $value = trim($_POST['value']);
            
            // Validate allowed fields to prevent SQL injection
            $allowedFields = ['email', 'phone_number', 'nid', 'varsity_id'];
            if (!in_array($field, $allowedFields)) {
                throw new Exception("Invalid field specified.");
            }
            
            // Check if value exists in database
            $exists = $userService->checkFieldExists($field, $value);
            
            $response = ['success' => true, 'isUnique' => !$exists];
            break;

        // ==================== FORGOT PASSWORD ====================
        case "forgotPassword":
            // (Your existing forgot password code is fine)
            if (empty($_POST['email'])) {
                throw new Exception("Email address is required.");
            }
            $email = trim($_POST['email']);
            $userService->sendPasswordResetLink($email);

            $response = ['success' => true, 'message' => 'If an account with that email exists, a password reset link has been sent.'];
            break;

        // ==================== CHANGE/RESET PASSWORD ====================
        case "change_password":
            if (empty($_POST['token']) || empty($_POST['newPassword'])) {
                throw new Exception("Token and new password are required.");
            }
            $token = $_POST['token'];
            $newPassword = $_POST['newPassword'];

            $userService->resetPassword($token, $newPassword);
            $response = ['success' => true, 'message' => 'Your password has been updated successfully.'];
            break;

        // ==================== INVALID ACTION ====================
        default:
            $response['message'] = 'Invalid action specified.';
            break;
    }
} catch (Exception $e) {
    // Catch any exceptions and format them as a JSON error response
    if (!headers_sent()) {
        http_response_code(400); // Bad Request
    }
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

// Echo the final JSON response
echo json_encode($response);