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

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields.');
            return;
        }

        // Admin authentication - real validation required
        if (role === 'admin') {
            const adminUsername = 'yashvanthr';
            const adminPassword = 'yashu990@';
            
            if (username !== adminUsername || password !== adminPassword) {
                showError('Invalid Admin Credentials!');
                return;
            }
        }
        // Teacher and Student continue with dummy login (no validation)

        // Simulate login (replace with actual fetch to backend)
        console.log('Attempting login with:', { username, password, role });

        // Placeholder for fetch API
        // fetch('/api/login', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ username, password, role })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.success) {
        //         localStorage.setItem('jwt_token', data.token); // Store JWT
        //         localStorage.setItem('user_role', role);
        //         window.location.href = `/${role}.html`;
        //     } else {
        //         showError(data.message || 'Login failed. Invalid credentials.');
        //     }
        // })
        // .catch(error => {
        //     console.error('Login error:', error);
        //     showError('An error occurred during login. Please try again.');
        // });

        // --- SIMULATED SUCCESSFUL LOGIN FOR DEMO ---
        // In a real app, you'd get a token from the backend after successful auth
        const dummyToken = 'your_dummy_jwt_token_for_' + role;
        localStorage.setItem('jwt_token', dummyToken);
        localStorage.setItem('user_role', role); // Store the role
        localStorage.setItem('username', username); // Store username for display

        // Show loader
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="loader-spinner"></div>';
        document.body.appendChild(loader);

        // Redirect to respective dashboard after 0.7s
        setTimeout(() => {
            window.location.href = `${role}.html`;
        }, 700);
        // --- END SIMULATED LOGIN ---
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    }
});

