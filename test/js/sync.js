/* -------------------- SYNCHRONISATION FIRESTORE -------------------- */

const Sync = (() => {
    let currentUAI = null;
    let unsubscribeTabs = null;
    let unsubscribeOrder = null;
    let isSyncing = false;
    let pendingSave = null;
    let initializationDone = false;
    
    const syncStatus = document.getElementById('syncStatus');
    const syncIcon = syncStatus?.querySelector('.sync-icon');
    const syncText = syncStatus?.querySelector('.sync-text');
    
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
    
    async function initDefaultData(uai) {
        if (initializationDone) {
            console.log('⚠️ Initialisation déjà effectuée, annulation');
            return;
        }
        
        console.log('📦 Initialisation des données par défaut pour', uai);
        
        const defaultTabs = [
            "000","100","200","300","400","500","600","700","800","900",
            "A","BD","C","M","N","P","R","T","FL"
        ];
        
        const batch = window.db.batch();
        const tabsRef = window.db.collection('etablissements').doc(uai).collection('tabs');
        const orderRef = window.db.collection('etablissements').doc(uai).collection('metadata').doc('order');
        const currentRef = window.db.collection('etablissements').doc(uai).collection('metadata').doc('current');
        
        for (const name of defaultTabs) {
            const tabRef = tabsRef.doc(name);
            batch.set(tabRef, { 
                name: name, 
                content: "", 
                lastModified: firebase.firestore.FieldValue.serverTimestamp() 
            });
        }
        
        batch.set(orderRef, { 
            order: defaultTabs, 
            lastModified: firebase.firestore.FieldValue.serverTimestamp() 
        });
        batch.set(currentRef, { 
            currentTab: "000", 
            lastModified: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        await batch.commit();
        
        console.log('✅ Données par défaut initialisées');
        
        AppState.files = {};
        defaultTabs.forEach(name => { AppState.files[name] = ""; });
        AppState.tabOrder = [...defaultTabs];
        AppState.currentTab = "000";
        
        Storage.saveState();
        
        if (window.Tabs && typeof window.Tabs.renderTabs === 'function') {
            window.Tabs.renderTabs();
        }
        if (window.Tabs && typeof window.Tabs.switchTab === 'function') {
            window.Tabs.switchTab("000");
        }
        
        initializationDone = true;
        return true;
    }
    
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
            return false;
        }
    }
    
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
    
    function listenTabs(uai, onData) {
        if (unsubscribeTabs) unsubscribeTabs();
        
        const tabsRef = window.db.collection('etablissements')
            .doc(uai)
            .collection('tabs');
        
        unsubscribeTabs = tabsRef.onSnapshot(async (snapshot) => {
            if (isSyncing) return;
            
            console.log('📡 Snapshot reçu, taille:', snapshot.size);
            
            // Vérifier si des données existent réellement
            const hasData = snapshot.size > 0;
            
            if (!hasData && !initializationDone) {
                // Vérifier si localStorage a des données avant d'initialiser
                const savedFiles = localStorage.getItem('cdiFiles');
                const hasLocalData = savedFiles && Object.keys(JSON.parse(savedFiles)).length > 0;
                
                if (!hasLocalData) {
                    console.log('📦 Aucune donnée trouvée, initialisation...');
                    await initDefaultData(uai);
                    return;
                } else {
                    console.log('📦 Données locales trouvées, pas d\'initialisation');
                    // Charger depuis localStorage
                    Storage.loadFromLocal();
                    return;
                }
            }
            
            const files = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                files[data.name] = data.content || '';
            });
            
            console.log('📄 Contenu chargé pour 000:', files['000']?.substring(0, 50));
            onData('tabs', files);
            updateStatus('success', 'Synchronisé');
        }, (error) => {
            console.error('Erreur listenTabs:', error);
            updateStatus('error', 'Erreur de connexion');
        });
    }
    
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
            }
        }, (error) => {
            console.error('Erreur listenOrder:', error);
        });
    }
    
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
    
    async function initSync(uai, callbacks) {
        currentUAI = uai;
        initializationDone = false;
        
        if (!window.db) {
            updateStatus('offline', 'Firebase non disponible');
            return false;
        }
        
        updateStatus('syncing', 'Connexion...');
        
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
        initializationDone = false;
        updateStatus('success', 'Déconnecté');
    }
    
    function debounceSave(fn, delay = 500) {
        if (pendingSave) clearTimeout(pendingSave);
        pendingSave = setTimeout(() => {
            fn();
            pendingSave = null;
        }, delay);
    }
    
    function getCurrentUAI() {
        return currentUAI;
    }
    
    return {
        initSync,
        disconnect,
        saveTabToFirestore,
        saveOrderToFirestore,
        saveCurrentTabToFirestore,
        updateStatus,
        getCurrentUAI,
        isSyncing: () => isSyncing,
        debounceSave
    };
})();