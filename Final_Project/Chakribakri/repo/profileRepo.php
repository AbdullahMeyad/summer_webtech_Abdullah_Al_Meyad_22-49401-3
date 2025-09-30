<?php
require_once __DIR__ . '/../config/db.php';

class ProfileRepo {
    private $conn;

    public function __construct() {
        // Use the global $conn from db.php
        global $conn;
        $this->conn = $conn;
    }

    /**
     * Fetches a single user by their ID.
     * @param int $userId
     * @return array|null
     */
    public function getUserById(int $userId): ?array {
        // Using MySQLi (matching your db.php)
        $stmt = $this->conn->prepare("SELECT id, first_name, last_name, gender, email, phone_number, nid, varsity_id, varsity_id_picture, university, department, role FROM users WHERE id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        
        return $user ?: null;
        
    }

    /**
     * Updates a user's profile data.
     * @param int $userId
     * @param array $data
     * @return bool
     */
    public function updateUser(int $userId, array $data): bool {
        // Using MySQLi (matching your db.php)
        $sql = "UPDATE users SET 
                    first_name = ?, 
                    last_name = ?, 
                    gender = ?, 
                    phone_number = ?, 
                    nid = ?, 
                    varsity_id = ?, 
                    university = ?,
                    department = ?,
                    varsity_id_picture = ?
                WHERE id = ?";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sssssssssi', 
            $data['first_name'],
            $data['last_name'],
            $data['gender'],
            $data['phone_number'],
            $data['nid'],
            $data['varsity_id'],
            $data['university'],
            $data['department'],
            $data['varsity_id_picture'],
            $userId
        );
        
        $result = $stmt->execute();
        $stmt->close();
        return $result;
        
        /* PDO Version - use this if you switch to PDO connection above
        $sql = "UPDATE users SET 
                    first_name = :first_name, 
                    last_name = :last_name, 
                    gender = :gender, 
                    phone_number = :phone_number, 
                    nid = :nid, 
                    varsity_id = :varsity_id, 
                    university = :university,
                    department = :department,
                    varsity_id_picture = :varsity_id_picture
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':first_name', $data['first_name']);
        $stmt->bindParam(':last_name', $data['last_name']);
        $stmt->bindParam(':gender', $data['gender']);
        $stmt->bindParam(':phone_number', $data['phone_number']);
        $stmt->bindParam(':nid', $data['nid']);
        $stmt->bindParam(':varsity_id', $data['varsity_id']);
        $stmt->bindParam(':university', $data['university']);
        $stmt->bindParam(':department', $data['department']);
        $stmt->bindParam(':varsity_id_picture', $data['varsity_id_picture']);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
        */
    }

    /**
     * Deletes a user from the database.
     * @param int $userId
     * @return bool
     */
    public function deleteUser(int $userId): bool {
        // Using MySQLi (matching your db.php)
        $stmt = $this->conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param('i', $userId);
        $result = $stmt->execute();
        $stmt->close();
        return $result;
        
        /* PDO Version - use this if you switch to PDO connection above
        $stmt = $this->conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
        */
    }
    
    public function __destruct() {
        // Don't close the global connection
        // $this->conn = null;
    }
}
?>