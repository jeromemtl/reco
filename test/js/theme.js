/* -------------------- MODE NUIT / THÈME -------------------- */

const Theme = (() => {
    const themeBtn = document.getElementById("themeBtnTop");
    const themeBtnMobile = document.getElementById("themeBtnTopMobile");

    function applyTheme() {
        const mode = Storage.loadTheme();
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
        const current = Storage.loadTheme();
        const next = current === "light" ? "dark" : "light";
        Storage.saveTheme(next);
        applyTheme();
    }

    function init() {
        applyTheme();
        if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
        if (themeBtnMobile) themeBtnMobile.addEventListener("click", toggleTheme);
    }

    return {
        init,
        applyTheme
    };
})();