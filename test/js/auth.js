/* -------------------- AUTHENTIFICATION UAI -------------------- */

const Auth = (() => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const uaiInput = document.getElementById('uaiInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const currentUAIBadge = document.getElementById('currentUAI');
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnMobile');
    
    let currentUAI = null;
    
    // Récupérer l'UAI stocké
    function getStoredUAI() {
        return localStorage.getItem('reco_uai');
    }
    
    // Stocker l'UAI
    function storeUAI(uai) {
        localStorage.setItem('reco_uai', uai.toUpperCase());
    }
    
    // Effacer l'UAI stocké
    function clearStoredUAI() {
        localStorage.removeItem('reco_uai');
    }
    
    // Valider le format UAI (8 ou 9 caractères, lettres et chiffres)
    function validateUAI(uai) {
        const cleaned = uai.trim().toUpperCase();
        // Format UAI: généralement 8 ou 9 caractères alphanumériques
        const regex = /^[A-Z0-9]{7,9}$/;
        return regex.test(cleaned);
    }
    
    // Afficher une erreur
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
    
    // Connexion réussie
    async function onLoginSuccess(uai) {
        currentUAI = uai;
        storeUAI(uai);
        
        // Mettre à jour l'affichage
        if (currentUAIBadge) {
            currentUAIBadge.textContent = uai;
        }
        
        // Cacher l'écran de login, afficher l'appli
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Initialiser la synchronisation
        if (window.Sync && typeof window.Sync.initSync === 'function') {
            const synced = await window.Sync.initSync(uai, {
                onTabsUpdate: (files, changes) => {
                    if (window.Tabs && typeof window.Tabs.onRemoteUpdate === 'function') {
                        window.Tabs.onRemoteUpdate(files, changes);
                    }
                },
                onOrderUpdate: (order) => {
                    if (window.Tabs && typeof window.Tabs.onOrderUpdate === 'function') {
                        window.Tabs.onOrderUpdate(order);
                    }
                },
                onCurrentTabUpdate: (currentTab) => {
                    if (window.Tabs && typeof window.Tabs.onCurrentTabUpdate === 'function') {
                        window.Tabs.onCurrentTabUpdate(currentTab);
                    }
                }
            });
            
            if (!synced) {
                Sync.updateStatus('offline', 'Mode hors ligne');
            }
        }
        
        // Charger les données locales si pas de synchro
        if (window.Storage && typeof window.Storage.loadFromLocal === 'function') {
            window.Storage.loadFromLocal();
        }
    }
    
    // Déconnexion
    function logout() {
        if (confirm('Voulez-vous changer d\'établissement ?\nLes données resteront sauvegardées pour cet UAI.')) {
            // Déconnecter la synchro
            if (window.Sync && typeof window.Sync.disconnect === 'function') {
                window.Sync.disconnect();
            }
            
            // Effacer l'UAI stocké
            clearStoredUAI();
            
            // Réinitialiser l'état de l'application
            if (window.AppState) {
                window.AppState.files = {};
                window.AppState.tabOrder = [];
                window.AppState.currentTab = null;
            }
            
            // Revenir à l'écran de login
            mainApp.style.display = 'none';
            loginScreen.style.display = 'flex';
            
            // Effacer l'input
            if (uaiInput) uaiInput.value = '';
            
            // Réinitialiser le textarea
            const note = document.getElementById('note');
            if (note) note.value = '';
            
            // Recharger la page pour un état propre
            // window.location.reload();
        }
    }
    
    // Tentative de connexion
    async function attemptLogin() {
        const uai = uaiInput.value.trim().toUpperCase();
        
        if (!uai) {
            showError('Veuillez saisir un code UAI');
            return;
        }
        
        if (!validateUAI(uai)) {
            showError('Format UAI invalide (7-9 caractères alphanumériques)');
            return;
        }
        
        // Désactiver le bouton le temps de la connexion
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';
        
        try {
            await onLoginSuccess(uai);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            showError('Erreur de connexion à Firebase');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Accéder';
        }
    }
    
    // Vérifier si déjà connecté
    function checkExistingLogin() {
        const stored = getStoredUAI();
        if (stored && validateUAI(stored)) {
            // Auto-connexion
            uaiInput.value = stored;
            attemptLogin();
        }
    }
    
    // Initialisation
    function init() {
        if (loginBtn) {
            loginBtn.addEventListener('click', attemptLogin);
        }
        
        if (uaiInput) {
            uaiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    attemptLogin();
                }
            });
        }
        
        // Boutons de déconnexion
        logoutBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', logout);
            }
        });
        
        // Vérifier s'il y a une session existante
        checkExistingLogin();
    }
    
    return {
        init,
        logout,
        getCurrentUAI: () => currentUAI
    };
})();

// Initialisation au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}