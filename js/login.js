const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const roleIndicator = document.getElementById('role-indicator');

    // Get role from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');

    // Validate role parameter
    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
        showError('Invalid role selected. Please go back and select a valid role.');
        return;
    }

    // Display role indicator
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
    roleIndicator.textContent = `Logging in as ${roleDisplay}`;
    roleIndicator.style.color = 'var(--primary-color)';
    roleIndicator.style.fontWeight = '600';
    roleIndicator.style.marginBottom = '20px';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields.');
            return;
        }

        try {
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            loginForm.classList.add('loading');

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            if (data.user.role !== role) {
                throw new Error(`You are registered as ${data.user.role}. Please login with the correct role.`);
            }

            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('username', data.user.name);

            // Show loader
            const loader = document.createElement('div');
            loader.className = 'page-loader';
            loader.innerHTML = '<div class="loader-spinner"></div>';
            document.body.appendChild(loader);

            setTimeout(() => {
                window.location.href = `${role}.html`;
            }, 700);
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Login failed. Please try again.');
        } finally {
            usernameInput.disabled = false;
            passwordInput.disabled = false;
            loginForm.classList.remove('loading');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    }
});

