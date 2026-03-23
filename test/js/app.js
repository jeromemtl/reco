/* -------------------- APP INIT -------------------- */

(function initApp() {
    console.log("🚀 Démarrage de l'application...");
    
    const saveBtnTop = document.getElementById("saveBtnTop");
    const saveAllBtnTop = document.getElementById("saveAllBtnTop");
    const resetBtnTop = document.getElementById("resetBtnTop");
    const note = document.getElementById("note");
    
    // Attendre que Auth soit initialisé avant de charger l'état
    // L'état sera chargé après connexion

    // Fonctions d'export avec confirmation
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

    // Raccourcis clavier
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

    // Sauvegarde avant fermeture
    window.addEventListener("beforeunload", () => {
        if (AppState.currentTab !== null) {
            AppState.files[AppState.currentTab] = note.value;
            Storage.saveState();
        }
    });

    // Sauvegarde périodique (toutes les 30s)
    setInterval(() => {
        if (AppState.currentTab !== null && !AppState.isRestoring) {
            AppState.files[AppState.currentTab] = note.value;
            Storage.saveState();
        }
    }, 30000);

    // Détection mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
        if (!localStorage.getItem('textareaFontSize')) {
            note.style.fontSize = '24px';
            const fontSizeSelect = document.getElementById('fontSizeSelect');
            if (fontSizeSelect) fontSizeSelect.value = '24';
        }
    }

    // Initialisation des événements (après chargement)
    if (saveBtnTop) saveBtnTop.addEventListener("click", saveFile);
    if (saveAllBtnTop) saveAllBtnTop.addEventListener("click", saveAllTabs);
    if (resetBtnTop) resetBtnTop.addEventListener("click", Tabs.resetAllTabs);
    document.addEventListener("keydown", handleGlobalKeyDown);

    // Initialisation des modules
    console.log("📦 Initialisation des modules...");
    UI.init();
    Theme.init();
    
    // Note: Editor et Tabs seront initialisés après connexion
    // Ils sont appelés dans auth.js après login
    
    // Initialisation du scanner
    if (typeof CameraScanner !== 'undefined') {
        console.log("📷 Initialisation du CameraScanner");
        CameraScanner.init();
    } else {
        console.error("❌ CameraScanner non trouvé");
    }

    // Fin de la restauration (sera mis à jour après login)
    AppState.isRestoring = false;
    
    console.log("✅ Application prête en attente de connexion");
})();