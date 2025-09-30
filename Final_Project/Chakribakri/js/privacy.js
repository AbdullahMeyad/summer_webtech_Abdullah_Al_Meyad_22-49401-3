
// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('nav ul');
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && !e.target.closest('.menu-toggle')) {
        navMenu.classList.remove('active');
    }
});

// Contact Popup Functionality
const contactPopup = document.getElementById('contactPopup');
const contactLink = document.getElementById('contactLink');
const footerContactLink = document.getElementById('footerContactLink');
const closePopup = document.getElementById('closePopup');

// Function to open popup
function openContactPopup() {
    contactPopup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Function to close popup
function closeContactPopup() {
    contactPopup.classList.remove('active');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Event listeners for opening popup
contactLink.addEventListener('click', function (e) {
    e.preventDefault();
    openContactPopup();
});

footerContactLink.addEventListener('click', function (e) {
    e.preventDefault();
    openContactPopup();
});

// Event listener for closing popup
closePopup.addEventListener('click', closeContactPopup);

// Close popup when clicking outside the content
contactPopup.addEventListener('click', function (e) {
    if (e.target === contactPopup) {
        closeContactPopup();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && contactPopup.classList.contains('active')) {
        closeContactPopup();
    }
});
