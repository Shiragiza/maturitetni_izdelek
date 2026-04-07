const API_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    return response.json();
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

async function checkAuth() {
    try {
        const result = await apiRequest('/auth/me');
        return result.user || null;
    } catch (e) {
        return null;
    }
}

async function updateAuthUI(user) {
    const topbarAuth = document.querySelector('.topbar-auth');
    const authButtons = document.querySelector('.auth-buttons');

    if (!topbarAuth || !authButtons) return;

    if (user) {
        topbarAuth.innerHTML = `
      <span style="color: rgba(204, 155, 103, 0.733); margin-right: 10px;">${user.first_name}</span>
      ${user.role === 'admin' ? '<button class="register-btn" onclick="window.location.href=\'admin.html\'">Admin</button>' : ''}
      <button class="login-btn" onclick="logout()">Odjava</button>
    `;
        authButtons.innerHTML = `
      <span style="color: rgba(204, 155, 103, 0.733); margin-right: 10px;">${user.first_name}</span>
      <button class="login-btn" onclick="logout()">Odjava</button>
    `;
    } else {
        topbarAuth.innerHTML = `
      <button class="register-btn" onclick="window.location.href='registracija.html'">Registracija</button>
      <button class="login-btn" onclick="window.location.href='login.html'">Login</button>
    `;
        authButtons.innerHTML = `
      <button class="register-btn" onclick="window.location.href='registracija.html'">Registracija</button>
      <button class="login-btn" onclick="window.location.href='login.html'">Login</button>
    `;
    }
}

async function logout() {
    try {
        await apiRequest('/auth/logout', 'POST');
        window.location.href = 'začetna_stran.html';
    } catch (e) {
        showError('Napaka pri odjavi');
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const user = await checkAuth();
    await updateAuthUI(user);

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async(e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                showError('Gesli se ne ujemata!');
                return;
            }

            if (password.length < 6) {
                showError('Geslo mora imeti vsaj 6 znakov!');
                return;
            }

            const formData = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: password
            };

            try {
                const result = await apiRequest('/auth/register', 'POST', formData);
                if (result.error) {
                    showError(result.error);
                } else {
                    showSuccess('Registracija uspešna! Sedaj se lahko prijavite.');
                    window.location.href = 'login.html';
                }
            } catch (e) {
                showError('Napaka pri komunikaciji s strežnikom');
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async(e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const result = await apiRequest('/auth/login', 'POST', { email, password });
                console.log('Login result:', result);
                if (result.error) {
                    showError(result.error);
                } else {
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'posnetki.html';
                    }
                }
            } catch (e) {
                showError('Napaka pri komunikaciji s strežnikom');
            }
        });
    }

    const checkAccessBtn = document.getElementById('checkAccessBtn');
    if (checkAccessBtn) {
        checkAccessBtn.addEventListener('click', async() => {
            try {
                const result = await apiRequest('/api/check-access');
                if (result.hasAccess) {
                    window.location.href = 'posnetki.html';
                } else {
                    window.location.href = 'placilo.html';
                }
            } catch (e) {
                window.location.href = 'login.html';
            }
        });
    }
});