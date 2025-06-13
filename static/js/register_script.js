document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const createBtn = document.getElementById('createBtn');
    const registerForm = document.querySelector('.register-form');
    const passwordGroup = document.querySelector('.register-form-group input[id="repeatPassword"]').parentElement;

    // Dodaj kontener na komunikat błędu pod polem password, jeśli nie istnieje
    let errorMsg = document.getElementById('register-error-msg');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'register-error-msg';
        errorMsg.style.color = '#ff6666';
        errorMsg.style.marginTop = '6px';
        errorMsg.style.fontSize = '0.95em';
        passwordGroup.parentElement.insertBefore(errorMsg, passwordGroup.nextSibling);
    }

    // Funkcja do wyświetlania pop-upa z loaderem
    function showSuccessPopup(message) {
        // Tworzenie tła popupa
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

        // Tworzenie okna popupa
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
            img.src = `/static/images/loader_icon${randomNum}.png`;
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
            window.location.href = '/login';
        }, 2000);
    }

    if (createBtn && registerForm) {
        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Pobierz dane z formularza
            const name = document.getElementById('name').value.trim();
            const login = document.getElementById('login').value.trim();
            const password = document.getElementById('password').value;
            const repeatPassword = document.getElementById('repeatPassword').value;

            // Prosta walidacja po stronie klienta
            if (!name || !login || !password || !repeatPassword) {
                errorMsg.textContent = 'All fields are required.';
                return;
            }
            if (password !== repeatPassword) {
                errorMsg.textContent = 'Passwords do not match.';
                return;
            }

            // Wyślij żądanie do /register
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, login, password })
                });

                const result = await response.json();

                if (response.ok) {
                    showSuccessPopup('User registered successfully! You can now log in.');
                } else {
                    errorMsg.textContent = result.error || 'Registration failed.';
                }
            } catch (err) {
                errorMsg.textContent = 'Server error. Please try again later.';
            }
        });
    }
});