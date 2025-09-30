document.addEventListener('DOMContentLoaded', function() {
    // Set hidden inputs from URL
    const urlParams = new URLSearchParams(window.location.search);
    document.getElementById('userId').value = urlParams.get('user_id') || '';
    document.getElementById('token').value = urlParams.get('token') || '';

    // Contact popup functionality
    const contactLink = document.getElementById('contactLink');
    const contactPopup = document.getElementById('contactPopup');
    const closePopup = document.getElementById('closePopup');

    contactLink.addEventListener('click', function(e) {
        e.preventDefault();
        contactPopup.classList.add('active');
    });

    closePopup.addEventListener('click', function() {
        contactPopup.classList.remove('active');
    });

    // Close popup when clicking outside
    contactPopup.addEventListener('click', function(e) {
        if (e.target === contactPopup) {
            contactPopup.classList.remove('active');
        }
    });

    // Password form
    const passwordForm = document.getElementById('passwordChangeForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmError = document.getElementById('confirmError');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const changePasswordButton = document.querySelector('.change-password-button');
    const successMessage = document.getElementById('successMessage');
    const countdownElement = document.getElementById('countdown');

    // Toggle password visibility
    function togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        const eyeIcon = button.querySelector('i');
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    }

    toggleNewPassword.addEventListener('click', () =>
        togglePasswordVisibility(newPasswordInput, toggleNewPassword)
    );
    toggleConfirmPassword.addEventListener('click', () =>
        togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword)
    );

    // Password strength
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;

        const strengthBar = passwordStrength.querySelector('.strength-bar');
        const strengthText = passwordStrength.querySelector('.strength-text');
        
        // Reset classes
        passwordStrength.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
        
        if (strength > 0) {
            if (strength === 1) passwordStrength.classList.add('strength-weak');
            else if (strength <= 3) passwordStrength.classList.add('strength-medium');
            else passwordStrength.classList.add('strength-strong');
        }

        const texts = ['Weak', 'Medium', 'Strong', 'Very Strong'];
        strengthText.textContent =
            strength > 0 ? texts[strength - 1] + ' password' : 'Password strength';
    });

    // Form submission
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        confirmError.style.display = 'none';

        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const userId = document.getElementById('userId').value;
        const token = document.getElementById('token').value;

        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            newPasswordInput.focus();
            return;
        }
        if (newPassword !== confirmPassword) {
            confirmError.textContent = 'Passwords do not match';
            confirmError.style.display = 'block';
            confirmPasswordInput.focus();
            return;
        }

        changePasswordButton.disabled = true;
        changePasswordButton.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Changing Password...';

        // AJAX request
        fetch('../controller/userController.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=change_password&userId=${encodeURIComponent(
                userId
            )}&token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(
                newPassword
            )}`,
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    successMessage.style.display = 'flex';
                    passwordForm.style.display = 'none';
                    document.querySelector('.back-login').style.display = 'none';
                    
                    let countdown = 5;
                    countdownElement.textContent = countdown;
                    const interval = setInterval(() => {
                        countdown--;
                        countdownElement.textContent = countdown;
                        if (countdown <= 0) {
                            clearInterval(interval);
                            window.location.href = 'login.html';
                        }
                    }, 1000);
                } else {
                    alert(data.message || 'Something went wrong');
                }
            })
            .catch((err) => alert('Error: ' + err))
            .finally(() => {
                changePasswordButton.disabled = false;
                changePasswordButton.innerHTML = 'Change Password';
            });
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav ul');

    menuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
    });
});