document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = (document.getElementById('username')?.value || '').trim();
    const email = (document.getElementById('email')?.value || '').trim();
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    if (!username || !email || !password || !confirmPassword) {
      if (typeof showAlert === 'function') showAlert('Please fill in all fields.', 'danger');
      return;
    }

    if (typeof isValidEmail === 'function' && !isValidEmail(email)) {
      if (typeof showAlert === 'function') showAlert('Please enter a valid email.', 'danger');
      return;
    }

    if (typeof validatePassword === 'function') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        if (typeof showAlert === 'function') showAlert(passwordError, 'danger');
        return;
      }
    }

    if (password !== confirmPassword) {
      if (typeof showAlert === 'function') showAlert('Passwords do not match.', 'danger');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
    }

    fetchMethod('/users/register', function (status, data) {
      if (status !== 200 && status !== 201) {
        console.error('Register error:', data);
        if (typeof showAlert === 'function') {
          showAlert((data && data.message) ? data.message : 'Registration failed.', 'danger');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        return;
      }

      // Expect { token, user_id, username, role }
      if (!data || !data.token) {
        if (typeof showAlert === 'function') showAlert('Registration succeeded but token missing.', 'warning');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        return;
      }

      localStorage.setItem('token', data.token);

      const userObj = {
        user_id: data.user_id,
        username: data.username,
        role: data.role
      };
      localStorage.setItem('user', JSON.stringify(userObj));

      if (typeof showAlert === 'function') showAlert('Registration successful!', 'success');

      // Go to home
      window.location.href = 'home.html';
    }, 'POST', { username: username, email: email, password: password });
  });

  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  function validatePasswords() {
    if (!passwordInput || !confirmInput) return;

    if (passwordInput.value && confirmInput.value) {
      if (passwordInput.value !== confirmInput.value) {
        confirmInput.classList.add('is-invalid');
        confirmInput.classList.remove('is-valid');
      } else {
        confirmInput.classList.remove('is-invalid');
        confirmInput.classList.add('is-valid');
      }
    } else {
      confirmInput.classList.remove('is-invalid', 'is-valid');
    }
  }

  if (passwordInput) passwordInput.addEventListener('input', validatePasswords);
  if (confirmInput) confirmInput.addEventListener('input', validatePasswords);
});
