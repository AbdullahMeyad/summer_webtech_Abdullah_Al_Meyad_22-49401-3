<?php

require_once __DIR__ . '/../repo/adminRepo.php';

class AdminService {
    private $adminRepo;

    public function __construct($conn) {
        $this->adminRepo = new AdminRepo($conn);
    }

    // ==================== USER MANAGEMENT ====================
    
    public function getAllUsers() {
        return $this->adminRepo->getAllUsers();
    }
    
    public function createUser($userData) {
        // Hash password before storing
        $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        return $this->adminRepo->createUser($userData);
    }
    
    public function updateUser($userId, $userData) {
        // Hash password only if a new one is provided
        if (!empty($userData['password'])) {
            $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        } else {
            // Ensure empty password doesn't overwrite existing one
            unset($userData['password']);
        }
        return $this->adminRepo->updateUser($userId, $userData);
    }
    
    public function deleteUser($userId) {
        return $this->adminRepo->deleteUser($userId);
    }
    
    public function emailExists($email) {
        return $this->adminRepo->emailExists($email);
    }
    
    public function emailExistsForOtherUser($email, $userId) {
        return $this->adminRepo->emailExistsForOtherUser($email, $userId);
    }

    // ==================== JOB MANAGEMENT ====================
    
    public function getAllJobs() {
        return $this->adminRepo->getAllJobs();
    }
    
    public function createJob($jobData) {
        // Set default status for new jobs
        $jobData['status'] = 'active';
        return $this->adminRepo->createJob($jobData);
    }
    
    public function updateJob($jobId, $jobData) {
        return $this->adminRepo->updateJob($jobId, $jobData);
    }
    
    public function deleteJob($jobId) {
        return $this->adminRepo->deleteJob($jobId);
    }

    // ==================== STATISTICS ====================
    
    public function getUserStats() {
        return $this->adminRepo->getUserStats();
    }
    
    public function getJobStats() {
        return $this->adminRepo->getJobStats();
    }
}
?>