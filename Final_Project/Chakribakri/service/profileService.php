<?php
require_once __DIR__ . '/../repo/profileRepo.php';

class ProfileService {
    private $profileRepo;

    public function __construct() {
        $this->profileRepo = new ProfileRepo();
    }

    /**
     * Get a user's profile by their ID.
     * @param int $userId
     * @return array|null
     */
    public function getUserProfile(int $userId): ?array {
        try {
            return $this->profileRepo->getUserById($userId);
        } catch (Exception $e) {
            error_log("Error fetching user profile: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update a user's profile.
     * @param int $userId
     * @param array $userData
     * @param array|null $fileData
     * @param string $uploadDir
     * @return array
     */
    public function updateUserProfile(int $userId, array $userData, ?array $fileData, string $uploadDir): array {
        try {
            $currentUser = $this->profileRepo->getUserById($userId);
            if (!$currentUser) {
                return ['success' => false, 'message' => 'User not found.'];
            }

            // Handle file upload
            $imagePath = $currentUser['varsity_id_picture']; // Keep old image if new one isn't uploaded
            if ($fileData && isset($fileData['error']) && $fileData['error'] === UPLOAD_ERR_OK) {
                // Basic validation
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $fileData['tmp_name']);
                finfo_close($finfo);
                
                if (!in_array($mimeType, $allowedTypes)) {
                    return ['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, GIF are allowed.'];
                }
                if ($fileData['size'] > 5000000) { // 5MB limit
                    return ['success' => false, 'message' => 'File is too large. Maximum size is 5MB.'];
                }

                // Create a unique filename and move the file
                $fileExtension = pathinfo($fileData['name'], PATHINFO_EXTENSION);
                $newFileName = 'user_' . $userId . '_' . time() . '.' . $fileExtension;
                $destination = $uploadDir . $newFileName;
                
                if (move_uploaded_file($fileData['tmp_name'], $destination)) {
                    // If a new image is uploaded successfully, remove the old one
                    if ($imagePath && file_exists($uploadDir . basename($imagePath))) {
                        unlink($uploadDir . basename($imagePath));
                    }
                    $imagePath = $newFileName;
                } else {
                    return ['success' => false, 'message' => 'Failed to upload image.'];
                }
            }
            
            // Prepare data for repository, using existing value if new one is not set
            $updateData = [
                'first_name' => $userData['first_name'] ?? $currentUser['first_name'],
                'last_name' => $userData['last_name'] ?? $currentUser['last_name'],
                'gender' => $userData['gender'] ?? $currentUser['gender'],
                'phone_number' => $userData['phone_number'] ?? $currentUser['phone_number'],
                'nid' => $userData['nid'] ?? $currentUser['nid'],
                'varsity_id' => $userData['varsity_id'] ?? $currentUser['varsity_id'],
                'university' => $userData['university'] ?? $currentUser['university'],
                'department' => $userData['department'] ?? $currentUser['department'],
                'varsity_id_picture' => $imagePath,
            ];
            
            $success = $this->profileRepo->updateUser($userId, $updateData);

            if ($success) {
                $updatedUser = $this->profileRepo->getUserById($userId);
                return ['success' => true, 'message' => 'Profile updated successfully.', 'data' => $updatedUser];
            } else {
                return ['success' => false, 'message' => 'Failed to update profile in database.'];
            }
        } catch (Exception $e) {
            error_log("Error updating user profile: " . $e->getMessage());
            return ['success' => false, 'message' => 'An error occurred while updating profile.'];
        }
    }

    /**
     * Delete a user's account.
     * @param int $userId
     * @return bool
     */
    public function deleteUserAccount(int $userId): bool {
        try {
            // Optional: Also delete user's uploaded files from the server
            $user = $this->profileRepo->getUserById($userId);
            if ($user && $user['varsity_id_picture']) {
                $filePath = '../../uploads/' . basename($user['varsity_id_picture']);
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            return $this->profileRepo->deleteUser($userId);
        } catch (Exception $e) {
            error_log("Error deleting user account: " . $e->getMessage());
            return false;
        }
    }
}
?>