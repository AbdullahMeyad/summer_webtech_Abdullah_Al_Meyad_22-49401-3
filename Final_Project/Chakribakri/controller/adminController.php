<?php
// Set header to return JSON responses
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include dependencies
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../service/adminService.php';

// Initialize a default response array
$response = ['success' => false, 'message' => 'Invalid Request'];
$action = '';

try {
    // Initialize the admin service
    $adminService = new AdminService($conn);

    // Get the request method
    $request_method = $_SERVER['REQUEST_METHOD'];
    
    // Get JSON payload for POST/PUT requests
    $data = [];
    if ($request_method === 'POST' || $request_method === 'PUT') {
        $json_data = file_get_contents("php://input");
        $data = json_decode($json_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON received: " . json_last_error_msg());
        }
        $action = $data['action'] ?? '';
    } else {
        $action = $_GET['action'] ?? '';
    }

    if (empty($action)) {
        throw new Exception("Action parameter is missing.");
    }

    switch ($action) {
        // ==================== USER MANAGEMENT ====================
        case 'getAllUsers':
            if ($request_method !== 'GET') throw new Exception("Invalid request method.");
            $users = $adminService->getAllUsers();
            $response = ['success' => true, 'users' => $users];
            break;

        case 'createUser':
            if ($request_method !== 'POST') throw new Exception("Invalid request method.");
            if (empty($data['firstName']) || empty($data['lastName']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
                throw new Exception("Missing required fields for user creation.");
            }
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) throw new Exception("Invalid email format.");
            if ($adminService->emailExists($data['email'])) throw new Exception("Email already exists.");
            
            $userId = $adminService->createUser($data);
            $response = ['success' => true, 'message' => "User created successfully with ID: $userId"];
            break;

        case 'updateUser':
            if ($request_method !== 'POST') throw new Exception("Invalid request method.");
            $userId = $data['id'] ?? $data['userId'] ?? null;
            if (empty($userId)) throw new Exception("User ID is required for update.");
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) throw new Exception("Invalid email format.");
            if ($adminService->emailExistsForOtherUser($data['email'], $userId)) throw new Exception("Email already exists for another user.");
            
            $success = $adminService->updateUser($userId, $data);
            $response = $success 
                ? ['success' => true, 'message' => 'User updated successfully.']
                : ['success' => false, 'message' => 'User not found or no changes made.'];
            break;

        case 'deleteUser':
            if ($request_method !== 'POST') throw new Exception("Invalid request method.");
            $userId = $data['id'] ?? $data['userId'] ?? null;
            if (empty($userId)) throw new Exception("User ID is required for deletion.");

            $success = $adminService->deleteUser($userId);
            $response = $success
                ? ['success' => true, 'message' => 'User and their jobs deleted successfully.']
                : ['success' => false, 'message' => 'User not found.'];
            break;

        // ==================== JOB MANAGEMENT ====================
        case 'getAllJobs':
            if ($request_method !== 'GET') throw new Exception("Invalid request method.");
            $jobs = $adminService->getAllJobs();
            $response = ['success' => true, 'jobs' => $jobs];
            break;

        case 'createJob':
        case 'updateJob':
            if ($request_method !== 'POST') throw new Exception("Invalid request method.");
            
            // Validate required fields
            $requiredFields = ['title', 'company', 'jobType', 'salary', 'location', 'description', 'deadline'];
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    $missingFields[] = $field;
                }
            }
            if (!empty($missingFields)) {
                throw new Exception("Missing required fields: " . implode(', ', $missingFields));
            }

            // Additional validations
            if (!is_numeric($data['salary']) || $data['salary'] < 0) throw new Exception("Salary must be a non-negative number.");
            $deadline = DateTime::createFromFormat('Y-m-d', $data['deadline']);
            if (!$deadline || $deadline->format('Y-m-d') !== $data['deadline']) throw new Exception("Invalid deadline format. Use YYYY-MM-DD.");

            if ($action === 'createJob') {
                $jobId = $adminService->createJob($data);
                $response = ['success' => true, 'message' => "Job created successfully with ID: $jobId"];
            } else { // updateJob
                $jobId = $data['id'] ?? $data['jobId'] ?? null;
                if (empty($jobId)) throw new Exception("Job ID is required for update.");
                
                $success = $adminService->updateJob($jobId, $data);
                $response = $success
                    ? ['success' => true, 'message' => 'Job updated successfully.']
                    : ['success' => false, 'message' => 'Job not found or no changes made.'];
            }
            break;

        case 'deleteJob':
            if ($request_method !== 'POST') throw new Exception("Invalid request method.");
            $jobId = $data['id'] ?? $data['jobId'] ?? null;
            if (empty($jobId)) throw new Exception("Job ID is required for deletion.");

            $success = $adminService->deleteJob($jobId);
            $response = $success
                ? ['success' => true, 'message' => 'Job deleted successfully.']
                : ['success' => false, 'message' => 'Job not found.'];
            break;

        // ==================== STATISTICS ====================
        case 'getUserStats':
            if ($request_method !== 'GET') throw new Exception("Invalid request method.");
            $stats = $adminService->getUserStats();
            $response = ['success' => true, 'stats' => $stats];
            break;

        case 'getJobStats':
            if ($request_method !== 'GET') throw new Exception("Invalid request method.");
            $stats = $adminService->getJobStats();
            $response = ['success' => true, 'stats' => $stats];
            break;

        // ==================== INVALID ACTION ====================
        default:
            http_response_code(404);
            $response['message'] = "Action '$action' not found.";
            break;
    }

} catch (Exception $e) {
    error_log("AdminController Error: " . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(400); // Bad Request for most client-side errors
    }
    $response['message'] = $e->getMessage();
} finally {
    echo json_encode($response);
    exit;
}