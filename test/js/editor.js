/* -------------------- ÉDITEUR / TEXTAREA -------------------- */

const Editor = (() => {
    const note = document.getElementById("note");
    const lineCountEl = document.getElementById("lineCount");
    const saveFeedback = document.getElementById("saveFeedback");
    const fontSizeSelect = document.getElementById("fontSizeSelect");

    function showSaveFeedback() {
        if (saveFeedback) {
            saveFeedback.classList.add("visible");
            setTimeout(() => saveFeedback.classList.remove("visible"), 600);
        }
    }

    function updateLineCount() {
        const lines = note.value.split("\n").filter(l => l.trim() !== "").length;
        lineCountEl.textContent = lines + (lines <= 1 ? " ligne" : " lignes");
    }

    function autoSave() {
        if (AppState.isRestoring) return;
        if (!AppState.currentTab) return;

        AppState.files[AppState.currentTab] = note.value;
        Storage.saveState();
        showSaveFeedback();
        if (window.Tabs) window.Tabs.updateTabIndicators();
    }

    function handleEnter(e) {
        if (e.key === "Enter") {
            setTimeout(() => {
                updateLineCount();
                autoSave();
            }, 0);
        }
    }

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

    function handleBackspace(e) {
        if (e.key === "Backspace") {
            setTimeout(() => {
                updateLineCount();
                autoSave();
            }, 0);
        }
    }

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

    function init() {
        note.focus();

        note.addEventListener("keydown", (e) => {
            handleEnter(e);
            handleTab(e);
            handleBackspace(e);
        });
        
        note.addEventListener("input", () => {
            updateLineCount();
            autoSave();
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