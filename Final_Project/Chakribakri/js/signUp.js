document.addEventListener('DOMContentLoaded', function() {
    // ==================== DOM Elements ====================
    const steps = document.querySelectorAll(".step");
    const stepIndicators = document.querySelectorAll(".step-indicator");
    const progressBar = document.getElementById("progress-bar");
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const form = document.getElementById("signupForm");
    let currentStep = 0;

    // Input elements
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const gender = document.getElementById("gender");
    const nid = document.getElementById("nid");
    const varsityId = document.getElementById("varsityId");
    const university = document.getElementById("university");
    const department = document.getElementById("department");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const role = document.getElementById("role");
    const terms = document.getElementById("terms");
    const idPic = document.getElementById("idPic");
    const fileIndicator = document.getElementById("fileIndicator");

    // Error spans
    const firstNameError = document.getElementById("firstNameError");
    const lastNameError = document.getElementById("lastNameError");
    const emailError = document.getElementById("emailError");
    const phoneError = document.getElementById("phoneError");
    const nidError = document.getElementById("nidError");
    const varsityIdError = document.getElementById("varsityIdError");
    const universityError = document.getElementById("universityError");
    const departmentError = document.getElementById("departmentError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const roleError = document.getElementById("roleError");
    const termsError = document.getElementById("termsError");

    // ==================== Mobile Menu Toggle ====================
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav') && !e.target.closest('.menu-toggle')) {
                navMenu.classList.remove('active');
            }
        });
    }

    // ==================== Validation Functions ====================

    // Validate Bangladesh phone number format
    function validateBDPhoneNumber(phoneNumber) {
        const cleaned = phoneNumber.replace(/[\s\-\+]/g, '');
        if (cleaned.length === 11 && cleaned.startsWith('01')) {
            const prefix = cleaned.substring(0, 3);
            const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
            return validPrefixes.includes(prefix);
        }
        return false;
    }

    // Check if field value is unique in database
    async function checkFieldUniqueness(fieldName, value) {
        try {
            const formData = new FormData();
            formData.append('action', 'checkUnique');
            formData.append('field', fieldName);
            formData.append('value', value);

            const response = await fetch('../controller/userController.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.success ? data.isUnique : true;
        } catch (error) {
            console.error('Error checking field uniqueness:', error);
            return true;
        }
    }

    // ==================== File Upload Handling ====================
    if (idPic) {
        idPic.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const fileSize = file.size / 1024 / 1024;
                
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    fileIndicator.textContent = "Please upload a valid image file (JPG, PNG, GIF)";
                    fileIndicator.style.color = "#e74c3c";
                    this.value = "";
                    return;
                }
                
                if (fileSize > 5) {
                    fileIndicator.textContent = "File size must be less than 5MB";
                    fileIndicator.style.color = "#e74c3c";
                    this.value = "";
                    return;
                }
                
                fileIndicator.textContent = `✓ ${file.name} selected`;
                fileIndicator.style.color = "#27ae60";
            } else {
                fileIndicator.textContent = "";
            }
        });
    }

    // ==================== Main Functions ====================
    function updateProgress() {
        if (progressBar) {
            progressBar.style.width = `${(currentStep / (steps.length - 1)) * 100}%`;
        }
        
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("active", index <= currentStep);
        });
        
        if (prevBtn) {
            prevBtn.disabled = currentStep === 0;
        }
        
        if (nextBtn) {
            nextBtn.textContent = currentStep === steps.length - 1 ? "Create Account" : "Next";
        }
    }

    function showStep(step) {
        steps.forEach((s, i) => s.classList.toggle("active", i === step));
        updateProgress();
    }

    async function validateStep(step) {
        let valid = true;

        // Clear previous errors
        document.querySelectorAll(".error").forEach(e => {
            e.textContent = "";
            e.style.color = "#e74c3c";
        });

        if (step === 0) {
            // Validate Step 1: Personal Info
            if (!firstName?.value.trim()) {
                valid = false;
                if (firstNameError) firstNameError.textContent = "First name is required";
            } else if (firstName.value.trim().length < 2) {
                valid = false;
                if (firstNameError) firstNameError.textContent = "First name must be at least 2 characters";
            }

            if (!lastName?.value.trim()) {
                valid = false;
                if (lastNameError) lastNameError.textContent = "Last name is required";
            } else if (lastName.value.trim().length < 2) {
                valid = false;
                if (lastNameError) lastNameError.textContent = "Last name must be at least 2 characters";
            }

            // Email validation
            if (!email?.value.trim()) {
                valid = false;
                if (emailError) emailError.textContent = "Email is required";
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.value.trim())) {
                    valid = false;
                    if (emailError) emailError.textContent = "Please enter a valid email address";
                } else {
                    const emailUnique = await checkFieldUniqueness('email', email.value.trim());
                    if (!emailUnique) {
                        valid = false;
                        if (emailError) emailError.textContent = "This email is already registered";
                    }
                }
            }

            // Phone validation
            if (!phone?.value.trim()) {
                valid = false;
                if (phoneError) phoneError.textContent = "Phone number is required";
            } else if (!validateBDPhoneNumber(phone.value.trim())) {
                valid = false;
                if (phoneError) phoneError.textContent = "Please enter a valid 11-digit BD phone number (e.g., 01712345678)";
            } else {
                const phoneUnique = await checkFieldUniqueness('phone_number', phone.value.trim());
                if (!phoneUnique) {
                    valid = false;
                    if (phoneError) phoneError.textContent = "This phone number is already registered";
                }
            }

            // Gender validation
            if (!gender?.value) {
                valid = false;
                // Add gender error span if it doesn't exist
                let genderError = document.getElementById("genderError");
                if (!genderError) {
                    genderError = document.createElement("span");
                    genderError.className = "error";
                    genderError.id = "genderError";
                    gender.parentNode.parentNode.appendChild(genderError);
                }
                genderError.textContent = "Please select your gender";
            }

            // NID validation
            if (!nid?.value.trim()) {
                valid = false;
                if (nidError) nidError.textContent = "NID is required";
            } else if (nid.value.trim().length < 10) {
                valid = false;
                if (nidError) nidError.textContent = "NID must be at least 10 digits";
            } else if (!/^\d+$/.test(nid.value.trim())) {
                valid = false;
                if (nidError) nidError.textContent = "NID must contain only numbers";
            } else {
                const nidUnique = await checkFieldUniqueness('nid', nid.value.trim());
                if (!nidUnique) {
                    valid = false;
                    if (nidError) nidError.textContent = "This NID is already registered";
                }
            }

        } else if (step === 1) {
            // Validate Step 2: University Info
            if (!varsityId?.value.trim()) {
                valid = false;
                if (varsityIdError) varsityIdError.textContent = "University ID is required";
            } else {
                const varsityIdUnique = await checkFieldUniqueness('varsity_id', varsityId.value.trim());
                if (!varsityIdUnique) {
                    valid = false;
                    if (varsityIdError) varsityIdError.textContent = "This University ID is already registered";
                }
            }

            if (!university?.value.trim()) {
                valid = false;
                if (universityError) universityError.textContent = "University name is required";
            } else if (university.value.trim().length < 3) {
                valid = false;
                if (universityError) universityError.textContent = "University name must be at least 3 characters";
            }

            if (!department?.value.trim()) {
                valid = false;
                if (departmentError) departmentError.textContent = "Department is required";
            } else if (department.value.trim().length < 3) {
                valid = false;
                if (departmentError) departmentError.textContent = "Department name must be at least 3 characters";
            }
            
            if (!idPic?.files.length) {
                valid = false;
                if (fileIndicator) {
                    fileIndicator.textContent = "Please upload your picture";
                    fileIndicator.style.color = "#e74c3c";
                }
            } 

        } else if (step === 2) {
            // Validate Step 3: Account Setup
            if (!password?.value.trim()) {
                valid = false;
                if (passwordError) passwordError.textContent = "Password is required";
            } else if (password.value.length < 6) {
                valid = false;
                if (passwordError) passwordError.textContent = "Password must be at least 6 characters";
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)) {
                valid = false;
                if (passwordError) passwordError.textContent = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
            }

            if (!confirmPassword?.value.trim()) {
                valid = false;
                if (confirmPasswordError) confirmPasswordError.textContent = "Please confirm your password";
            } else if (password?.value !== confirmPassword.value) {
                valid = false;
                if (confirmPasswordError) confirmPasswordError.textContent = "Passwords do not match";
            }

            if (!role?.value) {
                valid = false;
                if (roleError) roleError.textContent = "Please select your role";
            }

            if (!terms?.checked) {
                valid = false;
                if (termsError) termsError.textContent = "You must agree to the terms and conditions";
            }
        }

        return valid;
    }

    // ==================== Real-time Validation ====================
    if (email) {
        email.addEventListener('blur', async function() {
            const value = this.value.trim();
            if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                if (emailError) {
                    emailError.textContent = "Checking availability...";
                    emailError.style.color = "#f39c12";
                }
                const isUnique = await checkFieldUniqueness('email', value);
                if (emailError) {
                    if (!isUnique) {
                        emailError.textContent = "This email is already registered";
                        emailError.style.color = "#e74c3c";
                    } else {
                        emailError.textContent = "✓ Email is available";
                        emailError.style.color = "#27ae60";
                    }
                }
            }
        });
    }

    if (phone) {
        phone.addEventListener('blur', async function() {
            const value = this.value.trim();
            if (value && validateBDPhoneNumber(value)) {
                if (phoneError) {
                    phoneError.textContent = "Checking availability...";
                    phoneError.style.color = "#f39c12";
                }
                const isUnique = await checkFieldUniqueness('phone_number', value);
                if (phoneError) {
                    if (!isUnique) {
                        phoneError.textContent = "This phone number is already registered";
                        phoneError.style.color = "#e74c3c";
                    } else {
                        phoneError.textContent = "✓ Phone number is available";
                        phoneError.style.color = "#27ae60";
                    }
                }
            }
        });
    }

    if (nid) {
        nid.addEventListener('blur', async function() {
            const value = this.value.trim();
            if (value && value.length >= 10 && /^\d+$/.test(value)) {
                if (nidError) {
                    nidError.textContent = "Checking availability...";
                    nidError.style.color = "#f39c12";
                }
                const isUnique = await checkFieldUniqueness('nid', value);
                if (nidError) {
                    if (!isUnique) {
                        nidError.textContent = "This NID is already registered";
                        nidError.style.color = "#e74c3c";
                    } else {
                        nidError.textContent = "✓ NID is available";
                        nidError.style.color = "#27ae60";
                    }
                }
            }
        });
    }

    if (varsityId) {
        varsityId.addEventListener('blur', async function() {
            const value = this.value.trim();
            if (value) {
                if (varsityIdError) {
                    varsityIdError.textContent = "Checking availability...";
                    varsityIdError.style.color = "#f39c12";
                }
                const isUnique = await checkFieldUniqueness('varsity_id', value);
                if (varsityIdError) {
                    if (!isUnique) {
                        varsityIdError.textContent = "This University ID is already registered";
                        varsityIdError.style.color = "#e74c3c";
                    } else {
                        varsityIdError.textContent = "✓ University ID is available";
                        varsityIdError.style.color = "#27ae60";
                    }
                }
            }
        });
    }

    // ==================== Event Listeners ====================
    if (nextBtn) {
        nextBtn.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevent any default behavior
            
            if (currentStep < steps.length - 1) {
                // Disable button and show loading state
                nextBtn.disabled = true;
                const originalText = nextBtn.textContent;
                nextBtn.textContent = "Validating...";

                try {
                    const isValid = await validateStep(currentStep);

                    if (isValid) {
                        // Move to next step
                        steps[currentStep].classList.remove("active");
                        currentStep++;
                        steps[currentStep].classList.add("active");
                        updateProgress();
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                } finally {
                    // Re-enable button and restore text
                    nextBtn.disabled = false;
                    nextBtn.textContent = currentStep === steps.length - 1 ? "Create Account" : "Next";
                }
            } else {
                // Final submit step
                nextBtn.disabled = true;
                nextBtn.textContent = "Creating Account...";
                
                try {
                    const isValid = await validateStep(currentStep);
                    if (isValid) {
                        // Submit the form
                        form.submit();
                    } else {
                        nextBtn.disabled = false;
                        nextBtn.textContent = "Create Account";
                    }
                } catch (error) {
                    console.error('Final validation error:', error);
                    nextBtn.disabled = false;
                    nextBtn.textContent = "Create Account";
                }
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    }

    // Prevent form submission on Enter key
    if (form) {
        form.addEventListener("submit", function(e) {
            if (currentStep < steps.length - 1) {
                e.preventDefault();
            }
        });
    }

    // Toggle password visibility
    const togglePassword = document.getElementById("togglePassword");
    if (togglePassword && password) {
        togglePassword.addEventListener("click", (e) => {
            e.preventDefault();
            const type = password.getAttribute("type") === "password" ? "text" : "password";
            password.setAttribute("type", type);
            const icon = togglePassword.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye");
                icon.classList.toggle("fa-eye-slash");
            }
        });
    }

    // Toggle confirm password visibility
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
    if (toggleConfirmPassword && confirmPassword) {
        toggleConfirmPassword.addEventListener("click", (e) => {
            e.preventDefault();
            const type = confirmPassword.getAttribute("type") === "password" ? "text" : "password";
            confirmPassword.setAttribute("type", type);
            const icon = toggleConfirmPassword.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye");
                icon.classList.toggle("fa-eye-slash");
            }
        });
    }

    // ==================== Contact Popup ====================
    const contactPopup = document.getElementById('contactPopup');
    const contactLink = document.getElementById('contactLink');
    const footerContactLink = document.getElementById('footerContactLink');
    const closePopup = document.getElementById('closePopup');

    function openContactPopup() {
        if (contactPopup) {
            contactPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeContactPopup() {
        if (contactPopup) {
            contactPopup.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (contactLink) {
        contactLink.addEventListener('click', e => { 
            e.preventDefault(); 
            openContactPopup(); 
        });
    }

    if (footerContactLink) {
        footerContactLink.addEventListener('click', e => { 
            e.preventDefault(); 
            openContactPopup(); 
        });
    }

    if (closePopup) {
        closePopup.addEventListener('click', closeContactPopup);
    }

    if (contactPopup) {
        contactPopup.addEventListener('click', e => { 
            if (e.target === contactPopup) closeContactPopup(); 
        });
    }

    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && contactPopup?.classList.contains('active')) {
            closeContactPopup(); 
        }
    });

    // ==================== Initialize ====================
    showStep(currentStep);
});