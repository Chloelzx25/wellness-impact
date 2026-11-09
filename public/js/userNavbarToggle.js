// Toggle navbar based on login status
function toggleNavbar() {
    const token = localStorage.getItem('token');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const dashboardButton = document.getElementById('dashboardButton');
    const logoutButton = document.getElementById('logoutButton');

    if (token) {
        // User is logged in
        if (loginButton) loginButton.classList.add('d-none');
        if (registerButton) registerButton.classList.add('d-none');
        if (dashboardButton) dashboardButton.classList.remove('d-none');
        if (logoutButton) logoutButton.classList.remove('d-none');

        // Load user info for dashboard link (callback-based)
        getCurrentUser(function (status, userData) {
            if (status === 200 && userData && dashboardButton) {
                dashboardButton.innerHTML = `
                    <img src="https://static.wikia.nocookie.net/gensin-impact/images/d/d4/Item_Primogem.png"
                         class="rounded-circle"
                         style="width: 25px; height: 25px; margin-right: 5px;">
                    ${userData.username}
                `;
            } else {
                console.error('Error loading user data:', userData);
            }
        });

    } else {
        // User is not logged in
        if (loginButton) loginButton.classList.remove('d-none');
        if (registerButton) registerButton.classList.remove('d-none');
        if (dashboardButton) dashboardButton.classList.add('d-none');
        if (logoutButton) logoutButton.classList.add('d-none');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Setup logout button + navbar toggle
document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }

    toggleNavbar();
});

// Export for use in other files (Node / tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleNavbar,
        logout
    };
}
