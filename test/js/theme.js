/* -------------------- MODE NUIT / THÈME -------------------- */

const Theme = (() => {
    const themeBtn = document.getElementById("themeBtnTop");

    function applyTheme() {
        const mode = Storage.loadTheme();
        if (mode === "dark") {
            document.body.classList.add("dark");
            themeBtn.textContent = "☀️";
            themeBtn.dataset.tooltip = "Mode clair";
        } else {
            document.body.classList.remove("dark");
            themeBtn.textContent = "🌙";
            themeBtn.dataset.tooltip = "Mode nuit";
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
        themeBtn.addEventListener("click", toggleTheme);
    }

    return {
        init,
        applyTheme
    };
})();