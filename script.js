// Initialize data files if they don't exist
function initializeDataFiles() {
    if (!localStorage.getItem('adminData')) {
        localStorage.setItem('adminData', JSON.stringify({ pin: '1234' }));
    }
    
    if (!localStorage.getItem('staffData')) {
        localStorage.setItem('staffData', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('taskData')) {
        localStorage.setItem('taskData', JSON.stringify([]));
    }
}

// Get current page
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return page;
}

// Navigation functions
function navigateTo(page) {
    window.location.href = page;
}

// Admin functions
function handleAdminLogin() {
    const pinInput = document.getElementById('admin-pin');
    const errorElement = document.getElementById('login-error');
    
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    
    if (pinInput.value === adminData.pin) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        loadAdminDashboard();
    } else {
        errorElement.textContent = 'Invalid PIN. Please try again.';
        pinInput.value = '';
    }
}

function loadAdminDashboard() {
    loadStaffList();
    loadStaffSelect();
    loadAdminTaskList();
}

function loadStaffList() {
    const staffListElement = document.getElementById('staff-list');
    const staffData = JSON.parse(localStorage.getItem('staffData'));
    
    staffListElement.innerHTML = '';
    
    staffData.forEach(staff => {
        const staffCard = document.createElement('div');
        staffCard.className = 'staff-card';
        staffCard.innerHTML = `
            <span>${staff.name} (PIN: ${staff.pin})</span>
            <button class="remove-staff-btn" data-id="${staff.id}">Remove</button>
        `;
        staffListElement.appendChild(staffCard);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-staff-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const staffId = e.target.getAttribute('data-id');
            removeStaff(staffId);
        });
    });
}

function addStaff() {
    const nameInput = document.getElementById('staff-name');
    const pinInput = document.getElementById('staff-pin');
    
    if (!nameInput.value || !pinInput.value || pinInput.value.length !== 4) {
        alert('Please enter a valid name and 4-digit PIN');
        return;
    }
    
    const staffData = JSON.parse(localStorage.getItem('staffData'));
    const newStaff = {
        id: Date.now().toString(),
        name: nameInput.value,
        pin: pinInput.value
    };
    
    staffData.push(newStaff);
    localStorage.setItem('staffData', JSON.stringify(staffData));
    
    nameInput.value = '';
    pinInput.value = '';
    
    loadStaffList();
    loadStaffSelect();
}

function removeStaff(staffId) {
    let staffData = JSON.parse(localStorage.getItem('staffData'));
    staffData = staffData.filter(staff => staff.id !== staffId);
    localStorage.setItem('staffData', JSON.stringify(staffData));
    
    loadStaffList();
    loadStaffSelect();
}

function loadStaffSelect() {
    const staffSelect = document.getElementById('staff-select');
    const staffData = JSON.parse(localStorage.getItem('staffData'));
    
    staffSelect.innerHTML = '<option value="">Select Staff</option>';
    
    staffData.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = staff.name;
        staffSelect.appendChild(option);
    });
}

function assignTask() {
    const staffSelect = document.getElementById('staff-select');
    const taskDescInput = document.getElementById('task-desc');
    
    if (!staffSelect.value || !taskDescInput.value) {
        alert('Please select a staff member and enter a task description');
        return;
    }
    
    const taskData = JSON.parse(localStorage.getItem('taskData'));
    const staffData = JSON.parse(localStorage.getItem('staffData'));
    
    const selectedStaff = staffData.find(staff => staff.id === staffSelect.value);
    
    const newTask = {
        id: Date.now().toString(),
        staffId: staffSelect.value,
        staffName: selectedStaff.name,
        description: taskDescInput.value,
        status: 'not started',
        createdAt: new Date().toISOString(),
        history: []
    };
    
    taskData.push(newTask);
    localStorage.setItem('taskData', JSON.stringify(taskData));
    
    taskDescInput.value = '';
    loadAdminTaskList();
}

function loadAdminTaskList() {
    const taskListElement = document.getElementById('admin-task-list');
    const taskData = JSON.parse(localStorage.getItem('taskData'));
    
    taskListElement.innerHTML = '';
    
    taskData.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.innerHTML = `
            <div>
                <strong>${task.staffName}</strong>
                <p>${task.description}</p>
                <span class="task-status status-${task.status.replace(' ', '-')}">${task.status}</span>
            </div>
            <div class="task-card-actions">
                <button class="remove-task-btn" data-id="${task.id}">Remove</button>
            </div>
        `;
        taskListElement.appendChild(taskCard);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-task-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-id');
            removeTask(taskId);
        });
    });
}

function removeTask(taskId) {
    let taskData = JSON.parse(localStorage.getItem('taskData'));
    taskData = taskData.filter(task => task.id !== taskId);
    localStorage.setItem('taskData', JSON.stringify(taskData));
    
    loadAdminTaskList();
}

