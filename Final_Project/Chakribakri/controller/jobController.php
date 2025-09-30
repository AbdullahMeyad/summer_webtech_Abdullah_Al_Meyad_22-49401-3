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
require_once __DIR__ . '/../service/jobService.php';

/**
 * Helper function to get user role from database
 * @param int $userId The user ID to check
 * @return string|null The user's role or null if not found
 */
function getUserRoleFromDatabase($userId) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row['role'];
    }
    
    return null;
}

// Initialize a default response array
$response = ['success' => false, 'message' => 'Invalid Request'];

try {
    // Initialize the job service
    $jobService = new JobService($conn);

    // Determine the action from the request
    $action = $_REQUEST['action'] ?? '';
    $request_method = $_SERVER['REQUEST_METHOD'];
    
    // Log the incoming request for debugging
    error_log("JobController - Action: $action, Method: $request_method");
    
    // Get JSON payload for POST/PUT requests
    $data = [];
    if ($request_method === 'POST' || $request_method === 'PUT') {
        $json_data = file_get_contents("php://input");
        if (!empty($json_data)) {
            $data = json_decode($json_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON data: " . json_last_error_msg());
            }
        }
        // Log the received data for debugging
        error_log("JobController - Received data: " . print_r($data, true));
    }

    switch ($action) {
        // ==================== GET ALL JOBS ====================
        case 'getJobs':
            if ($request_method !== 'GET') {
                throw new Exception("Invalid request method for getJobs.");
            }
            $jobs = $jobService->getAllJobs();
            $response = ['success' => true, 'jobs' => $jobs];
            break;

        // ==================== POST A NEW JOB ====================
        case 'postJob':
            if ($request_method !== 'POST') {
                throw new Exception("Invalid request method for postJob.");
            }
            
            // Validate required fields
            $requiredFields = ['title', 'company', 'description', 'type', 'salary', 'location', 'deadline', 'posted_by'];
            $missingFields = [];
            
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty(trim($data[$field]))) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                throw new Exception("Missing required fields: " . implode(', ', $missingFields));
            }
            
            // Validate data types
            if (!is_numeric($data['salary']) || $data['salary'] <= 0) {
                throw new Exception("Salary must be a positive number.");
            }
            
            if (!is_numeric($data['posted_by']) || $data['posted_by'] <= 0) {
                throw new Exception("Invalid posted_by user ID.");
            }
            
            // CRITICAL SECURITY CHECK: Verify user role from database
            $userRole = getUserRoleFromDatabase($data['posted_by']);
            if ($userRole === 'student') {
                http_response_code(403);
                throw new Exception("Students are not allowed to post jobs.");
            }
            
            if (empty($userRole) || $userRole === null) {
                http_response_code(401);
                throw new Exception("User not found or unauthorized.");
            }
            
            // Validate deadline format
            $deadline = DateTime::createFromFormat('Y-m-d', $data['deadline']);
            if (!$deadline) {
                throw new Exception("Invalid deadline format. Use YYYY-MM-DD format.");
            }
            
            // Check if deadline is in the future
            $today = new DateTime();
            if ($deadline <= $today) {
                throw new Exception("Deadline must be in the future.");
            }
            
            // Log before attempting to create job
            error_log("JobController - About to create job with data: " . print_r($data, true));
            
            $result = $jobService->createJob($data);
            
            // Log the result
            error_log("JobController - Job creation result: " . print_r($result, true));
            
            $response = ['success' => true, 'message' => 'Job posted successfully.'];
            break;

        // ==================== UPDATE A JOB ====================
        case 'updateJob':
            if ($request_method !== 'POST') {
                throw new Exception("Invalid request method for updateJob.");
            }
            
            $jobId = $data['jobId'] ?? 0;
            if (empty($jobId) || !is_numeric($jobId)) {
                throw new Exception("Valid Job ID is required for updating.");
            }
            
            $jobService->updateJob($jobId, $data);
            $response = ['success' => true, 'message' => 'Job updated successfully.'];
            break;

        // ==================== DELETE A JOB ====================
        case 'deleteJob':
            if ($request_method !== 'POST') {
                throw new Exception("Invalid request method for deleteJob.");
            }
            
            $jobId = $data['jobId'] ?? 0;
            if (empty($jobId) || !is_numeric($jobId)) {
                throw new Exception("Valid Job ID is required for deletion.");
            }
            
            $jobService->deleteJob($jobId);
            $response = ['success' => true, 'message' => 'Job deleted successfully.'];
            break;
            
        // ==================== APPLY FOR A JOB ====================
        case 'apply':
            if ($request_method !== 'POST') {
                throw new Exception("Invalid request method for apply.");
            }
            
            $jobId = $data['jobId'] ?? 0;
            $userId = $data['userId'] ?? 0;
            
            if (empty($jobId) || !is_numeric($jobId)) {
                throw new Exception("Valid Job ID is required for job application.");
            }
            
            if (empty($userId) || !is_numeric($userId)) {
                throw new Exception("Valid User ID is required for job application.");
            }
            
            $jobService->applyToJob($jobId, $userId);
            $response = ['success' => true, 'message' => 'Application submitted successfully!'];
            break;

        // ==================== GET JOBS BY USER (OPTIONAL) ====================
        case 'getMyJobs':
            if ($request_method !== 'GET') {
                throw new Exception("Invalid request method for getMyJobs.");
            }
            
            $userId = $_GET['userId'] ?? 0;
            if (empty($userId) || !is_numeric($userId)) {
                throw new Exception("Valid User ID is required.");
            }
            
            $jobs = $jobService->getJobsByUser($userId);
            $response = ['success' => true, 'jobs' => $jobs];
            break;

        // ==================== GET JOB APPLICATIONS (OPTIONAL) ====================
        case 'getJobApplications':
            if ($request_method !== 'GET') {
                throw new Exception("Invalid request method for getJobApplications.");
            }
            
            $jobId = $_GET['jobId'] ?? 0;
            if (empty($jobId) || !is_numeric($jobId)) {
                throw new Exception("Valid Job ID is required.");
            }
            
            $applications = $jobService->getJobApplications($jobId);
            $response = ['success' => true, 'applications' => $applications];
            break;
            
        // ==================== INVALID ACTION ====================
        default:
            http_response_code(404);
            $response['message'] = "Action '$action' not found.";
            break;
    }

} catch (Exception $e) {
    // Log the error for debugging
    error_log("JobController Error: " . $e->getMessage());
    error_log("JobController Error Trace: " . $e->getTraceAsString());
    
    // Set appropriate HTTP status code
    if (!headers_sent()) {
        if (strpos($e->getMessage(), 'not found') !== false) {
            http_response_code(404);
        } elseif (strpos($e->getMessage(), 'Invalid') !== false || 
                  strpos($e->getMessage(), 'Missing') !== false ||
                  strpos($e->getMessage(), 'required') !== false) {
            http_response_code(400);
        } else {
            http_response_code(500);
        }
    }
    
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    
    // In development, you might want to include more error details
    // Remove this in production for security
    if (defined('DEBUG') && DEBUG === true) {
        $response['debug'] = [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ];
    }
}

// Echo the final JSON response
echo json_encode($response);
?>