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
    
    function getStoredUAI() {
        return localStorage.getItem('reco_uai');
    }
    
    function storeUAI(uai) {
        localStorage.setItem('reco_uai', uai.toUpperCase());
    }
    
    function clearStoredUAI() {
        localStorage.removeItem('reco_uai');
    }
    
    function validateUAI(uai) {
        const cleaned = uai.trim().toUpperCase();
        const regex = /^[A-Z0-9]{7,9}$/;
        return regex.test(cleaned);
    }
    
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
    
    async function loadDataFromFirestore(uai) {
        console.log('📥 Chargement des données pour', uai);
        
        try {
            const tabsSnapshot = await window.db.collection('etablissements').doc(uai).collection('tabs').get();
            const orderDoc = await window.db.collection('etablissements').doc(uai).collection('metadata').doc('order').get();
            const currentDoc = await window.db.collection('etablissements').doc(uai).collection('metadata').doc('current').get();
            
            const files = {};
            tabsSnapshot.forEach(doc => {
                files[doc.id] = doc.data().content || '';
            });
            
            const order = orderDoc.exists ? orderDoc.data().order : Object.keys(files);
            const current = currentDoc.exists ? currentDoc.data().currentTab : (order.length > 0 ? order[0] : null);
            
            AppState.files = files;
            AppState.tabOrder = order;
            AppState.currentTab = current;
            
            console.log('✅ Données chargées:', order.length, 'onglets');
            
            // Attendre que Tabs soit prêt et afficher
            const displayTabs = () => {
                if (window.Tabs && typeof window.Tabs.renderTabs === 'function') {
                    console.log('🎨 Affichage des onglets...');
                    window.Tabs.renderTabs();
                    if (current) {
                        window.Tabs.switchTab(current);
                    } else if (order.length > 0) {
                        window.Tabs.switchTab(order[0]);
                    }
                } else {
                    console.log('⏳ Tabs pas encore prêt, nouvel essai...');
                    setTimeout(displayTabs, 100);
                }
            };
            
            displayTabs();
            
        } catch (error) {
            console.error('❌ Erreur chargement Firestore:', error);
        }
    }
    
    async function onLoginSuccess(uai) {
        console.log('🔐 Connexion réussie pour', uai);
        currentUAI = uai;
        storeUAI(uai);
        
        if (currentUAIBadge) {
            currentUAIBadge.textContent = uai;
        }
        
        // Afficher l'application
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
        
        // Charger les données depuis Firestore
        await loadDataFromFirestore(uai);
        
        // Initialiser la synchronisation en temps réel
        if (window.Sync && typeof window.Sync.initSync === 'function') {
            console.log('🔄 Initialisation de la synchronisation temps réel...');
            try {
                await window.Sync.initSync(uai, {
                    onTabsUpdate: (files) => {
                        console.log('📁 Mise à jour temps réel:', Object.keys(files).length);
                        if (window.Tabs) window.Tabs.onRemoteUpdate(files);
                    },
                    onOrderUpdate: (order) => {
                        console.log('📋 Mise à jour ordre:', order);
                        if (window.Tabs) window.Tabs.onOrderUpdate(order);
                    },
                    onCurrentTabUpdate: (current) => {
                        console.log('📍 Mise à jour onglet courant:', current);
                        if (window.Tabs) window.Tabs.onCurrentTabUpdate(current);
                    }
                });
            } catch (error) {
                console.error('❌ Erreur initialisation sync:', error);
            }
        }
    }
    
    function logout() {
        if (confirm('Voulez-vous changer d\'établissement ?')) {
            if (window.Sync && typeof window.Sync.disconnect === 'function') {
                window.Sync.disconnect();
            }
            clearStoredUAI();
            
            // Réinitialiser AppState
            AppState.files = {};
            AppState.tabOrder = [];
            AppState.currentTab = null;
            
            // Réinitialiser l'affichage
            const note = document.getElementById('note');
            if (note) note.value = '';
            if (window.Tabs && typeof window.Tabs.renderTabs === 'function') {
                window.Tabs.renderTabs();
            }
            
            // Afficher l'écran de connexion
            mainApp.style.display = 'none';
            loginScreen.style.display = 'flex';
            if (uaiInput) uaiInput.value = '';
        }
    }
    
    async function attemptLogin() {
        const uai = uaiInput.value.trim().toUpperCase();
        
        if (!uai) {
            showError('Veuillez saisir un code UAI');
            return;
        }
        
        if (!validateUAI(uai)) {
            showError('Format UAI invalide (7-9 caractères)');
            return;
        }
        
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
    
    async function checkExistingLogin() {
        const stored = getStoredUAI();
        console.log('🔍 Vérification session existante:', stored);
        
        if (stored && validateUAI(stored)) {
            console.log('🔄 Session trouvée, reconnexion pour', stored);
            uaiInput.value = stored;
            await onLoginSuccess(stored);
            return true;
        }
        return false;
    }
    
    function init() {
        console.log('🔐 Initialisation du module Auth');
        
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
        
        // Vérifier si déjà connecté
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