// Staff functions
function handleStaffLogin() {
    const nameInput = document.getElementById('staff-login-name');
    const pinInput = document.getElementById('staff-login-pin');
    const errorElement = document.getElementById('staff-login-error');
    
    const staffData = JSON.parse(localStorage.getItem('staffData'));
    const staff = staffData.find(s => s.name.toLowerCase() === nameInput.value.toLowerCase() && s.pin === pinInput.value);
    
    if (staff) {
        document.getElementById('staff-login-section').style.display = 'none';
        document.getElementById('staff-dashboard').style.display = 'block';
        
        // Set greeting with staff name
        document.getElementById('staff-greeting').textContent = `Welcome ${staff.name}`;
        
        // Store current staff in session
        sessionStorage.setItem('currentStaff', JSON.stringify(staff));
        
        loadStaffTasks(staff.id);
    } else {
        errorElement.textContent = 'Invalid name or PIN. Please try again.';
        nameInput.value = '';
        pinInput.value = '';
    }
}

function loadStaffTasks(staffId) {
    const taskListElement = document.getElementById('staff-task-list');
    const historyListElement = document.getElementById('task-history');
    const taskData = JSON.parse(localStorage.getItem('taskData'));
    
    // Filter tasks for this staff member (not completed)
    const staffTasks = taskData.filter(task => task.staffId === staffId && task.status !== 'completed');
    
    // Get all tasks for this staff member for history
    const allStaffTasks = taskData.filter(task => task.staffId === staffId);
    
    taskListElement.innerHTML = '';
    historyListElement.innerHTML = '';
    
    // Current tasks
    staffTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.innerHTML = `
            <div>
                <p>${task.description}</p>
                <span class="task-status status-${task.status.replace(' ', '-')}">${task.status}</span>
            </div>
            <div class="task-card-actions">
                <select class="status-select" data-id="${task.id}">
                    <option value="not started" ${task.status === 'not started' ? 'selected' : ''}>Not Started</option>
                    <option value="ongoing" ${task.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        `;
        taskListElement.appendChild(taskCard);
    });
    
    // Add event listeners to status selectors
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const taskId = e.target.getAttribute('data-id');
            updateTaskStatus(taskId, e.target.value);
        });
    });
    
    // Task history
    allStaffTasks.forEach(task => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        let historyHTML = `<strong>${task.description}</strong><br>`;
        historyHTML += `<span class="task-status status-${task.status.replace(' ', '-')}">${task.status}</span><br>`;
        
        if (task.history && task.history.length > 0) {
            historyHTML += '<div class="history-updates"><small>Updates:</small><ul>';
            task.history.forEach(update => {
                historyHTML += `<li>${new Date(update.timestamp).toLocaleString()}: Changed to ${update.newStatus}</li>`;
            });
            historyHTML += '</ul></div>';
        }
        
        historyItem.innerHTML = historyHTML;
        historyListElement.appendChild(historyItem);
    });
}

function updateTaskStatus(taskId, newStatus) {
    let taskData = JSON.parse(localStorage.getItem('taskData'));
    const taskIndex = taskData.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        // Add to history
        const historyUpdate = {
            newStatus,
            timestamp: new Date().toISOString()
        };
        
        if (!taskData[taskIndex].history) {
            taskData[taskIndex].history = [];
        }
        
        taskData[taskIndex].history.push(historyUpdate);
        taskData[taskIndex].status = newStatus;
        
        localStorage.setItem('taskData', JSON.stringify(taskData));
        
        // Reload tasks
        const currentStaff = JSON.parse(sessionStorage.getItem('currentStaff'));
        loadStaffTasks(currentStaff.id);
        
        // If task is completed, remove it from the list after a delay
        if (newStatus === 'completed') {
            setTimeout(() => {
                loadStaffTasks(currentStaff.id);
            }, 1000);
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDataFiles();
    const currentPage = getCurrentPage();
    
    if (currentPage === 'index.html' || currentPage === '') {
        // Role selection page
        document.getElementById('admin-btn').addEventListener('click', () => {
            navigateTo('admin.html');
        });
        
        document.getElementById('staff-btn').addEventListener('click', () => {
            navigateTo('staff.html');
        });
    } else if (currentPage === 'admin.html') {
        // Admin page
        document.getElementById('admin-dashboard').style.display = 'none';
        
        document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
        document.getElementById('admin-pin').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdminLogin();
        });
        
        document.getElementById('add-staff-btn').addEventListener('click', addStaff);
        document.getElementById('assign-task-btn').addEventListener('click', assignTask);
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            navigateTo('index.html');
        });
    } else if (currentPage === 'staff.html') {
        // Staff page
        document.getElementById('staff-dashboard').style.display = 'none';
        
        document.getElementById('staff-login-btn').addEventListener('click', handleStaffLogin);
        document.getElementById('staff-login-pin').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleStaffLogin();
        });
        
        document.getElementById('staff-logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('currentStaff');
            navigateTo('index.html');
        });
    }
});