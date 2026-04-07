const API_URL = 'http://localhost:3000/api';

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotForm');
    const emailInput = document.getElementById('fp-email');
    const resetStep = document.getElementById('resetStep');
    const resetBtn = document.getElementById('resetBtn');

    const urlToken = getTokenFromUrl();
    
    if (urlToken) {
        form.style.display = 'none';
        resetStep.style.display = 'block';
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return alert('Prosimo vnesite email.');

        try {
            const response = await fetch(`${API_URL}/forgot-password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            
            if (result.error) {
                alert(result.error);
            } else {
                alert(result.message + '\nPreverite svojo email predalvo.');
            }
        } catch (err) {
            alert('Napaka pri komunikaciji s strežnikom');
        }
    });

    resetBtn?.addEventListener('click', async () => {
        const token = getTokenFromUrl();
        const p1 = document.getElementById('fp-pass').value;
        const p2 = document.getElementById('fp-pass2').value;
        
        if (!token) return alert('Manjka token.');
        if (!p1 || p1.length < 6) return alert('Geslo naj ima vsaj 6 znakov.');
        if (p1 !== p2) return alert('Gesli se ne ujemata.');

        try {
            const response = await fetch(`${API_URL}/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, newPassword: p1 })
            });
            const result = await response.json();
            
            if (result.error) {
                alert(result.error);
            } else {
                alert(result.message + '\nSedaj se lahko prijavite z novim geslom.');
                window.location.href = 'login.html';
            }
        } catch (err) {
            alert('Napaka pri komunikaciji s strežnikom');
        }
    });
});
