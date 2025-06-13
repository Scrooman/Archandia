document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.href = '/register';
        });
    }

    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.querySelector('.login-form');
    const passwordGroup = document.querySelector('.login-form-group input[type="password"]').parentElement;

    // Dodaj kontener na komunikat błędu pod polem password, jeśli nie istnieje
    let errorMsg = document.getElementById('login-error-msg');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'login-error-msg';
        errorMsg.style.color = '#ff6666';
        errorMsg.style.marginTop = '6px';
        errorMsg.style.fontSize = '0.95em';
        passwordGroup.parentElement.insertBefore(errorMsg, passwordGroup.nextSibling);
    }

    // Funkcja do wyświetlania popupa z loaderem
    function showLoginSuccessPopup(message) {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 9999;

        // Popup
        const popup = document.createElement('div');
        popup.style.background = '#18181c';
        popup.style.border = '2px solid #333';
        popup.style.borderRadius = '8px';
        popup.style.padding = '32px 36px 24px 36px';
        popup.style.boxShadow = '0 0 18px #000';
        popup.style.textAlign = 'center';
        popup.style.color = '#fff';
        popup.style.minWidth = '300px';

        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.marginBottom = '22px';
        msg.style.fontSize = '1.1em';

        // Loader
        const loader = document.createElement('div');
        loader.style.display = 'flex';
        loader.style.justifyContent = 'center';
        loader.style.gap = '18px';
        loader.style.marginBottom = '8px';

        // Dwa wirujące obrazki z losowym numerem od 1 do 4 w nazwie pliku
        for (let i = 0; i < 2; i++) {
            const img = document.createElement('img');
            const randomNum = Math.floor(Math.random() * 4) + 1; // losuje 1-4
            img.src = `/static/images/loader_icon${randomNum}.png`; // Ustaw ścieżkę do swojej ikonki loadera
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.animation = `spin 2s linear`;
            img.style.animationIterationCount = '1';
            loader.appendChild(img);
        }

        // Dodaj animację CSS do <head> jeśli nie istnieje
        if (!document.getElementById('login-spin-style')) {
            const style = document.createElement('style');
            style.id = 'login-spin-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                }
            `;
            document.head.appendChild(style);
        }

        popup.appendChild(msg);
        popup.appendChild(loader);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        setTimeout(() => {
            document.body.removeChild(overlay);
            window.location.href = '/index';
        }, 2000);
    }

    if (loginBtn && loginForm) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const login = document.getElementById('userId')?.value.trim() || document.getElementById('login')?.value.trim();
            const password = document.getElementById('password').value;

            if (!login || !password) {
                errorMsg.textContent = 'Both fields are required.';
                return;
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login, password })
                });

                const result = await response.json();

                if (response.ok) {
                    showLoginSuccessPopup('Login successful');
                } else {
                    errorMsg.textContent = result.error || 'Login failed.';
                }
            } catch (err) {
                errorMsg.textContent = 'Server error. Please try again later.';
            }
        });
    }
});