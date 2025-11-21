// Common functionality for all dashboard pages

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;
    initializeDashboard();
    initSocketIO();
});

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const headers = options.headers || {};

    if (!(options && options.skipAuth)) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!headers['Content-Type'] && !(options && options.formData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || 'Request failed');
        }

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
        }
        throw error;
    }
}

// Make apiFetch available globally
window.apiFetch = apiFetch;

function handleUnauthorized() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

// Check if user is authenticated
async function checkAuthentication() {
    const token = localStorage.getItem('jwt_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token || !userRole) {
        // Redirect to login if not authenticated
        handleUnauthorized();
        return false;
    }

    try {
        const data = await apiFetch('/auth/me');
        const user = data.user;
        if (user) {
            localStorage.setItem('username', user.name);
            localStorage.setItem('user_role', user.role);
            window.currentUser = user;
            const usernameElement = document.getElementById('loggedInUsername');
            if (usernameElement) {
                usernameElement.textContent = user.name;
            }
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        handleUnauthorized();
        return false;
    }
}

// Initialize dashboard features
function initializeDashboard() {
    // Setup hamburger menu
    setupHamburgerMenu();
    
    // Setup navigation links
    setupNavigation();
    
    // Setup logout button
    setupLogout();
}

// Hamburger menu toggle for mobile
function setupHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    if (hamburgerMenu && sidebar) {
        hamburgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (dashboardContainer) {
                dashboardContainer.classList.toggle('sidebar-open');
            }
        });
    }
}

// Navigation section switching
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
                
                // Update active nav link
                navLinks.forEach(nl => nl.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

// Show a specific section and hide others
function showSection(sectionName) {
    // Hide all sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    
    // Show the requested section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
    }
    
    // Close sidebar on mobile after navigation
    const sidebar = document.getElementById('sidebar');
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (window.innerWidth <= 768 && sidebar && dashboardContainer) {
        sidebar.classList.remove('active');
        dashboardContainer.classList.remove('sidebar-open');
    }
}

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const profileLogout = document.getElementById('profileLogout');
    
    // Sidebar logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performLogout();
        });
    }
    
    // Profile dropdown logout
    if (profileLogout) {
        profileLogout.addEventListener('click', (e) => {
            e.preventDefault();
            performLogout();
        });
    }
}

function performLogout() {
    // Clear authentication data
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    
    // Redirect to role selection page
    window.location.href = 'index.html';
}

// Toast notification function
function showToast(message, type = 'info') {
    const container = document.getElementById('toastNotifications');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    
    // Add type-specific styling if needed
    if (type === 'success') {
        toast.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    } else if (type === 'error') {
        toast.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
    } else if (type === 'warning') {
        toast.style.backgroundColor = 'rgba(255, 193, 7, 0.9)';
    }
    
    container.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Make showSection available globally for onclick handlers
window.showSection = showSection;

// Safe Socket.IO initialization
function initSocketIO() {
    if (typeof io === 'undefined') {
        console.log('Socket.io not loaded, skipping real-time features');
        return;
    }

    try {
        const socket = io(API_BASE_URL, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 3,
            timeout: 5000
        });

        socket.on('connect_error', (error) => {
            console.log('Socket.io connection unavailable, using polling mode');
        });

        socket.on('connect', () => {
            console.log('Socket.io connected');
        });

        // Attempt to connect
        socket.connect();

        window.socket = socket;
    } catch (error) {
        console.log('Socket.io initialization skipped');
    }
}

