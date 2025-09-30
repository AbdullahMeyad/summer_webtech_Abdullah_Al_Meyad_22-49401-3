<?php

class AdminRepo {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // ==================== USER MANAGEMENT ====================
    
    public function getAllUsers() {
        $sql = "SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC";
        $result = $this->conn->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function createUser($userData) {
        // Updated the INSERT statement to include 'is_confirmed' and set its value to 1 by default.
        $stmt = $this->conn->prepare("
            INSERT INTO users (first_name, last_name, email, password, role, is_confirmed)
            VALUES (?, ?, ?, ?, ?, 1)
        ");
        
        $stmt->bind_param(
            "sssss",
            $userData['firstName'],
            $userData['lastName'],
            $userData['email'],
            $userData['password'],
            $userData['role']
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create user: " . $stmt->error);
        }
        return $this->conn->insert_id;
    }
    
    public function updateUser($userId, $userData) {
        if (!$this->getUserById($userId)) {
            throw new Exception("User not found.");
        }
        
        // Dynamically build the update query based on provided data
        $fields = [];
        $params = [];
        $types = "";

        // Map frontend names to DB columns and add to query if they exist
        $fieldMap = [
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'email' => 'email',
            'password' => 'password',
            'role' => 'role'
        ];

        foreach ($fieldMap as $key => $column) {
            if (isset($userData[$key]) && $userData[$key] !== '') {
                $fields[] = "$column = ?";
                $params[] = $userData[$key];
                $types .= "s";
            }
        }
        
        if (empty($fields)) {
            return false; // No changes to make
        }
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $params[] = $userId;
        $types .= "i";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if (!$stmt->execute()) {
            throw new Exception("Failed to update user: " . $stmt->error);
        }
        return $stmt->affected_rows > 0;
    }
    
    public function deleteUser($userId) {
        if (!$this->getUserById($userId)) {
            throw new Exception("User not found.");
        }
        
        $this->conn->begin_transaction();
        try {
            // Set jobs posted by this user to have a NULL `posted_by`
            // Alternatively, you could delete them: "DELETE FROM jobs WHERE posted_by = ?"
            $stmt1 = $this->conn->prepare("UPDATE jobs SET posted_by = NULL WHERE posted_by = ?");
            $stmt1->bind_param("i", $userId);
            $stmt1->execute();
            
            // Delete the user
            $stmt2 = $this->conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt2->bind_param("i", $userId);
            $stmt2->execute();
            
            if ($stmt2->affected_rows === 0) {
                throw new Exception("Failed to delete user record.");
            }
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollback();
            throw $e;
        }
    }

    public function getUserById($userId) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    public function emailExists($email) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }
    
    public function emailExistsForOtherUser($email, $userId) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->bind_param("si", $email, $userId);
        $stmt->execute();
        return $stmt->get_result()->num_rows > 0;
    }

    // ==================== JOB MANAGEMENT ====================
    
    public function getAllJobs() {
        $sql = "SELECT j.*, CONCAT(u.first_name, ' ', u.last_name) as posted_by_name
                FROM jobs j 
                LEFT JOIN users u ON j.posted_by = u.id 
                ORDER BY j.posted_date DESC";
        $result = $this->conn->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function createJob($jobData) {
        $stmt = $this->conn->prepare("
            INSERT INTO jobs (title, company, type, salary, location, description, requirements, posted_by, deadline, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            "sssisssiss",
            $jobData['title'],
            $jobData['company'],
            $jobData['jobType'],
            $jobData['salary'],
            $jobData['location'],
            $jobData['description'],
            $jobData['requirements'],
            $jobData['posted_by'],
            $jobData['deadline'],
            $jobData['status']
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create job: " . $stmt->error);
        }
        return $this->conn->insert_id;
    }
    
    public function updateJob($jobId, $jobData) {
        if (!$this->getJobById($jobId)) {
            throw new Exception("Job not found.");
        }
        
        $stmt = $this->conn->prepare("
            UPDATE jobs SET 
            title = ?, company = ?, type = ?, salary = ?, location = ?, 
            description = ?, requirements = ?, deadline = ?
            WHERE id = ?
        ");
        
        $stmt->bind_param(
            "sssissssi",
            $jobData['title'],
            $jobData['company'],
            $jobData['jobType'],
            $jobData['salary'],
            $jobData['location'],
            $jobData['description'],
            $jobData['requirements'],
            $jobData['deadline'],
            $jobId
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to update job: " . $stmt->error);
        }
        return $stmt->affected_rows > 0;
    }
    
    public function deleteJob($jobId) {
        if (!$this->getJobById($jobId)) {
            throw new Exception("Job not found.");
        }
        
        // No need for a transaction if only one table is affected
        $stmt = $this->conn->prepare("DELETE FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $jobId);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete job: " . $stmt->error);
        }
        return $stmt->affected_rows > 0;
    }

    public function getJobById($jobId) {
        $stmt = $this->conn->prepare("SELECT id FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $jobId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    // ==================== STATISTICS ====================
    
    public function getUserStats() {
        $result = $this->conn->query("SELECT COUNT(*) as total FROM users");
        return ['total_users' => $result->fetch_assoc()['total']];
    }
    
    public function getJobStats() {
        $result = $this->conn->query("SELECT COUNT(*) as total FROM jobs");
        // Returning total jobs. Total applications is removed.
        return ['total_jobs' => $result->fetch_assoc()['total']];
    }
}
?>
