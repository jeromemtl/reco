/* -------------------- SYNCHRONISATION FIRESTORE -------------------- */

const Sync = (() => {
    let currentUAI = null;
    let unsubscribeTabs = null;
    let unsubscribeOrder = null;
    let isSyncing = false;
    let pendingSave = null;
    
    // Éléments DOM pour l'indicateur
    const syncStatus = document.getElementById('syncStatus');
    const syncIcon = syncStatus?.querySelector('.sync-icon');
    const syncText = syncStatus?.querySelector('.sync-text');
    
    // Mise à jour de l'indicateur
    function updateStatus(status, message) {
        if (!syncStatus) return;
        
        syncStatus.classList.remove('syncing', 'error', 'offline');
        syncIcon.textContent = '';
        
        switch(status) {
            case 'syncing':
                syncStatus.classList.add('syncing');
                syncIcon.textContent = '🔄';
                syncText.textContent = message || 'Synchronisation...';
                break;
            case 'success':
                syncIcon.textContent = '☁️';
                syncText.textContent = message || 'Synchronisé';
                setTimeout(() => {
                    if (syncText.textContent === 'Synchronisé') {
                        // On laisse l'état
                    }
                }, 2000);
                break;
            case 'error':
                syncStatus.classList.add('error');
                syncIcon.textContent = '⚠️';
                syncText.textContent = message || 'Erreur de sync';
                break;
            case 'offline':
                syncStatus.classList.add('offline');
                syncIcon.textContent = '📴';
                syncText.textContent = message || 'Hors ligne';
                break;
            default:
                syncIcon.textContent = '☁️';
                syncText.textContent = 'Synchronisé';
        }
    }
    
    // Sauvegarder un onglet dans Firestore
    async function saveTabToFirestore(tabName, content) {
        if (!currentUAI || !window.db) return false;
        
        try {
            const docRef = window.db.collection('etablissements')
                .doc(currentUAI)
                .collection('tabs')
                .doc(tabName);
            
            await docRef.set({
                name: tabName,
                content: content,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Erreur saveTabToFirestore:', error);
            updateStatus('error', 'Erreur de sauvegarde');
            return false;
        }
    }
    
    // Sauvegarder l'ordre des onglets
    async function saveOrderToFirestore(order) {
        if (!currentUAI || !window.db) return false;
        
        try {
            const orderRef = window.db.collection('etablissements')
                .doc(currentUAI)
                .collection('metadata')
                .doc('order');
            
            await orderRef.set({
                order: order,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Erreur saveOrderToFirestore:', error);
            return false;
        }
    }
    
    // Sauvegarder l'onglet courant
    async function saveCurrentTabToFirestore(currentTab) {
        if (!currentUAI || !window.db) return false;
        
        try {
            const metaRef = window.db.collection('etablissements')
                .doc(currentUAI)
                .collection('metadata')
                .doc('current');
            
            await metaRef.set({
                currentTab: currentTab,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Erreur saveCurrentTabToFirestore:', error);
            return false;
        }
    }
    
    // Écouter les changements des onglets
    function listenTabs(uai, onData) {
        if (unsubscribeTabs) unsubscribeTabs();
        
        const tabsRef = window.db.collection('etablissements')
            .doc(uai)
            .collection('tabs');
        
        unsubscribeTabs = tabsRef.onSnapshot((snapshot) => {
            if (isSyncing) return;
            
            const changes = snapshot.docChanges();
            const files = {};
            
            snapshot.forEach(doc => {
                const data = doc.data();
                files[data.name] = data.content || '';
            });
            
            onData('tabs', files, changes);
            updateStatus('success', 'Synchronisé');
        }, (error) => {
            console.error('Erreur listenTabs:', error);
            updateStatus('error', 'Erreur de connexion');
        });
    }
    
    // Écouter l'ordre des onglets
    function listenOrder(uai, onData) {
        if (unsubscribeOrder) unsubscribeOrder();
        
        const orderRef = window.db.collection('etablissements')
            .doc(uai)
            .collection('metadata')
            .doc('order');
        
        unsubscribeOrder = orderRef.onSnapshot((doc) => {
            if (isSyncing) return;
            
            if (doc.exists) {
                const order = doc.data().order || [];
                onData('order', order);
            } else {
                // Premier chargement, pas d'ordre encore
                onData('order', null);
            }
        }, (error) => {
            console.error('Erreur listenOrder:', error);
        });
    }
    
    // Écouter l'onglet courant
    function listenCurrentTab(uai, onData) {
        const currentRef = window.db.collection('etablissements')
            .doc(uai)
            .collection('metadata')
            .doc('current');
        
        return currentRef.onSnapshot((doc) => {
            if (isSyncing) return;
            
            if (doc.exists) {
                onData('current', doc.data().currentTab);
            }
        }, (error) => {
            console.error('Erreur listenCurrentTab:', error);
        });
    }
    
    // Initialiser la synchronisation pour un UAI
    async function initSync(uai, callbacks) {
        currentUAI = uai;
        
        // Vérifier la connexion
        if (!window.db) {
            updateStatus('offline', 'Firebase non disponible');
            return false;
        }
        
        updateStatus('syncing', 'Connexion...');
        
        // Écouter les onglets
        listenTabs(uai, (type, data, changes) => {
            if (type === 'tabs') {
                callbacks.onTabsUpdate(data, changes);
            }
        });
        
        // Écouter l'ordre
        listenOrder(uai, (type, data) => {
            if (type === 'order') {
                callbacks.onOrderUpdate(data);
            }
        });
        
        // Écouter l'onglet courant
        listenCurrentTab(uai, (type, data) => {
            if (type === 'current') {
                callbacks.onCurrentTabUpdate(data);
            }
        });
        
        return true;
    }
    
    // Déconnexion / arrêt des listeners
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
        updateStatus('success', 'Déconnecté');
    }
    
    // Sauvegarde avec debounce
    function debounceSave(fn, delay = 500) {
        if (pendingSave) clearTimeout(pendingSave);
        pendingSave = setTimeout(() => {
            fn();
            pendingSave = null;
        }, delay);
    }
    
    // Exporter les fonctions
    return {
        initSync,
        disconnect,
        saveTabToFirestore,
        saveOrderToFirestore,
        saveCurrentTabToFirestore,
        updateStatus,
        getCurrentUAI: () => currentUAI,
        isSyncing: () => isSyncing,
        debounceSave
    };
})();