<?php
class UserRepo {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function emailExists($email) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        return $stmt->num_rows > 0;
    }

    public function saveUser(
        $first_name, $last_name, $gender, $email, $phone_number,
        $nid, $varsity_id, $university, $department, $role,
        $password, $token, $varsity_id_picture
    ) {
        $stmt = $this->conn->prepare("
            INSERT INTO users (
                first_name, last_name, gender, email, phone_number,
                nid, varsity_id, university, department, role,
                password, confirm_token, varsity_id_picture, is_confirmed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ");
        $stmt->bind_param(
            "sssssssssssss",
            $first_name, $last_name, $gender, $email, $phone_number,
            $nid, $varsity_id, $university, $department, $role,
            $password, $token, $varsity_id_picture
        );
        return $stmt->execute();
    }

    public function confirmUser($email, $token) {
        $stmt = $this->conn->prepare("UPDATE users SET is_confirmed = 1 WHERE email = ? AND confirm_token = ?");
        $stmt->bind_param("ss", $email, $token);
        return $stmt->execute();
    }

    /**
     * Fetches a user record by their email address.
     * Only returns a user if their account has been confirmed.
     * @param string $email The user's email.
     * @return mixed User data as an associative array or false if not found.
     */
    public function getUserByEmail($email) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ? AND is_confirmed = 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    // ==================== Password Reset Functions ====================
    
    /**
     * Saves a password reset token to the database.
     * The token is hashed for security.
     * @param int $userId The ID of the user.
     * @param string $token The secure token.
     * @param string $expiresAt The token's expiration timestamp.
     * @return bool True on success, false on failure.
     */
    // In UserRepo.php
    public function savePasswordResetToken($userId, $token, $expiresAt) {
        $hashedToken = hash('sha256', $token);
        $stmt = $this->conn->prepare("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)");
        
        // The fix: Remove die() and throw a catchable exception.
        if (!$stmt) {
            throw new Exception("SQL prepare failed: " . $this->conn->error);
        }

        $stmt->bind_param("iss", $userId, $hashedToken, $expiresAt);
        return $stmt->execute();
    }


    /**
     * Retrieves token data by the raw token.
     * @param string $token The raw token from the user's link.
     * @return mixed Token data as an associative array or false if not found/valid.
     */
    public function getPasswordResetToken($token) {
        $hashedToken = hash('sha256', $token);
        $stmt = $this->conn->prepare("SELECT * FROM password_resets WHERE token_hash = ?");
        $stmt->bind_param("s", $hashedToken);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Updates a user's password in the database.
     * @param int $userId The ID of the user to update.
     * @param string $hashedPassword The new, hashed password.
     * @return bool True on success, false on failure.
     */
    public function updateUserPassword($userId, $hashedPassword) {
        $stmt = $this->conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashedPassword, $userId);
        return $stmt->execute();
    }

    /**
     * Deletes a password reset token after it has been used.
     * @param string $token The raw token to delete.
     * @return bool True on success, false on failure.
     */
    public function deletePasswordResetToken($token) {
        $hashedToken = hash('sha256', $token);
        $stmt = $this->conn->prepare("DELETE FROM password_resets WHERE token_hash = ?");
        $stmt->bind_param("s", $hashedToken);
        return $stmt->execute();
    }
    /**
 * Check if a field value already exists in the database
 * @param string $field The field name to check
 * @param string $value The value to check for
 * @return bool True if exists, false if unique
 */
public function checkFieldExists($field, $value) {
    // Use prepared statement with dynamic field name (safe since we validate allowed fields in controller)
    $stmt = $this->conn->prepare("SELECT id FROM users WHERE $field = ?");
    $stmt->bind_param("s", $value);
    $stmt->execute();
    $stmt->store_result();
    return $stmt->num_rows > 0;
}
}