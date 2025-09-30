document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const profileForm = document.getElementById('profileForm');
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    const messageContainer = document.getElementById('message-container');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const varsityIdPictureInput = document.getElementById('varsityIdPicture');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');

    // Form fields
    const formInputs = profileForm.querySelectorAll('input, select');
    let originalFormValues = {};

    const API_URL = '../controller/profileController.php';

    // --- Utility Functions ---
    
    /**
     * Toggles the form between edit and view modes.
     * @param {boolean} isEditMode - True to enable editing, false to disable.
     */
    const setEditMode = (isEditMode) => {
        formInputs.forEach(input => {
            if (input.id !== 'email') { // Email is usually not editable
                input.disabled = !isEditMode;
            }
        });
        editButton.style.display = isEditMode ? 'none' : 'block';
        deleteAccountButton.style.display = isEditMode ? 'none' : 'block';
        saveButton.style.display = isEditMode ? 'block' : 'none';
        cancelButton.style.display = isEditMode ? 'block' : 'none';
    };

    /**
     * Displays a message to the user.
     * @param {string} message - The message text.
     * @param {string} type - 'success' or 'error'.
     */
    const showMessage = (message, type = 'success') => {
        messageContainer.textContent = message;
        messageContainer.className = type;
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    };

    /**
     * Populates the form with user data.
     * @param {object} data - The user profile data.
     */
    const populateForm = (data) => {
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('lastName').value = data.last_name || '';
        document.getElementById('gender').value = data.gender || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phoneNumber').value = data.phone_number || '';
        document.getElementById('nid').value = data.nid || '';
        document.getElementById('varsityId').value = data.varsity_id || '';
        document.getElementById('university').value = data.university || '';
        document.getElementById('department').value = data.department || '';
        
        // Update header info
        document.getElementById('userName').textContent = `${data.first_name || ''} ${data.last_name || ''}`;
        document.getElementById('userRole').textContent = data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'User';

        if (data.varsity_id_picture) {
            profileImagePreview.src = `../uploads/${data.varsity_id_picture}`;
        }

        // Store original values for cancellation
        originalFormValues = {
            firstName: data.first_name,
            lastName: data.last_name,
            gender: data.gender,
            phoneNumber: data.phone_number,
            nid: data.nid,
            varsityId: data.varsity_id,
            university: data.university,
            department: data.department,
            imageSrc: profileImagePreview.src
        };
    };

    // --- API Call Functions ---

    /**
     * Fetches user profile data from the server.
     */
    const fetchProfile = async () => {
        console.log('Attempting to fetch profile from:', API_URL);
        
        try {
            const response = await fetch(API_URL, { 
                method: 'GET',
                credentials: 'same-origin' // Include cookies/session
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response ok:', response.ok);
            
            // Log the raw response text first
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Try to parse as JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Server returned invalid JSON: ' + responseText.substring(0, 100));
            }
            
            console.log('Parsed result:', result);
            
            if (result.success) {
                populateForm(result.data);
                showMessage('Profile loaded successfully!');
            } else {
                showMessage(result.message || 'Failed to load profile', 'error');
                if (response.status === 401) {
                    console.log('Redirecting to login due to authentication error');
                    window.location.href = 'login.html';
                }
            }
        } catch (error) {
            console.error('Fetch Profile Error Details:', error);
            
            // More specific error messages
            let errorMessage = 'Failed to fetch profile data. ';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Network connection error - check if the server is running.';
            } else if (error.message.includes('HTTP')) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again.';
            }
            
            showMessage(errorMessage, 'error');
            
            // Also show error in the console for debugging
            console.error('Full error object:', error);
        }
    };

    /**
     * Updates the user profile.
     */
    const updateProfile = async () => {
        const formData = new FormData(profileForm);
        formData.append('_method', 'UPDATE');

        try {
            console.log('Updating profile...');
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            console.log('Update response status:', response.status);
            
            const responseText = await response.text();
            console.log('Update raw response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = JSON.parse(responseText);
            console.log('Update result:', result);

            if (result.success) {
                showMessage('Profile updated successfully!');
                populateForm(result.data);
                setEditMode(false);
            } else {
                showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Update Profile Error:', error);
            showMessage('Failed to update profile. Please try again.', 'error');
        }
    };

    /**
     * Deletes the user account.
     */
    const deleteAccount = async () => {
        try {
            console.log('Deleting account...');
            const response = await fetch(API_URL, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            console.log('Delete response status:', response.status);
            
            const responseText = await response.text();
            console.log('Delete raw response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = JSON.parse(responseText);
            console.log('Delete result:', result);

            if (result.success) {
                alert('Account deleted successfully.');
                window.location.href = 'login.html';
            } else {
                showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Delete Account Error:', error);
            showMessage('Failed to delete account. Please try again.', 'error');
        }
    };

    // --- Event Listeners ---

    // Toggle nav menu for mobile
    menuToggle?.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    // Edit button
    editButton?.addEventListener('click', () => {
        setEditMode(true);
    });

    // Cancel button
    cancelButton?.addEventListener('click', () => {
        // Restore original values
        document.getElementById('firstName').value = originalFormValues.firstName || '';
        document.getElementById('lastName').value = originalFormValues.lastName || '';
        document.getElementById('gender').value = originalFormValues.gender || '';
        document.getElementById('phoneNumber').value = originalFormValues.phoneNumber || '';
        document.getElementById('nid').value = originalFormValues.nid || '';
        document.getElementById('varsityId').value = originalFormValues.varsityId || '';
        document.getElementById('university').value = originalFormValues.university || '';
        document.getElementById('department').value = originalFormValues.department || '';
        profileImagePreview.src = originalFormValues.imageSrc || 'https://placehold.co/150x150/EFEFEF/AAAAAA?text=No+Image';
        varsityIdPictureInput.value = '';
        setEditMode(false);
    });

    // Save form
    profileForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });

    // Image preview
    varsityIdPictureInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImagePreview.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Delete Account Modal Logic
    deleteAccountButton?.addEventListener('click', () => {
        if (deleteModal) deleteModal.style.display = 'flex';
    });
    
    cancelDeleteButton?.addEventListener('click', () => {
        if (deleteModal) deleteModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    // Confirm deletion
    confirmDeleteButton?.addEventListener('click', () => {
        if (deleteModal) deleteModal.style.display = 'none';
        deleteAccount();
    });
    
    // Logout Link
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'login.html'; 
        });
    }

    // --- Initial Load ---
    console.log('Starting profile fetch...');
    fetchProfile();
});