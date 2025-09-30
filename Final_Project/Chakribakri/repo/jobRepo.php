<?php

class JobRepo {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    /**
     * Fetches all jobs from the database.
     * @return array An array of job records.
     */
    public function getAllJobs() {
        $sql = "SELECT * FROM jobs ORDER BY posted_date DESC";
        $result = $this->conn->query($sql);
        $jobs = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $jobs[] = $row;
            }
        }
        return $jobs;
    }
    
    /**
     * Creates a new job record in the database.
     * @param array $jobData Associative array of job data.
     * @return int The ID of the newly created job.
     */
    public function createJob($jobData) {
        $stmt = $this->conn->prepare("
            INSERT INTO jobs (title, company, type, salary, location, description, requirements, posted_by, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "sssisssis",
            $jobData['title'],
            $jobData['company'],
            $jobData['type'],
            $jobData['salary'],
            $jobData['location'],
            $jobData['description'],
            $jobData['requirements'],
            $jobData['posted_by'],
            $jobData['deadline']
        );
        $stmt->execute();
        return $this->conn->insert_id;
    }

    /**
     * Updates an existing job record.
     * @param int $jobId The ID of the job to update.
     * @param array $jobData Associative array of job data to update.
     * @return bool True on success, false on failure.
     */
    public function updateJob($jobId, $jobData) {
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
            $jobData['type'],
            $jobData['salary'],
            $jobData['location'],
            $jobData['description'],
            $jobData['requirements'],
            $jobData['deadline'],
            $jobId
        );
        return $stmt->execute();
    }

    /**
     * Deletes a job from the database.
     * @param int $jobId The ID of the job to delete.
     * @return bool True on success, false on failure.
     */
    public function deleteJob($jobId) {
        // First, delete related applications to maintain foreign key integrity
        $stmt_applicants = $this->conn->prepare("DELETE FROM job_applicants WHERE job_id = ?");
        $stmt_applicants->bind_param("i", $jobId);
        $stmt_applicants->execute();
        
        // Then, delete the job itself
        $stmt = $this->conn->prepare("DELETE FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $jobId);
        return $stmt->execute();
    }

    /**
     * Checks if a user has already applied for a specific job.
     * @param int $jobId The ID of the job.
     * @param int $userId The ID of the user.
     * @return bool True if an application exists, false otherwise.
     */
    public function hasUserApplied($jobId, $userId) {
        $stmt = $this->conn->prepare("SELECT id FROM job_applicants WHERE job_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $jobId, $userId);
        $stmt->execute();
        $stmt->store_result();
        return $stmt->num_rows > 0;
    }

    /**
     * Creates a new job application record.
     * @param int $jobId The ID of the job.
     * @param int $userId The ID of the user.
     * @param string $coverLetter (Optional) The user's cover letter.
     * @return bool True on success, false on failure.
     */
    public function applyToJob($jobId, $userId, $coverLetter = '') {
        $stmt = $this->conn->prepare("
            INSERT INTO job_applicants (job_id, user_id, cover_letter, status)
            VALUES (?, ?, ?, 'applied')
        ");
        $stmt->bind_param("iis", $jobId, $userId, $coverLetter);
        return $stmt->execute();
    }
}
