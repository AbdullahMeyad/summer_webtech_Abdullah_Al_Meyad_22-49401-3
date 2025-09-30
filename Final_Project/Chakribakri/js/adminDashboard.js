document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const welcomeMessage = document.getElementById('welcomeMessage');
  const totalUsers = document.getElementById('totalUsers');
  const totalJobs = document.getElementById('totalJobs');
  const totalApplications = document.getElementById('totalApplications');
  
  // Tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Users tab elements
  const addUserBtn = document.getElementById('addUserBtn');
  const userModal = document.getElementById('userModal');
  const userForm = document.getElementById('userForm');
  const userModalTitle = document.getElementById('userModalTitle');
  const usersTableBody = document.getElementById('usersTableBody');
  const userRoleFilter = document.getElementById('userRoleFilter');
  const applyUserFilters = document.getElementById('applyUserFilters');
  const clearUserFilters = document.getElementById('clearUserFilters');
  
  // Jobs tab elements
  const addJobBtn = document.getElementById('addJobBtn');
  const jobModal = document.getElementById('jobModal');
  const jobForm = document.getElementById('jobForm');
  const jobModalTitle = document.getElementById('jobModalTitle');
  const jobsTableBody = document.getElementById('jobsTableBody');
  const jobTypeFilter = document.getElementById('jobTypeFilter');
  const applyJobFilters = document.getElementById('applyJobFilters');
  const clearJobFilters = document.getElementById('clearJobFilters');
  
  // Close buttons
  const closeButtons = document.querySelectorAll('.close');
  
  // Data storage
  let currentUser = null;
  let allUsers = [];
  let allJobs = [];
  let isEditingUser = false;
  let isEditingJob = false;
  
  // Initialize dashboard
  function initDashboard() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        currentUser = JSON.parse(userData);
        if (currentUser.role !== 'admin') {
          alert('Access denied. Admin privileges required.');
          window.location.href = 'login.html';
          return;
        }
      } else {
        alert('Please log in as an admin.');
        window.location.href = 'login.html';
        return;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      window.location.href = 'login.html';
      return;
    }
    
    if (welcomeMessage && currentUser.first_name) {
      welcomeMessage.textContent = `Welcome, Admin ${currentUser.first_name}!`;
    }
    
    loadDashboardStats();
    loadUsers();
    loadJobs();
    setupEventListeners();
  }
  
  // Load dashboard statistics
  function loadDashboardStats() {
    fetch('../controller/adminController.php?action=getUserStats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (totalUsers) totalUsers.textContent = data.stats.total_users;
        }
      });
      
    fetch('../controller/adminController.php?action=getJobStats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (totalJobs) totalJobs.textContent = data.stats.total_jobs;
          // Set applications to 0 as the logic was removed
          if (totalApplications) totalApplications.textContent = 0;
        }
      });
  }
  
  // Switch tabs
  function switchTab(targetTabId) {
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    document.getElementById(targetTabId)?.classList.add('active');
    document.querySelector(`.tab-button[data-tab="${targetTabId}"]`)?.classList.add('active');
  }
  
  // Show/hide modals
  function showUserModal(title, isEdit, user = null) {
    userModalTitle.textContent = title;
    isEditingUser = isEdit;
    const passwordField = document.getElementById('userPassword');

    if (isEdit && user) {
      document.getElementById('userId').value = user.id;
      document.getElementById('userFirstName').value = user.first_name;
      document.getElementById('userLastName').value = user.last_name;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;
      passwordField.required = false;
    } else {
      userForm.reset();
      passwordField.required = true;
    }
    userModal.style.display = 'flex';
  }
  
  function showJobModal(title, isEdit, job = null) {
    jobModalTitle.textContent = title;
    isEditingJob = isEdit;
    if (isEdit && job) {
      document.getElementById('jobId').value = job.id;
      document.getElementById('jobTitle').value = job.title;
      document.getElementById('jobCompany').value = job.company;
      document.getElementById('jobLocation').value = job.location;
      document.getElementById('jobSalary').value = job.salary;
      document.getElementById('jobType').value = job.type;
      document.getElementById('jobDescription').value = job.description;
      document.getElementById('jobRequirements').value = job.requirements || '';
      document.getElementById('jobDeadline').value = job.deadline;
    } else {
      jobForm.reset();
    }
    jobModal.style.display = 'flex';
  }
  
  function closeModal(modal) {
    if (modal) modal.style.display = 'none';
  }
  
  // Fetch and display users/jobs
  function loadUsers() {
    fetch('../controller/adminController.php?action=getAllUsers')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          allUsers = data.users;
          displayUsers(allUsers);
        } else {
          usersTableBody.innerHTML = `<tr><td colspan="6">${data.message}</td></tr>`;
        }
      })
      .catch(error => {
        console.error('Error loading users:', error);
        usersTableBody.innerHTML = '<tr><td colspan="6">Error loading users.</td></tr>';
      });
  }

  function displayUsers(users) {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
      return;
    }
    users.forEach(user => {
      const row = document.createElement('tr');
      const createdDate = new Date(user.created_at).toLocaleDateString();
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.first_name} ${user.last_name}</td>
        <td>${user.email}</td>
        <td><span class="role-badge role-${user.role}">${user.role}</span></td>
        <td>${createdDate}</td>
        <td>
          <button class="btn-sm btn-edit" data-id="${user.id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-sm btn-delete" data-id="${user.id}" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      `;
      usersTableBody.appendChild(row);
    });
  }

  function loadJobs() {
    fetch('../controller/adminController.php?action=getAllJobs')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          allJobs = data.jobs;
          displayJobs(allJobs);
        } else {
          jobsTableBody.innerHTML = `<tr><td colspan="8">${data.message}</td></tr>`;
        }
      })
      .catch(error => {
        console.error('Error loading jobs:', error);
        jobsTableBody.innerHTML = '<tr><td colspan="8">Error loading jobs.</td></tr>';
      });
  }

  function displayJobs(jobs) {
    jobsTableBody.innerHTML = '';
    if (jobs.length === 0) {
      jobsTableBody.innerHTML = '<tr><td colspan="8">No jobs found.</td></tr>';
      return;
    }
    jobs.forEach(job => {
      const row = document.createElement('tr');
      const postedDate = new Date(job.posted_date).toLocaleDateString();
      row.innerHTML = `
        <td>${job.id}</td>
        <td>${job.title}</td>
        <td>${job.company}</td>
        <td><span class="role-badge role-${job.type}">${formatJobType(job.type)}</span></td>
        <td>${formatSalary(job.salary)}</td>
        <td>${job.posted_by_name || 'N/A'}</td>
        <td>${postedDate}</td>
        <td>
          <button class="btn-sm btn-edit btn-edit-job" data-id="${job.id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-sm btn-delete-job" data-id="${job.id}" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      `;
      jobsTableBody.appendChild(row);
    });
  }
  
  // Form submission handlers
  function handleFormSubmit(form, action, isEditing) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      const submitAction = isEditing() ? `update${action}` : `create${action}`;
      if (submitAction === 'createJob' && currentUser) {
          data.posted_by = currentUser.id;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      fetch('../controller/adminController.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: submitAction, ...data })
      })
      .then(response => response.json())
      .then(resData => {
        alert(resData.message);
        if (resData.success) {
          closeModal(form.closest('.modal'));
          loadUsers();
          loadJobs();
          loadDashboardStats();
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Save';
      });
    });
  }
  
  // Setup all event listeners
  function setupEventListeners() {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    addUserBtn?.addEventListener('click', () => showUserModal('Add New User', false));
    addJobBtn?.addEventListener('click', () => showJobModal('Add New Job', false));
    
    handleFormSubmit(userForm, 'User', () => isEditingUser);
    handleFormSubmit(jobForm, 'Job', () => isEditingJob);
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => closeModal(button.closest('.modal')));
    });
    
    usersTableBody?.addEventListener('click', function(e) {
      const editBtn = e.target.closest('.btn-edit');
      const deleteBtn = e.target.closest('.btn-delete');
      if (editBtn) {
        const user = allUsers.find(u => u.id == editBtn.dataset.id);
        if (user) showUserModal('Edit User', true, user);
      }
      if (deleteBtn) {
        if (confirm('Are you sure you want to delete this user?')) {
          deleteItem('deleteUser', { userId: deleteBtn.dataset.id });
        }
      }
    });

    jobsTableBody?.addEventListener('click', function(e) {
      const editBtn = e.target.closest('.btn-edit-job');
      const deleteBtn = e.target.closest('.btn-delete-job');
      if (editBtn) {
        const job = allJobs.find(j => j.id == editBtn.dataset.id);
        if (job) showJobModal('Edit Job', true, job);
      }
      if (deleteBtn) {
        if (confirm('Are you sure you want to delete this job?')) {
          deleteItem('deleteJob', { jobId: deleteBtn.dataset.id });
        }
      }
    });

    applyUserFilters?.addEventListener('click', () => {
      const role = userRoleFilter.value;
      displayUsers(role ? allUsers.filter(u => u.role === role) : allUsers);
    });

    clearUserFilters?.addEventListener('click', () => {
      userRoleFilter.value = '';
      displayUsers(allUsers);
    });

    applyJobFilters?.addEventListener('click', () => {
      const type = jobTypeFilter.value;
      displayJobs(type ? allJobs.filter(j => j.type === type) : allJobs);
    });

    clearJobFilters?.addEventListener('click', () => {
      jobTypeFilter.value = '';
      displayJobs(allJobs);
    });
    
    window.addEventListener('click', e => {
      if (e.target === userModal) closeModal(userModal);
      if (e.target === jobModal) closeModal(jobModal);
    });
    
    document.getElementById('logoutLink')?.addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
      }
    });
  }
  
  function deleteItem(action, data) {
    fetch('../controller/adminController.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    })
    .then(response => response.json())
    .then(resData => {
      alert(resData.message);
      if (resData.success) {
        loadUsers();
        loadJobs();
        loadDashboardStats();
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred during deletion.');
    });
  }
  
  // Helper functions
  function formatJobType(type) {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function formatSalary(salary) {
    if (!salary) return 'Not Specified';
    return `BDT ${new Intl.NumberFormat('en-IN').format(salary)}`;
  }
  
  // Initialize
  initDashboard();
});