/* -------------------- AUTHENTIFICATION UAI -------------------- */

const Auth = (() => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const uaiInput = document.getElementById('uaiInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const currentUAIBadge = document.getElementById('currentUAI');
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnMobile');
    const modeIndicatorIcon = document.getElementById('modeIcon');
    const modeIndicatorText = document.getElementById('modeText');
    
    let currentUAI = null;
    let currentMode = null;
    let tabsDisplayed = false;
    let dataLoaded = false;
    let loadedUAI = null;
    let pendingModeSwitch = null;
    
    function getStoredUAI() {
        return localStorage.getItem('reco_uai');
    }
    
    function getStoredMode() {
        return localStorage.getItem('reco_mode');
    }
    
    function storeUAI(uai) {
        if (uai) localStorage.setItem('reco_uai', uai.toUpperCase());
        else localStorage.removeItem('reco_uai');
    }
    
    function storeMode(mode) {
        localStorage.setItem('reco_mode', mode);
        currentMode = mode;
        
        // Mettre à jour l'indicateur dans le footer
        if (modeIndicatorIcon && modeIndicatorText) {
            if (mode === 'solo') {
                modeIndicatorIcon.textContent = '👤';
                modeIndicatorText.textContent = 'Solo';
            } else {
                modeIndicatorIcon.textContent = '👥';
                modeIndicatorText.textContent = 'Collaboratif';
            }
        }
    }
    
    function clearStoredUAI() {
        localStorage.removeItem('reco_uai');
        localStorage.removeItem('reco_mode');
    }
    
    function validateUAI(uai) {
        const cleaned = uai.trim().toUpperCase();
        const regex = /^[0-9]{7}[A-Z]$/;
        return regex.test(cleaned);
    }
    
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
    
    function getLocalLinesCount() {
        let total = 0;
        for (const content of Object.values(AppState.files)) {
            if (content) {
                total += content.split('\n').filter(l => l.trim()).length;
            }
        }
        return total;
    }
    
    async function sendStatsToFirestore(uai, mode) {
        if (!window.db || !navigator.onLine) return;
        
        try {
            const statsRef = window.db.collection('etablissements')
                .doc(uai)
                .collection('stats')
                .doc('info');
            
            await statsRef.set({
                mode: mode,
                firstSeen: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            debugLog(`📊 Stats enregistrées pour ${uai} (mode ${mode})`);
        } catch (error) {
            debugLog('Erreur envoi stats:', error);
        }
    }
    
    async function loadDataFromFirestore(uai) {
        if (dataLoaded && loadedUAI === uai) {
            debugLog('⚠️ Données déjà chargées pour', uai);
            return;
        }
        
        debugLog('📥 Chargement des données pour', uai);
        
        try {
            const tabsSnapshot = await window.db.collection('etablissements').doc(uai).collection('tabs').get();
            const orderDoc = await window.db.collection('etablissements').doc(uai).collection('metadata').doc('order').get();
            const currentDoc = await window.db.collection('etablissements').doc(uai).collection('metadata').doc('current').get();
            
            const files = {};
            tabsSnapshot.forEach(doc => {
                const data = doc.data();
                files[data.name] = data.content || '';
            });
            
            const order = orderDoc.exists ? orderDoc.data().order : Object.keys(files);
            const current = currentDoc.exists ? currentDoc.data().currentTab : (order.length > 0 ? order[0] : null);
            
            const hasExistingData = Object.keys(AppState.files).length > 0;
            const newDataEmpty = Object.keys(files).length === 0 || Object.values(files).every(c => c === '');
            
            if (hasExistingData && newDataEmpty) {
                debugLog('⚠️ Nouvelles données vides, conservation des données existantes');
                dataLoaded = true;
                loadedUAI = uai;
                return;
            }
            
            AppState.files = files;
            AppState.tabOrder = order;
            AppState.currentTab = current;
            
            if (window.Tabs && typeof window.Tabs.updateTabIndicators === 'function') {
                window.Tabs.updateTabIndicators();
            }
            
            dataLoaded = true;
            loadedUAI = uai;
            
            debugLog('✅ Données chargées:', order.length, 'onglets');
            
            const waitForTabs = () => {
                const tabsAvailable = (typeof Tabs !== 'undefined' && Tabs && typeof Tabs.renderTabs === 'function');
                
                if (tabsAvailable && !tabsDisplayed) {
                    debugLog('🎨 Affichage des onglets...');
                    Tabs.renderTabs();
                    
                    setTimeout(() => {
                        const note = document.getElementById('note');
                        if (current && note) {
                            const content = AppState.files[current] || '';
                            if (note.value !== content) {
                                note.value = content;
                            }
                            Tabs.switchTab(current);
                        } else if (order.length > 0 && note) {
                            Tabs.switchTab(order[0]);
                        }
                        if (window.Editor) {
                            window.Editor.updateLineCount();
                        }
                        if (window.Tabs && typeof window.Tabs.updateTabIndicators === 'function') {
                            window.Tabs.updateTabIndicators();
                        }
                    }, 50);
                    
                    tabsDisplayed = true;
                } else if (!tabsAvailable && !tabsDisplayed) {
                    setTimeout(waitForTabs, 100);
                }
            };
            
            waitForTabs();
            
        } catch (error) {
            console.error('❌ Erreur chargement Firestore:', error);
            debugLog('📦 Fallback: chargement depuis localStorage');
            Storage.loadFromLocal();
            dataLoaded = true;
            loadedUAI = uai;
        }
    }
    
    async function onLoginSuccess(uai, mode) {
        debugLog('🔐 Connexion réussie pour', uai, 'mode:', mode);
        currentUAI = uai;
        currentMode = mode;
        storeUAI(uai);
        storeMode(mode);
        
        if (currentUAIBadge) {
            currentUAIBadge.textContent = uai || 'Solo';
        }
        
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Envoyer les stats (une fois par UAI)
        if (uai) {
            await sendStatsToFirestore(uai, mode);
        }
        
        if (mode === 'collab' && uai && window.db) {
            // Mode collaboratif : charger depuis Firestore
            await loadDataFromFirestore(uai);
            
            // Initialiser Sync
            if (window.Sync && typeof window.Sync.initSync === 'function') {
                debugLog('🔄 Initialisation de Sync pour', uai);
                await window.Sync.initSync(uai, {
                    onTabsUpdate: (files) => {
                        if (window.Tabs) window.Tabs.onRemoteUpdate(files);
                        if (window.Tabs) window.Tabs.updateTabIndicators();
                    },
                    onOrderUpdate: (order) => {
                        if (window.Tabs) window.Tabs.onOrderUpdate(order);
                    },
                    onCurrentTabUpdate: (current) => {
                        if (window.Tabs) window.Tabs.onCurrentTabUpdate(current);
                    }
                });
            }
        } else {
            // Mode solo : charger depuis localStorage
            debugLog('📦 Mode solo, chargement depuis localStorage');
            Storage.loadFromLocal();
            
            // Désactiver Sync si actif
            if (window.Sync && typeof window.Sync.disconnect === 'function') {
                window.Sync.disconnect();
            }
        }
    }
    
    function logout() {
        const storedMode = getStoredMode();
        const storedUAI = getStoredUAI();
        const localLines = getLocalLinesCount();
        
        // Message de confirmation selon le mode actuel
        let message = 'Voulez-vous changer d\'établissement ?';
        
        if (storedMode === 'solo' && storedUAI) {
            message = `⚠️ Vous êtes actuellement en mode solo avec l'UAI ${storedUAI}.\n\n` +
                      `En vous reconnectant, vous pourrez choisir un autre mode.\n\n` +
                      `Voulez-vous continuer ?`;
        } else if (storedMode === 'collab' && storedUAI) {
            message = `⚠️ Vous êtes actuellement en mode collaboratif avec l'UAI ${storedUAI}.\n\n` +
                      `Vos données locales (${localLines} lignes) resteront disponibles.\n\n` +
                      `Voulez-vous continuer ?`;
        }
        
        if (confirm(message)) {
            if (window.Sync && typeof window.Sync.disconnect === 'function') {
                window.Sync.disconnect();
            }
            clearStoredUAI();
            
            AppState.files = {};
            AppState.tabOrder = [];
            AppState.currentTab = null;
            tabsDisplayed = false;
            dataLoaded = false;
            loadedUAI = null;
            currentUAI = null;
            currentMode = null;
            
            const note = document.getElementById('note');
            if (note) note.value = '';
            if (window.Tabs && typeof window.Tabs.renderTabs === 'function') {
                window.Tabs.renderTabs();
            }
            if (window.Editor && typeof window.Editor.updateLineCount === 'function') {
                window.Editor.updateLineCount();
            }
            if (window.Tabs && typeof window.Tabs.updateTabIndicators === 'function') {
                window.Tabs.updateTabIndicators();
            }
            
            mainApp.style.display = 'none';
            loginScreen.style.display = 'flex';
            if (uaiInput) uaiInput.value = '';
            
            // Réinitialiser le choix du mode
            const modeCollab = document.getElementById('modeCollab');
            const modeSolo = document.getElementById('modeSolo');
            if (modeCollab) modeCollab.checked = true;
        }
    }
    
    async function attemptLogin() {
        const mode = document.querySelector('input[name="mode"]:checked')?.value;
        let uai = uaiInput.value.trim().toUpperCase();
        
        if (!mode) {
            showError('Veuillez choisir un mode d\'utilisation');
            return;
        }
        
        if (mode === 'collab') {
            if (!uai) {
                showError('Code UAI requis pour le mode collaboratif');
                return;
            }
            if (!validateUAI(uai)) {
                showError('Format UAI invalide (7 chiffres + 1 lettre, ex: 9740066D)');
                return;
            }
        } else {
            // Mode solo : si pas d'UAI, utiliser un placeholder pour les stats
            if (!uai) {
                uai = null;
            } else if (!validateUAI(uai)) {
                showError('Format UAI invalide (7 chiffres + 1 lettre, ex: 9740066D)');
                return;
            }
        }
        
        const storedMode = getStoredMode();
        const storedUAI = getStoredUAI();
        
        // Vérifier si on change de mode
        if (storedMode && storedMode !== mode) {
            // Afficher la modale de confirmation
            if (window.showModeSwitchModal) {
                window.showModeSwitchModal(mode, uai);
                return;
            }
        }
        
        // Pas de changement de mode ou confirmation déjà donnée
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';
        
        try {
            await onLoginSuccess(uai, mode);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            showError('Erreur de connexion');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Accéder';
        }
    }
    
    async function checkExistingLogin() {
        const storedUAI = getStoredUAI();
        const storedMode = getStoredMode();
        debugLog('🔍 Vérification session existante:', storedUAI, storedMode);
        
        if (storedUAI && storedMode) {
            debugLog('🔄 Session trouvée, reconnexion pour', storedUAI);
            uaiInput.value = storedUAI;
            
            // Mettre à jour le mode dans l'interface
            const modeRadio = document.getElementById(storedMode === 'collab' ? 'modeCollab' : 'modeSolo');
            if (modeRadio) modeRadio.checked = true;
            
            await onLoginSuccess(storedUAI, storedMode);
            return true;
        }
        return false;
    }
    
    function getCurrentMode() {
        return currentMode;
    }
    
    function init() {
        debugLog('🔐 Initialisation du module Auth');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', attemptLogin);
        }
        
        if (uaiInput) {
            uaiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        }
        
        logoutBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', logout);
        });
        
        checkExistingLogin();
    }
    
    return {
        init,
        logout,
        getCurrentUAI: () => currentUAI,
        getCurrentMode: getCurrentMode
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}