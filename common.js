// Common functionality for all dashboard pages

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuthentication();
    
    // Initialize dashboard
    initializeDashboard();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('jwt_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token || !userRole) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return false;
    }
    
    // Display username
    const username = localStorage.getItem('username') || 'User';
    const usernameElement = document.getElementById('loggedInUsername');
    if (usernameElement) {
        usernameElement.textContent = username;
    }
    
    return true;
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
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear authentication data
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('username');
            
            // Redirect to role selection page
            window.location.href = 'index.html';
        });
    }
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

