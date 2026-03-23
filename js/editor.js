/* -------------------- ÉDITEUR / TEXTAREA -------------------- */

const Editor = (() => {
    const note = document.getElementById("note");
    const lineCountEl = document.getElementById("lineCount");
    const saveFeedback = document.getElementById("saveFeedback");
    const fontSizeSelect = document.getElementById("fontSizeSelect");

    /* -------------------- FEEDBACK VISUEL -------------------- */
    function showSaveFeedback() {
        saveFeedback.classList.add("visible");
        setTimeout(() => saveFeedback.classList.remove("visible"), 600);
    }

    /* -------------------- COMPTEUR DE LIGNES -------------------- */
    function updateLineCount() {
        const lines = note.value.split("\n").filter(l => l.trim() !== "").length;
        lineCountEl.textContent = lines + (lines <= 1 ? " ligne" : " lignes");
    }

    /* -------------------- AUTOSAVE -------------------- */
    function autoSave() {
        if (AppState.isRestoring) return;
        if (!AppState.currentTab) return;

        AppState.files[AppState.currentTab] = note.value;
        Storage.saveState();
        showSaveFeedback();
        Tabs.updateTabIndicators();
    }

    /* -------------------- ENTER = AUTOSAVE -------------------- */
    function handleEnter(e) {
        if (e.key === "Enter") {
            setTimeout(() => {
                updateLineCount();
                autoSave();
            }, 0);
        }
    }

    /* -------------------- TAB = RETOUR À LA LIGNE -------------------- */
    function handleTab(e) {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = note.selectionStart;
            const end = note.selectionEnd;
            note.value = note.value.substring(0, start) + "\n" + note.value.substring(end);
            note.selectionStart = note.selectionEnd = start + 1;
            updateLineCount();
            autoSave();
        }
    }

    /* -------------------- BACKSPACE = AUTOSAVE -------------------- */
    function handleBackspace(e) {
        if (e.key === "Backspace") {
            setTimeout(() => {
                updateLineCount();
                autoSave();
            }, 0);
        }
    }

    /* -------------------- TAILLE DU TEXTE -------------------- */
    function initFontSize() {
        const savedSize = Storage.loadFontSize();
        if (savedSize) {
            note.style.fontSize = savedSize + "px";
            fontSizeSelect.value = savedSize;
        }

        fontSizeSelect.addEventListener("change", () => {
            const size = fontSizeSelect.value;
            note.style.fontSize = size + "px";
            Storage.saveFontSize(size);
        });
    }

    /* -------------------- INITIALISATION -------------------- */
    function init() {
        note.focus();

        note.addEventListener("keydown", (e) => {
            handleEnter(e);
            handleTab(e);
            handleBackspace(e);
        });

        initFontSize();
        updateLineCount();
    }

    return {
        init,
        autoSave,
        updateLineCount
    };
})();