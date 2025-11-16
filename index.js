document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;
        const role = roleSelect.value;

        // Basic validation
        if (!username || !password || !role) {
            showError('Please fill in all fields.');
            return;
        }

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

        // Redirect to respective dashboard
        window.location.href = `/${role}.html`;
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