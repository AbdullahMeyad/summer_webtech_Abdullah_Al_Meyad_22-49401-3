<?php

require_once __DIR__ . '/../repo/userRepo.php';
require_once __DIR__ . '/../model/userModel.php';

class UserService {
    private $repo;

    public function __construct($conn) {
        $this->repo = new UserRepo($conn);
    }

    public function registerUser(
        $first_name, $last_name, $gender, $email, $phone_number,
        $nid, $varsity_id, $university, $department, $role,
        $password, $varsity_id_picture
    ) {
        // Check if email already exists
        if ($this->repo->emailExists($email)) {
            throw new Exception("Email already registered.");
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // Generate confirmation token
        $token = bin2hex(random_bytes(16));

        // Save user to DB (unconfirmed table)
        $saved = $this->repo->saveUser(
            $first_name, $last_name, $gender, $email, $phone_number,
            $nid, $varsity_id, $university, $department, $role,
            $hashedPassword, $token, $varsity_id_picture
        );

        if (!$saved) {
            return false;
        }

        // Send confirmation email
        $subject = "Confirm your account";
        // IMPORTANT: Update this URL to your actual server address
        $confirmLink = "http://localhost/ChakriBakri/config/confirm.php?token=$token&email=$email";
        $message = "Hi $first_name,\n\nPlease click the link below to confirm your account:\n$confirmLink\n\nThanks!";
        $headers = "From: noreply@chakribakri.com";

        if (!mail($email, $subject, $message, $headers)) {
            throw new Exception("Failed to send confirmation email.");
        }

        return true;
    }

    // ==================== LOGIN FUNCTION (UPDATED) ====================
    /**
     * Authenticates a user and handles the "Remember me" functionality with cookies.
     * @param string $email The user's email.
     * @param string $password The user's password.
     * @param bool $remember Whether to set "remember me" cookies.
     * @return array The user's data on successful login.
     * @throws Exception If login fails.
     */
    public function loginUser($email, $password, $remember = false) {
        // Get user by email
        $user = $this->repo->getUserByEmail($email);

        if (!$user) {
            throw new Exception("No account found with this email.");
        }

        // Check if confirmed
        if ($user['is_confirmed'] != 1) {
            throw new Exception("Please confirm your email before logging in.");
        }

        // Verify password
        if (!password_verify($password, $user['password'])) {
            throw new Exception("Invalid email or password.");
        }

        // ✅ Handle "Remember me" cookies
        if ($remember) {
            // Set cookies for 30 days
            $cookie_duration = time() + (86400 * 30); // 86400 = 1 day
            setcookie('remember_email', $email, $cookie_duration, "/");
            // ⚠️ Storing a plain-text password in a cookie is a security risk.
            // This is for functionality demonstration. For production, use a secure token.
            setcookie('remember_password', $password, $cookie_duration, "/");
        } else {
            // If "Remember me" is not checked, clear any existing cookies by setting a past expiration date.
            setcookie('remember_email', '', time() - 3600, "/");
            setcookie('remember_password', '', time() - 3600, "/");
        }

        // Success: return user info (except password)
        unset($user['password']);
        return $user;
    }


    // ==================== FORGOT PASSWORD FUNCTIONS ====================

    /**
     * Initiates the password reset process for a given email.
     * @param string $email The user's email address.
     * @return bool True on success.
     * @throws Exception If email not found or fails to send.
     */
    public function sendPasswordResetLink($email) {
        // Check if user exists
        $user = $this->repo->getUserByEmail($email);
        if (!$user) {
            throw new Exception("No account found with this email address.");
        }

        // Generate a secure token
        $token = bin2hex(random_bytes(32));

        // Set token expiration to 1 hour from now
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Save the token to the database
        $saved = $this->repo->savePasswordResetToken($user['id'], $token, $expiresAt);
        if (!$saved) {
            throw new Exception("Could not generate a password reset token. Please try again.");
        }

        // Send the email with the reset link
        // IMPORTANT: Update this URL to point to your changePassword.html on your server
        $resetLink = "http://localhost/ChakriBakri/html/changePassword.html?token=$token";
        $subject = "Password Reset Request";
        $message = "Hi {$user['first_name']},\n\nSomeone requested a password reset for your account. If this was you, please click the link below to set a new password:\n$resetLink\n\nThis link will expire in 1 hour. If you did not request this, you can safely ignore this email.\n\nThanks!";
        $headers = "From: noreply@chakribakri.com";

        if (!mail($email, $subject, $message, $headers)) {
            throw new Exception("Failed to send password reset email. Please try again later.");
        }

        return true;
    }

    /**
     * Resets the user's password using a valid token.
     * @param string $token The password reset token from the URL.
     * @param string $newPassword The new password provided by the user.
     * @return bool True on success.
     * @throws Exception If token is invalid, expired, or password update fails.
     */
    public function resetPassword($token, $newPassword) {
        // Validate input
        if (empty($token) || empty($newPassword)) {
            throw new Exception("Token and new password are required.");
        }

        // Validate password strength
        if (strlen($newPassword) < 8) {
            throw new Exception("Password must be at least 8 characters long.");
        }

        // Validate the token and get associated data
        $tokenData = $this->repo->getPasswordResetToken($token);

        if (!$tokenData) {
            throw new Exception("Invalid or expired password reset link.");
        }

        // Check if token has expired
        if (strtotime($tokenData['expires_at']) < time()) {
            // Clean up expired token
            $this->repo->deletePasswordResetToken($token);
            throw new Exception("Password reset link has expired. Please request a new one.");
        }

        // Hash the new password
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        // Update the password in the main users table
        $updated = $this->repo->updateUserPassword($tokenData['user_id'], $hashedPassword);

        if (!$updated) {
            throw new Exception("Failed to update password. Please try again.");
        }

        // Delete the token so it can't be used again
        $this->repo->deletePasswordResetToken($token);

        return true;
    }
    /**
 * Check if a field value already exists in the database
 * @param string $field The field name to check (email, phone_number, nid, varsity_id)
 * @param string $value The value to check for
 * @return bool True if exists, false if unique
 */
public function checkFieldExists($field, $value) {
    return $this->repo->checkFieldExists($field, $value);
}
}