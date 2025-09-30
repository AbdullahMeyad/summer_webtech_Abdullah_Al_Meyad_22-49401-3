console.log('Login.js loaded at:', new Date().toISOString());

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting login.js initialization');
    
    // Get references to DOM elements with validation
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const loginButton = document.querySelector('.login-button');
    const togglePassword = document.getElementById('togglePassword');

    console.log('Form elements found:', {
        loginForm: !!loginForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        loginButton: !!loginButton
    });

    // Remove any existing form action to prevent conflicts
    if (loginForm) {
        console.log('Removing form action attribute');
        loginForm.removeAttribute('action');
        
        // Also remove method to be sure
        loginForm.removeAttribute('method');
    }

    // ✅ "Remember Me" functionality
    function getCookie(name) {
        const cookieString = "; " + document.cookie;
        const parts = cookieString.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
        }
        return null;
    }

    // Check for remembered credentials
    try {
        const rememberedEmail = getCookie('remember_email');
        const rememberedPassword = getCookie('remember_password');

        if (rememberedEmail && rememberedPassword && emailInput && passwordInput && rememberCheckbox) {
            emailInput.value = rememberedEmail;
            passwordInput.value = rememberedPassword;
            rememberCheckbox.checked = true;
            console.log('Restored remembered credentials');
        }
    } catch (error) {
        console.error('Error restoring credentials:', error);
    }

    // Reset login button state
    if (loginButton) {
        loginButton.innerHTML = 'Login';
        loginButton.disabled = false;
    }

    // Toggle Password Visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const eyeIcon = this.querySelector('i');
            if (eyeIcon) {
                if (type === 'password') {
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                } else {
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                }
            }
        });
    }

    // MAIN LOGIN HANDLER - This is where the issue likely is
    if (loginForm) {
        console.log('Adding submit event listener to form');
        
        // Remove ALL existing event listeners by cloning the form
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // Get the new form reference
        const cleanForm = document.getElementById('loginForm');
        
        cleanForm.addEventListener('submit', function(event) {
            console.log('=== LOGIN FORM SUBMITTED ===');
            console.log('Event type:', event.type);
            console.log('Event target:', event.target);
            console.log('Current target:', event.currentTarget);
            
            // Prevent all possible default behaviors
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Call our login function
            performLogin();
            
            return false;
        }, true); // Use capture phase
    }

    function performLogin() {
        console.log('=== PERFORMING LOGIN ===');
        
        // Re-get elements since we cloned the form
        const form = document.getElementById('loginForm');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const remember = document.getElementById('remember');
        const button = document.querySelector('.login-button');
        
        if (!email || !password || !button) {
            console.error('Required form elements not found after form clone');
            alert('Form elements not found. Please refresh the page.');
            return;
        }

        const emailValue = email.value.trim();
        const passwordValue = password.value;
        const rememberValue = remember ? remember.checked : false;

        console.log('Form values:', {
            email: emailValue,
            password: passwordValue ? '[PROVIDED]' : '[EMPTY]',
            remember: rememberValue
        });

        // Validate inputs
        if (!emailValue || !passwordValue) {
            alert('Please fill in both email and password.');
            return;
        }

        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        button.disabled = true;

        // Create form data manually
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('email', emailValue);
        formData.append('password', passwordValue);
        if (rememberValue) {
            formData.append('remember', '1');
        }

        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key + ':', key === 'password' ? '[HIDDEN]' : value);
        }

        const loginURL = '../controller/userController.php';
        console.log('Making fetch request to:', loginURL);
        console.log('Request method: POST');

        // Make the request
        fetch(loginURL, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                type: response.type
            });
            
            // Always get the response text to see what the server returned
            return response.text().then(text => {
                console.log('Server response text:', text);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}. Server response: ${text}`);
                }
                
                return text;
            });
        })
        .then(text => {
            console.log('Raw response text:', text);
            console.log('Response length:', text.length);
            console.log('First 200 characters:', text.substring(0, 200));
            
            let data;
            try {
                data = JSON.parse(text);
                console.log('Parsed JSON:', data);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Server returned invalid JSON. Response: ' + text.substring(0, 500));
            }
            
            if (data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                console.log('Login successful, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            } else {
                console.error('Login failed:', data.message);
                alert('Login failed: ' + data.message);
                resetButton(button);
            }
        })
        .catch(error => {
            console.error('=== LOGIN ERROR ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            
            alert('Login error: ' + error.message);
            resetButton(button);
        });
    }

    function resetButton(button) {
        if (button) {
            button.innerHTML = 'Login';
            button.disabled = false;
        }
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Forgot Password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Enter your email address to reset password:');
            if (email) {
                handleForgotPassword(email);
            }
        });
    }

    function handleForgotPassword(email) {
        const formData = new FormData();
        formData.append('action', 'forgotPassword');
        formData.append('email', email);

        fetch('../controller/userController.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            console.error('Forgot password error:', error);
            alert('An error occurred. Please try again.');
        });
    }

    // Contact Popup Functionality
    const contactPopup = document.getElementById('contactPopup');
    const contactLink = document.getElementById('contactLink');
    const footerContactLink = document.getElementById('footerContactLink');
    const closePopup = document.getElementById('closePopup');
    
    if (contactLink) {
        contactLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (contactPopup) contactPopup.classList.add('active');
        });
    }
    
    if (footerContactLink) {
        footerContactLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (contactPopup) contactPopup.classList.add('active');
        });
    }
    
    if (closePopup) {
        closePopup.addEventListener('click', function() {
            if (contactPopup) contactPopup.classList.remove('active');
        });
    }
    
    if (contactPopup) {
        contactPopup.addEventListener('click', function(e) {
            if (e.target === contactPopup) {
                contactPopup.classList.remove('active');
            }
        });
    }

    console.log('Login.js initialization complete');
});