// Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        if (this.getAttribute('href') !== '#') {
          e.preventDefault();
          document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });

    // Search Filter Functionality
    function filterJobs() {
      const input = document.getElementById('jobSearch').value.toLowerCase();
      const jobs = document.querySelectorAll('.job-card');
      let resultsFound = false;
      
      jobs.forEach(job => {
        const text = job.innerText.toLowerCase();
        if (text.includes(input)) {
          job.style.display = 'block';
          resultsFound = true;
        } else {
          job.style.display = 'none';
        }
      });
      
      // Show message if no results found
      const jobGrid = document.getElementById('jobGrid');
      let message = document.getElementById('noResultsMessage');
      
      if (!resultsFound) {
        if (!message) {
          message = document.createElement('div');
          message.id = 'noResultsMessage';
          message.style.gridColumn = '1 / -1';
          message.style.textAlign = 'center';
          message.style.padding = '2rem';
          message.style.color = '#666';
          message.innerHTML = `
            <h3>No jobs found matching your search</h3>
            <p>Try different keywords or browse all available positions</p>
          `;
          jobGrid.appendChild(message);
        }
      } else if (message) {
        message.remove();
      }
    }

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
    contactLink.addEventListener('click', function(e) {
      e.preventDefault();
      openContactPopup();
    });

    footerContactLink.addEventListener('click', function(e) {
      e.preventDefault();
      openContactPopup();
    });

    // Event listener for closing popup
    closePopup.addEventListener('click', closeContactPopup);

    // Close popup when clicking outside the content
    contactPopup.addEventListener('click', function(e) {
      if (e.target === contactPopup) {
        closeContactPopup();
      }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && contactPopup.classList.contains('active')) {
        closeContactPopup();
      }
    });