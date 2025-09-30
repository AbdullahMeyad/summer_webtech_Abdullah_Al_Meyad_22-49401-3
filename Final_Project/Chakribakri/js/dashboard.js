document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const jobsList = document.getElementById('jobsList');
  const postJobBtn = document.getElementById('postJobBtn');
  const postJobModal = document.getElementById('postJobModal');
  const jobDetailsModal = document.getElementById('jobDetailsModal');
  const postJobForm = document.getElementById('postJobForm');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const salaryFilter = document.getElementById('salaryFilter');
  const jobTypeFilter = document.getElementById('jobTypeFilter');
  const closeButtons = document.querySelectorAll('.close, .close-modal');
  const applyJobBtn = document.getElementById('applyJobBtn');
  const welcomeMessage = document.getElementById('welcomeMessage');

  
  // Current user data
  let currentUser = null;
  
  // Jobs data
  let jobs = [];
  let filteredJobs = [];
  
  // Initialize the dashboard
  function initDashboard() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        currentUser = JSON.parse(userData);
      } else {
        window.location.href = 'login.html';
        return;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      window.location.href = 'login.html';
      return;
    }
    
    if (welcomeMessage && currentUser.first_name) {
      welcomeMessage.textContent = `Welcome, ${currentUser.first_name}!`;
    }

    // ==================== MODIFICATION START ====================
    // Hide the "Post Job" button ONLY for students, show for all other roles
    if (currentUser.role === 'student') {
        postJobBtn.style.display = 'none';
    } else {
        postJobBtn.style.display = 'block'; // Show for faculty, admin, and any other roles
    }
    // ===================== MODIFICATION END =====================

    loadJobs();
    setupEventListeners();
  }
  
  // Load jobs from the server
  function loadJobs() {
    fetch('../controller/jobController.php?action=getJobs')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          jobs = data.jobs;
          filteredJobs = [...jobs];

          // *** DIAGNOSTIC 1: Log the data received from the server ***
          console.log('Jobs data loaded from server:', jobs);
          
          displayJobs(filteredJobs);
        } else {
          console.error('Failed to load jobs:', data.message);
          jobsList.innerHTML = `<p class="error-message">Could not load jobs. Please try again later.</p>`;
        }
      })
      .catch(error => {
        console.error('Error loading jobs:', error);
        jobsList.innerHTML = `<p class="error-message">An error occurred while fetching jobs.</p>`;
      });
  }
  
  // Display jobs in the UI
  function displayJobs(jobsArray) {
    jobsList.innerHTML = '';
    
    if (jobsArray.length === 0) {
      jobsList.innerHTML = '<p class="no-jobs">No jobs found matching your criteria.</p>';
      return;
    }
    
    jobsArray.forEach(job => {
      const jobCard = document.createElement('div');
      jobCard.className = 'job-card';
      
      // *** DIAGNOSTIC 2: Check if job.id exists before setting it ***
      if (job && job.id) {
        jobCard.dataset.id = job.id;
      } else {
        console.error('A job object is missing an "id" property:', job);
      }
      
      jobCard.innerHTML = `
        <h3 class="job-title">${job.title}</h3>
        <p class="job-company">${job.company}</p>
        <div class="job-details">
          <span class="job-tag">${formatJobType(job.type)}</span>
          <span class="job-salary">${job.salary} BDT</span>
        </div>
        <p class="job-location">📍 ${job.location}</p>
        <div class="job-footer">
          <span class="job-date">Posted: ${formatDate(job.posted_date)}</span>
          <button class="btn-outline view-details">View Details</button>
        </div>
      `;
      
      jobsList.appendChild(jobCard);
    });
    
    // Add event listeners to "View Details" buttons
    document.querySelectorAll('.view-details').forEach(button => {
      button.addEventListener('click', function(e) {
        const card = e.target.closest('.job-card');
        const jobIdStr = card.dataset.id;
        
        // *** DIAGNOSTIC 3: Log the ID string from the card ***
        console.log('Clicked card data-id attribute:', jobIdStr);

        if (jobIdStr) {
          showJobDetails(jobIdStr);
        } else {
          console.error('Could not find data-id on the clicked card.');
        }
      });
    });
  }
  
  // Format job type for display
  function formatJobType(type) {
    return (type.charAt(0).toUpperCase() + type.slice(1)).replace('-', ' ');
  }
  
  // Format date for display
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }
  
  // Show job details in a modal
  function showJobDetails(jobId) {
    // *** DIAGNOSTIC 4: Log the ID being searched for and its type ***
    console.log(`Searching for job with ID: ${jobId} (Type: ${typeof jobId})`);

    const job = jobs.find(j => j.id == jobId); 
    
    // *** DIAGNOSTIC 5: Log the result of the search ***
    console.log('Job found:', job);

    if (!job) {
      alert('Job details not found. Check the console (F12) for more information.');
      return;
    }
    
    // Populate modal
    document.getElementById('modalJobTitle').textContent = job.title;
    document.getElementById('modalJobType').textContent = formatJobType(job.type);
    document.getElementById('modalSalary').textContent = job.salary.toLocaleString();
    document.getElementById('modalLocation').textContent = job.location;
    document.getElementById('modalPostedDate').textContent = formatDate(job.posted_date);
    document.getElementById('modalDeadline').textContent = formatDate(job.deadline);
    document.getElementById('modalDescription').textContent = job.description;
    
    if (currentUser.role === 'student') {
      applyJobBtn.style.display = 'block';
      applyJobBtn.dataset.jobId = job.id;
    } else {
      applyJobBtn.style.display = 'none';
    }
    
    jobDetailsModal.style.display = 'block';
  }

  // Apply filters to the job list
  function applyJobsFilters() {
    const salaryValue = salaryFilter.value;
    const typeValue = jobTypeFilter.value;
    
    filteredJobs = jobs.filter(job => {
      const typeMatch = !typeValue || job.type === typeValue;
      let salaryMatch = true;
      if (salaryValue) {
        const [min, max] = salaryValue.split('-').map(Number);
        if (max) {
          salaryMatch = job.salary >= min && job.salary <= max;
        } else if (salaryValue.includes('+')) {
          salaryMatch = job.salary >= min;
        } else {
          salaryMatch = job.salary <= max;
        }
      }
      return typeMatch && salaryMatch;
    });
    
    displayJobs(filteredJobs);
  }
  
  // Clear all filters and show all jobs
  function clearAllFilters() {
    salaryFilter.value = '';
    jobTypeFilter.value = '';
    filteredJobs = [...jobs];
    displayJobs(filteredJobs);
  }
  
  // Handle job application
  function applyForJob(jobId) {
    if (currentUser.role !== 'student') {
      alert('Only students can apply for jobs.');
      return;
    }
    
    fetch('../controller/jobController.php?action=apply', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ jobId: jobId, userId: currentUser.id })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.success ? 'Application submitted successfully!' : `Error: ${data.message}`);
      if(data.success) closeModals();
    })
    .catch(error => {
      console.error('Error applying for job:', error);
      alert('An error occurred. Please try again.');
    });
  }
  
  // Handle posting a new job
  function postNewJob(jobData) {
    fetch('../controller/jobController.php?action=postJob', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(jobData)
    })
    .then(response => response.json())
    .then(data => {
      alert(data.success ? 'Job posted successfully!' : `Error: ${data.message}`);
      if(data.success) {
        postJobForm.reset();
        closeModals();
        loadJobs();
      }
    })
    .catch(error => {
      console.error('Error posting job:', error);
      alert('An error occurred. Please try again.');
    });
  }
  
  // Close all open modals
  function closeModals() {
    postJobModal.style.display = 'none';
    jobDetailsModal.style.display = 'none';
  }
  
  // Set up all event listeners for the page
  function setupEventListeners() {
    postJobBtn.addEventListener('click', () => { postJobModal.style.display = 'block'; });
    applyFiltersBtn.addEventListener('click', applyJobsFilters);
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    closeButtons.forEach(button => button.addEventListener('click', closeModals));
    
    window.addEventListener('click', (event) => {
      if (event.target === postJobModal || event.target === jobDetailsModal) {
        closeModals();
      }
    });
    
    applyJobBtn.addEventListener('click', () => {
      const jobId = parseInt(applyJobBtn.dataset.jobId);
      applyForJob(jobId);
    });
    
    postJobForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const jobData = {
        title: document.getElementById('jobTitle').value,
        company: document.getElementById('company').value,
        description: document.getElementById('jobDescription').value,
        type: document.getElementById('jobType').value,
        salary: parseInt(document.getElementById('salary').value),
        location: document.getElementById('location').value,
        deadline: document.getElementById('applicationDeadline').value,
        posted_by: currentUser.id
      };
      postNewJob(jobData);
    });
    
    document.getElementById('logoutLink').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }
  
  initDashboard();
});