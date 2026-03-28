/* -------------------- MODE NUIT / THÈME -------------------- */

const Theme = (() => {
    const themeBtn = document.getElementById("themeBtnTop");
    const themeBtnMobile = document.getElementById("themeBtnTopMobile");

    // Détecter le thème du système
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme() {
        // Priorité : thème stocké, sinon thème système
        let mode = Storage.loadTheme();
        if (!mode) {
            mode = getSystemTheme();
            Storage.saveTheme(mode);
        }
        
        if (mode === "dark") {
            document.body.classList.add("dark");
            if (themeBtn) themeBtn.textContent = "☀️";
            if (themeBtnMobile && themeBtnMobile.querySelector('.btn-icon')) {
                themeBtnMobile.querySelector('.btn-icon').textContent = "☀️";
            }
        } else {
            document.body.classList.remove("dark");
            if (themeBtn) themeBtn.textContent = "🌙";
            if (themeBtnMobile && themeBtnMobile.querySelector('.btn-icon')) {
                themeBtnMobile.querySelector('.btn-icon').textContent = "🌙";
            }
        }
    }

    function toggleTheme() {
        const current = Storage.loadTheme() || getSystemTheme();
        const next = current === "light" ? "dark" : "light";
        Storage.saveTheme(next);
        applyTheme();
    }

    // Écouter les changements de thème système
    function watchSystemTheme() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.addEventListener('change', (e) => {
            // Ne changer que si l'utilisateur n'a pas forcé un thème
            if (!localStorage.getItem('cdiTheme')) {
                applyTheme();
            }
        });
    }

    function init() {
        applyTheme();
        watchSystemTheme();
        if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
        if (themeBtnMobile) themeBtnMobile.addEventListener("click", toggleTheme);
    }

    return {
        init,
        applyTheme
    };
})();