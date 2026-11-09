const API_BASE_URL = 'http://localhost:3000/api';

function getCurrentUser(callback) {
    fetchMethod('/users/me', function (status, payload) {
        if (status >= 200 && status < 300 && payload) {
            callback(200, payload);
            return;
        }

        console.error('Error getting current user:', payload);

        callback(status || 500, payload || { message: 'Unable to get current user' });
    }, 'GET');
}

// ----------------------------
// Check if user is admin 
// ----------------------------
function isAdmin(callback) {
    getCurrentUser(function (status, userData) {
        if (status === 200 && userData && userData.role) {
            callback(userData.role === 'admin');
            return;
        }
        callback(false);
    });
}

// ----------------------------
// Format Number with commas
// ----------------------------
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ----------------------------
// Format Date
// ----------------------------
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// ----------------------------
// Show Alert Message
// ----------------------------
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// ----------------------------
// Load Character HP Bar
// ----------------------------
function loadCharacterHP(currentHP, maxHP) {
    const percentage = Math.round((currentHP / maxHP) * 100);
    const barColor = percentage > 70 ? 'bg-success' : percentage > 30 ? 'bg-warning' : 'bg-danger';

    return `
        <div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
                <small class="text-light">HP</small>
                <small class="text-light">${currentHP}/${maxHP}</small>
            </div>
            <div class="progress" style="height: 10px;">
                <div class="progress-bar ${barColor}"
                     role="progressbar"
                     style="width: ${percentage}%"
                     aria-valuenow="${currentHP}"
                     aria-valuemin="0"
                     aria-valuemax="${maxHP}">
                </div>
            </div>
        </div>
    `;
}

// ----------------------------
// Load XP Bar
// ----------------------------
function loadXPBar(currentXP, level) {
    const xpToNextLevel = level * 500;
    const percentage = Math.min(Math.round((currentXP / xpToNextLevel) * 100), 100);

    return `
        <div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
                <small class="text-light">XP</small>
                <small class="text-light">${currentXP}/${xpToNextLevel}</small>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-info"
                     role="progressbar"
                     style="width: ${percentage}%"
                     aria-valuenow="${currentXP}"
                     aria-valuemin="0"
                     aria-valuemax="${xpToNextLevel}">
                </div>
            </div>
        </div>
    `;
}

// ----------------------------
// Email Validation
// ----------------------------
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ----------------------------
// Password Validation
// ----------------------------
function validatePassword(password) {
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return null;
}

// ----------------------------
// Debounce Function
// ----------------------------
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
