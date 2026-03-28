/* -------------------- ÉDITEUR / TEXTAREA -------------------- */

window.Editor = null;

const Editor = (() => {
    const note = document.getElementById("note");
    const lineCountEl = document.getElementById("lineCount");
    const fontSizeSelect = document.getElementById("fontSizeSelect");
    
    let saveTimeout = null;

    function updateLineCount() {
        if (!note || !lineCountEl) return;
        const lines = note.value.split("\n").filter(l => l.trim() !== "").length;
        lineCountEl.textContent = lines + (lines <= 1 ? " ligne" : " lignes");
    }

    function updatePointVert() {
        if (window.Tabs) {
            // Petit délai pour s'assurer que le DOM est à jour
            setTimeout(() => {
                window.Tabs.updateTabIndicators();
            }, 10);
        }
    }

    function saveToLocal() {
        if (AppState.isRestoring) return;
        if (!AppState.currentTab) return;

        AppState.files[AppState.currentTab] = note.value;
        
        localStorage.setItem('cdiFiles', JSON.stringify(AppState.files));
        localStorage.setItem('cdiTabOrder', JSON.stringify(AppState.tabOrder));
        localStorage.setItem('cdiCurrentTab', AppState.currentTab);
        
        // Mettre à jour le point vert
        updatePointVert();
    }

    function saveToCloud() {
        if (AppState.isRestoring) return;
        if (!AppState.currentTab) return;

        AppState.files[AppState.currentTab] = note.value;
        
        localStorage.setItem('cdiFiles', JSON.stringify(AppState.files));
        localStorage.setItem('cdiTabOrder', JSON.stringify(AppState.tabOrder));
        localStorage.setItem('cdiCurrentTab', AppState.currentTab);
        
        Storage.saveState();
        
        // Mettre à jour le point vert
        updatePointVert();
    }

    function debouncedLocalSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveToLocal();
        }, 300);
    }

    function handleInput() {
        updateLineCount();
        updatePointVert();  // IMMÉDIAT - point vert apparaît dès la première frappe
        debouncedLocalSave();  // Sauvegarde locale différée
    }

    function handleKeydown(e) {
        if (e.key === "Enter") {
            // Sauvegarde cloud immédiate
            setTimeout(() => {
                saveToCloud();
            }, 0);
        } else if (e.key === "Tab") {
            e.preventDefault();
            const start = note.selectionStart;
            const end = note.selectionEnd;
            note.value = note.value.substring(0, start) + "\n" + note.value.substring(end);
            note.selectionStart = note.selectionEnd = start + 1;
            updateLineCount();
            saveToCloud();
        } else if (e.key === "Backspace") {
            // Laisser le comportement par défaut, puis mettre à jour
            setTimeout(() => {
                updateLineCount();
                updatePointVert();  // Point vert mis à jour après suppression
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
        debugLog('✅ Editor initialisé');
        note.focus();
        
        note.addEventListener("input", handleInput);
        note.addEventListener("keydown", handleKeydown);

        initFontSize();
        
        setTimeout(() => {
            updateLineCount();
            updatePointVert();
        }, 100);
    }

    function forceCloudSave() {
        saveToCloud();
    }

    const publicAPI = {
        init: init,
        updateLineCount: updateLineCount,
        forceCloudSave: forceCloudSave
    };
    
    window.Editor = publicAPI;
    return publicAPI;
})();