/* -------------------- SYNCHRONISATION FIRESTORE -------------------- */

const Sync = (() => {
    let currentUAI = null;
    let unsubscribeTabs = null;
    let unsubscribeOrder = null;
    let isSyncing = false;

    async function listenTabs(uai, onData) {
        if (unsubscribeTabs) unsubscribeTabs();
        
        // Vérifier le mode
        const mode = window.Auth ? window.Auth.getCurrentMode() : null;
        if (mode !== 'collab') {
            debugLog('⚠️ Mode solo, écoute Firestore désactivée');
            return;
        }
        
        const tabsRef = window.db.collection('etablissements')
            .doc(uai)
            .collection('tabs');
        
        let isFirstSnapshot = true;
        let hasReceivedData = false;
        
        unsubscribeTabs = tabsRef.onSnapshot((snapshot) => {
            if (isSyncing) return;
            
            // Connexion OK - mettre à jour le statut immédiatement
            if (window.Storage && window.Storage.updateConnectionStatus) {
                window.Storage.updateConnectionStatus(true);
            }
            
            const files = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                files[data.name] = data.content || '';
            });
            
            // Vérifier si on a des données locales
            const hasLocalData = Object.keys(AppState.files).length > 0 && 
                                 Object.values(AppState.files).some(c => c !== '');
            const firestoreEmpty = Object.values(files).every(c => c === '');
            
            // Si Firestore est vide mais qu'on a des données locales, ne pas écraser
            if (firestoreEmpty && hasLocalData && !isFirstSnapshot) {
                debugLog('⚠️ Firestore vide - conservation des données locales');
                return;
            }
            
            if (isFirstSnapshot && snapshot.size === 0 && !hasReceivedData) {
                isFirstSnapshot = false;
                const savedFiles = localStorage.getItem('cdiFiles');
                const hasLocalDataFallback = savedFiles && Object.keys(JSON.parse(savedFiles)).length > 0;
                
                if (!hasLocalDataFallback) {
                    debugLog('📦 Aucune donnée, initialisation...');
                    // initDefaultData sera géré par storage.js
                } else {
                    debugLog('📦 Données locales trouvées, chargement');
                    Storage.loadFromLocal();
                }
                return;
            }
            
            isFirstSnapshot = false;
            hasReceivedData = true;
            
            debugLog('📡 Snapshot reçu, taille:', snapshot.size);
            onData('tabs', files);
        }, (error) => {
            // Erreur Firestore = hors ligne immédiatement
            debugLog('🔥 Erreur Firestore détectée:', error.message);
            if (window.Storage && window.Storage.updateConnectionStatus) {
                window.Storage.updateConnectionStatus(false);
            }
        });
    }
    
    function listenOrder(uai, onData) {
        if (unsubscribeOrder) unsubscribeOrder();
        
        // Vérifier le mode
        const mode = window.Auth ? window.Auth.getCurrentMode() : null;
        if (mode !== 'collab') {
            debugLog('⚠️ Mode solo, écoute order désactivée');
            return;
        }
        
        unsubscribeOrder = window.db.collection('etablissements')
            .doc(uai)
            .collection('metadata')
            .doc('order')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    onData('order', doc.data().order || []);
                }
            }, (error) => {
                debugLog('🔥 Erreur Firestore order:', error.message);
                if (window.Storage && window.Storage.updateConnectionStatus) {
                    window.Storage.updateConnectionStatus(false);
                }
            });
    }
    
    function listenCurrentTab(uai, onData) {
        // Vérifier le mode
        const mode = window.Auth ? window.Auth.getCurrentMode() : null;
        if (mode !== 'collab') {
            debugLog('⚠️ Mode solo, écoute current désactivée');
            return () => {};
        }
        
        return window.db.collection('etablissements')
            .doc(uai)
            .collection('metadata')
            .doc('current')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    onData('current', doc.data().currentTab);
                }
            }, (error) => {
                debugLog('🔥 Erreur Firestore current:', error.message);
                if (window.Storage && window.Storage.updateConnectionStatus) {
                    window.Storage.updateConnectionStatus(false);
                }
            });
    }
    
    async function initSync(uai, callbacks) {
        debugLog('🔄 initSync appelé pour', uai);
        currentUAI = uai;
        
        // Vérifier le mode
        const mode = window.Auth ? window.Auth.getCurrentMode() : null;
        if (mode !== 'collab') {
            debugLog('⚠️ Mode solo, sync désactivée');
            return false;
        }
        
        if (!window.db) {
            console.error('Firebase non disponible');
            return false;
        }
        
        listenTabs(uai, (type, data) => {
            if (type === 'tabs') {
                callbacks.onTabsUpdate(data);
            }
        });
        
        listenOrder(uai, (type, data) => {
            if (type === 'order') {
                callbacks.onOrderUpdate(data);
            }
        });
        
        listenCurrentTab(uai, (type, data) => {
            if (type === 'current') {
                callbacks.onCurrentTabUpdate(data);
            }
        });
        
        return true;
    }
    
    function disconnect() {
        if (unsubscribeTabs) {
            unsubscribeTabs();
            unsubscribeTabs = null;
        }
        if (unsubscribeOrder) {
            unsubscribeOrder();
            unsubscribeOrder = null;
        }
        currentUAI = null;
        debugLog('🔌 Sync déconnecté');
    }
    
    function getCurrentUAI() {
        return currentUAI;
    }
    
    return {
        initSync,
        disconnect,
        getCurrentUAI,
        isSyncing: () => isSyncing
    };
})();