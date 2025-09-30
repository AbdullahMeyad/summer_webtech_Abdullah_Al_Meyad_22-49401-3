<?php

require_once __DIR__ . '/../repo/jobRepo.php';

class JobService {
    private $repo;

    public function __construct($conn) {
        $this->repo = new JobRepo($conn);
    }

    /**
     * Gets all jobs.
     * @return array List of all jobs.
     */
    public function getAllJobs() {
        return $this->repo->getAllJobs();
    }

    /**
     * Creates a new job after validating data.
     * @param array $data The job data from the request.
     * @return int The ID of the created job.
     * @throws Exception If validation fails.
     */
    public function createJob($data) {
        // Basic validation
        if (empty($data['title']) || empty($data['type']) || empty($data['salary']) || empty($data['location']) || empty($data['deadline']) || empty($data['posted_by'])) {
            throw new Exception("Missing required fields for creating a job.");
        }
        // You can add more specific validation here (e.g., salary is numeric)
        
        // Default company and requirements if not provided
        $jobData = [
            'title' => $data['title'],
            'company' => $data['company'] ?? 'N/A',
            'type' => $data['type'],
            'salary' => $data['salary'],
            'location' => $data['location'],
            'description' => $data['description'] ?? '',
            'requirements' => $data['requirements'] ?? '',
            'posted_by' => $data['posted_by'],
            'deadline' => $data['deadline']
        ];

        return $this->repo->createJob($jobData);
    }

    /**
     * Updates an existing job.
     * @param int $jobId The ID of the job.
     * @param array $data The job data to update.
     * @return bool True on success.
     * @throws Exception If validation fails.
     */
    public function updateJob($jobId, $data) {
        if (empty($jobId) || empty($data)) {
            throw new Exception("Job ID and update data are required.");
        }
        return $this->repo->updateJob($jobId, $data);
    }

    /**
     * Deletes a job.
     * @param int $jobId The ID of the job.
     * @return bool True on success.
     * @throws Exception If Job ID is missing.
     */
    public function deleteJob($jobId) {
        if (empty($jobId)) {
            throw new Exception("Job ID is required to delete.");
        }
        return $this->repo->deleteJob($jobId);
    }

    /**
     * Handles a user's application to a job.
     * @param int $jobId The ID of the job.
     * @param int $userId The ID of the user.
     * @return bool True on success.
     * @throws Exception If user has already applied or on validation failure.
     */
    public function applyToJob($jobId, $userId) {
        if (empty($jobId) || empty($userId)) {
            throw new Exception("Job ID and User ID are required to apply.");
        }

        // Check if the user has already applied
        if ($this->repo->hasUserApplied($jobId, $userId)) {
            throw new Exception("You have already applied for this job.");
        }

        // Proceed with application
        return $this->repo->applyToJob($jobId, $userId);
    }
}
