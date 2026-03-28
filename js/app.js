/* -------------------- APP INIT -------------------- */

(function initApp() {
    debugLog("🚀 Démarrage de l'application...");
    
    const saveBtnTop = document.getElementById("saveBtnTop");
    const saveAllBtnTop = document.getElementById("saveAllBtnTop");
    const resetBtnTop = document.getElementById("resetBtnTop");
    const note = document.getElementById("note");
    
    // Variable pour éviter les sauvegardes inutiles
    let lastSavedContent = '';
    let lastSavedTab = null;
    
    const saveFile = () => {
        if (!AppState.currentTab) {
            alert("Aucun onglet sélectionné");
            return;
        }
        
        if (!confirm(`Exporter l'onglet "${AppState.currentTab}" ?`)) {
            return;
        }
        
        AppState.files[AppState.currentTab] = note.value;
        const filename = `${AppState.currentTab}--${Storage.formattedDateTime()}.txt`;
        Storage.exportTxt(filename, AppState.files[AppState.currentTab]);
    };

    const saveAllTabs = () => {
        if (AppState.currentTab !== null) {
            AppState.files[AppState.currentTab] = note.value;
        }
        
        const nonEmptyTabs = AppState.tabOrder.filter(name => {
            const content = AppState.files[name] || "";
            return content.trim().length > 0;
        });
        
        if (nonEmptyTabs.length === 0) {
            alert("Aucun onglet avec contenu à exporter");
            return;
        }
        
        if (!confirm(`Exporter ${nonEmptyTabs.length} onglet(s) ?`)) {
            return;
        }

        for (const name of AppState.tabOrder) {
            const content = AppState.files[name] || "";
            if (content.trim().length === 0) continue;
            const filename = `${name}--${Storage.formattedDateTime()}.txt`;
            Storage.exportTxt(filename, content);
        }
    };

    const handleGlobalKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveFile();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            saveAllTabs();
        }
        
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            if (typeof CameraScanner !== 'undefined' && CameraScanner.isScanning) {
                CameraScanner.stopScanner();
            }
        }
    };

    window.addEventListener("beforeunload", () => {
        if (AppState.currentTab !== null) {
            AppState.files[AppState.currentTab] = note.value;
            Storage.saveState();
        }
    });

    // Sauvegarde périodique avec vérification de changement
    setInterval(() => {
        if (AppState.currentTab !== null && !AppState.isRestoring) {
            const currentContent = note.value;
            
            if (currentContent.trim() !== lastSavedContent.trim() || AppState.currentTab !== lastSavedTab) {
                lastSavedContent = currentContent;
                lastSavedTab = AppState.currentTab;
                AppState.files[AppState.currentTab] = currentContent;
                Storage.saveState();
            }
        }
    }, 30000);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
        if (!localStorage.getItem('textareaFontSize')) {
            note.style.fontSize = '24px';
            const fontSizeSelect = document.getElementById('fontSizeSelect');
            if (fontSizeSelect) fontSizeSelect.value = '24';
        }
    }

    if (saveBtnTop) saveBtnTop.addEventListener("click", saveFile);
    if (saveAllBtnTop) saveAllBtnTop.addEventListener("click", saveAllTabs);
    if (resetBtnTop) resetBtnTop.addEventListener("click", Tabs.resetAllTabs);
    document.addEventListener("keydown", handleGlobalKeyDown);

    UI.init();
    Theme.init();

    if (typeof Editor !== 'undefined' && Editor.init) {
        debugLog('📝 Appel de Editor.init() depuis app.js');
        Editor.init();
    } else {
        console.error('❌ Editor non trouvé');
    }
    
    // Initialiser le scanner IMMÉDIATEMENT (pas après connexion)
    if (typeof CameraScanner !== 'undefined') {
        debugLog("📷 Initialisation du CameraScanner");
        CameraScanner.init();
    } else {
        console.error("❌ CameraScanner non trouvé");
    }

    AppState.isRestoring = false;
    
    debugLog("✅ Application prête en attente de connexion");
})();