document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Contact Popup Functionality
    const contactPopup = document.getElementById('contactPopup');
    const contactLinks = document.querySelectorAll('#contactLink, #footerContactLink');
    const closePopup = document.getElementById('closePopup');

    contactLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            contactPopup.classList.add('active');
        });
    });

    if (closePopup) {
        closePopup.addEventListener('click', function() {
            contactPopup.classList.remove('active');
        });
    }
    
    if (contactPopup) {
        contactPopup.addEventListener('click', function(e) {
            if (e.target === contactPopup) {
                contactPopup.classList.remove('active');
            }
        });
    }

    // Forgot Password Form Handling
    const forgotForm = document.getElementById('forgotForm');
    const resetButton = document.querySelector('.reset-button');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const successText = document.getElementById('successText');
    const errorText = document.getElementById('errorText');

    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Hide previous messages
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            
            // Show loading state
            const originalButtonText = resetButton.innerHTML;
            resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            resetButton.disabled = true;

            const formData = new FormData(forgotForm);

            fetch(forgotForm.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    successText.textContent = data.message;
                    successMessage.style.display = 'flex';
                    forgotForm.reset();
                } else {
                    errorText.textContent = data.message;
                    errorMessage.style.display = 'flex';
                }
            })
            .catch(() => {
                errorText.textContent = 'Network error. Please try again.';
                errorMessage.style.display = 'flex';
            })
            .finally(() => {
                // Reset button state
                resetButton.innerHTML = originalButtonText;
                resetButton.disabled = false;
            });
        });
    }
});