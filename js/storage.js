/* -------------------- STORAGE & ÉTAT GLOBAL -------------------- */

const AppState = {
    files: {},
    tabOrder: [],
    currentTab: null,
    isRestoring: true,
    currentUAI: null
};

const Storage = {
    KEYS: {
        FILES: "cdiFiles",
        ORDER: "cdiTabOrder",
        CURRENT: "cdiCurrentTab",
        THEME: "cdiTheme",
        FONT_SIZE: "textareaFontSize"
    },

    pendingQueue: [],
    _saving: false,

    formattedDateTime() {
        const d = new Date();
        const pad = n => String(n).padStart(2, "0");
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const time = `${pad(d.getHours())}h${pad(d.getMinutes())}`;
        return `${date}_${time}`;
    },

    updatePendingBadge(count) {
        const pendingBadge = document.getElementById('pendingBadge');
        if (pendingBadge) {
            if (count > 0) {
                pendingBadge.textContent = count;
                pendingBadge.style.display = 'inline-block';
            } else {
                pendingBadge.style.display = 'none';
            }
        }
    },

    updateConnectionStatus(forceOnline = null) {
        const connectionDiv = document.getElementById('connectionStatus');
        const connectionIconEl = document.getElementById('connectionIcon');
        const connectionTextEl = document.getElementById('connectionText');
        const syncDiv = document.getElementById('syncStatusFooter');
        const syncIconEl = document.getElementById('syncIconFooter');
        const syncTextEl = document.getElementById('syncTextFooter');
        
        let isOnline;
        if (forceOnline !== null) {
            isOnline = forceOnline;
        } else {
            isOnline = navigator.onLine;
        }
        
        if (!connectionDiv) return;
        
        if (!isOnline) {
            connectionDiv.classList.add('offline');
            connectionDiv.classList.remove('syncing');
            if (connectionIconEl) connectionIconEl.textContent = '🔴';
            if (connectionTextEl) {
                if (this.pendingQueue.length > 0) {
                    connectionTextEl.textContent = `Hors ligne (${this.pendingQueue.length})`;
                } else {
                    connectionTextEl.textContent = 'Hors ligne';
                }
            }
            if (syncDiv) {
                syncDiv.classList.add('offline');
                if (syncIconEl) syncIconEl.textContent = '📴';
                if (syncTextEl) syncTextEl.textContent = 'Hors ligne';
            }
        } else {
            connectionDiv.classList.remove('offline');
            if (connectionIconEl) connectionIconEl.textContent = '🟢';
            if (connectionTextEl) {
                if (this.pendingQueue.length > 0) {
                    connectionTextEl.textContent = `Sync (${this.pendingQueue.length})`;
                    connectionDiv.classList.add('syncing');
                } else {
                    connectionTextEl.textContent = 'En ligne';
                    connectionDiv.classList.remove('syncing');
                }
            }
            if (syncDiv) {
                syncDiv.classList.remove('offline');
                if (this.pendingQueue.length > 0) {
                    syncDiv.classList.add('syncing');
                    if (syncIconEl) syncIconEl.textContent = '🔄';
                    if (syncTextEl) syncTextEl.textContent = `En attente (${this.pendingQueue.length})`;
                } else {
                    syncDiv.classList.remove('syncing', 'error');
                    if (syncIconEl) syncIconEl.textContent = '☁️';
                    if (syncTextEl) syncTextEl.textContent = 'Synchronisé';
                }
            }
        }
        
        this.updatePendingBadge(this.pendingQueue.length);
    },

    updateSyncStatus(status, message) {
        const syncDiv = document.getElementById('syncStatusFooter');
        const syncIconEl = document.getElementById('syncIconFooter');
        const syncTextEl = document.getElementById('syncTextFooter');
        
        if (!syncDiv) return;
        
        syncDiv.classList.remove('syncing', 'error', 'offline');
        
        switch(status) {
            case 'syncing':
                syncDiv.classList.add('syncing');
                if (syncIconEl) syncIconEl.textContent = '🔄';
                if (syncTextEl) syncTextEl.textContent = message || 'Synchro...';
                break;
            case 'success':
                if (syncIconEl) syncIconEl.textContent = '☁️';
                if (syncTextEl) syncTextEl.textContent = message || 'Synchronisé';
                break;
            case 'error':
                syncDiv.classList.add('error');
                if (syncIconEl) syncIconEl.textContent = '⚠️';
                if (syncTextEl) syncTextEl.textContent = message || 'Erreur';
                break;
            default:
                if (syncIconEl) syncIconEl.textContent = '☁️';
                if (syncTextEl) syncTextEl.textContent = 'Synchronisé';
        }
    },

    loadPendingQueue() {
        const saved = localStorage.getItem('reco_pending_queue');
        if (saved) {
            try {
                this.pendingQueue = JSON.parse(saved);
                debugLog(`📦 File d'attente chargée: ${this.pendingQueue.length} opérations`);
                this.updatePendingBadge(this.pendingQueue.length);
                this.updateConnectionStatus();
            } catch(e) {
                this.pendingQueue = [];
            }
        }
    },

    addToQueue(operation, data) {
        this.pendingQueue.push({
            operation: operation,
            data: data,
            timestamp: Date.now()
        });
        
        localStorage.setItem('reco_pending_queue', JSON.stringify(this.pendingQueue));
        this.updateConnectionStatus();
        this.updateSyncStatus('syncing', `En attente (${this.pendingQueue.length})`);
        debugLog(`📦 Ajout file: ${operation} (${this.pendingQueue.length} en attente)`);
    },

    async sendToFirestore(item) {
        const uai = this.getCurrentUAI();
        if (!uai || !window.db) return false;
        
        try {
            switch (item.operation) {
                case 'saveAll':
                    const batch = window.db.batch();
                    const tabsRef = window.db.collection('etablissements').doc(uai).collection('tabs');
                    
                    for (const [name, content] of Object.entries(item.data.files)) {
                        batch.set(tabsRef.doc(name), {
                            name: name,
                            content: content,
                            lastModified: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                    
                    batch.set(window.db.collection('etablissements').doc(uai).collection('metadata').doc('order'), {
                        order: item.data.order,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    batch.set(window.db.collection('etablissements').doc(uai).collection('metadata').doc('current'), {
                        currentTab: item.data.currentTab,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    await batch.commit();
                    break;
                    
                case 'saveTab':
                    await window.db.collection('etablissements').doc(uai).collection('tabs').doc(item.data.tabName).set({
                        name: item.data.tabName,
                        content: item.data.content,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    break;
            }
            return true;
        } catch (error) {
            console.error('Erreur envoi Firestore:', error);
            return false;
        }
    },

    async processQueue() {
        if (!navigator.onLine || this.pendingQueue.length === 0) return;
        
        debugLog(`🔄 Traitement de ${this.pendingQueue.length} opérations en attente`);
        this.updateSyncStatus('syncing', `Traitement (${this.pendingQueue.length})...`);
        
        const queueCopy = [...this.pendingQueue];
        let successCount = 0;
        
        for (const item of queueCopy) {
            if (item.operation === 'saveAll') {
                const uai = this.getCurrentUAI();
                if (uai && window.db) {
                    for (const [tabName, newContent] of Object.entries(item.data.files)) {
                        const docRef = window.db.collection('etablissements')
                            .doc(uai)
                            .collection('tabs')
                            .doc(tabName);
                        
                        const doc = await docRef.get();
                        const existingContent = doc.exists ? doc.data().content || '' : '';
                        
                        if (existingContent && newContent && existingContent !== newContent) {
                            const merged = existingContent + "\n" + newContent;
                            item.data.files[tabName] = merged;
                            debugLog(`🔄 Fusion pour ${tabName}`);
                        }
                    }
                }
            }
            
            const success = await this.sendToFirestore(item);
            if (success) {
                successCount++;
                this.pendingQueue = this.pendingQueue.filter(q => q !== item);
            } else {
                debugLog('⏸️ Erreur, arrêt du traitement');
                break;
            }
        }
        
        if (successCount > 0) {
            localStorage.setItem('reco_pending_queue', JSON.stringify(this.pendingQueue));
            this.updateConnectionStatus();
            this.updatePendingBadge(this.pendingQueue.length);
            
            if (this.pendingQueue.length === 0) {
                this.updateSyncStatus('success', 'Synchronisé');
                debugLog('✅ Toutes les opérations ont été synchronisées');
            } else {
                debugLog(`✅ ${successCount} opérations traitées, reste ${this.pendingQueue.length}`);
            }
        }
    },

    initConnectionListener() {
        debugLog('🔌 Initialisation des listeners de connexion');
        
        window.addEventListener('online', () => {
            debugLog('🟢 Événement online');
            this.updateConnectionStatus(true);
            setTimeout(() => {
                this.processQueue();
                this.saveState();
            }, 500);
        });
        
        window.addEventListener('offline', () => {
            debugLog('🔴 Événement offline');
            this.updateConnectionStatus(false);
            this.updateSyncStatus('offline', 'Hors ligne');
        });
        
        setInterval(() => {
            this.updateConnectionStatus();
        }, 5000);
        
        this.updateConnectionStatus();
    },

    loadState() {
        debugLog('📂 loadState appelé');
        this.loadPendingQueue();
        this.initConnectionListener();
        
        const savedFiles = localStorage.getItem(this.KEYS.FILES);
        const savedOrder = localStorage.getItem(this.KEYS.ORDER);
        const savedCurrent = localStorage.getItem(this.KEYS.CURRENT);

        if (savedFiles && savedOrder) {
            try {
                AppState.files = JSON.parse(savedFiles) || {};
                AppState.tabOrder = JSON.parse(savedOrder) || [];
            } catch (e) {
                AppState.files = {};
                AppState.tabOrder = [];
            }
            AppState.currentTab = savedCurrent || (AppState.tabOrder.length > 0 ? AppState.tabOrder[0] : null);
        } else {
            this.loadDefaults();
        }
    },
    
    loadDefaults() {
        const defaults = [
            "000","100","200","300","400","500","600","700","800","900",
            "A","BD","C","M","N","P","R","T","FL"
        ];
        defaults.forEach(name => {
            AppState.files[name] = "";
            AppState.tabOrder.push(name);
        });
        AppState.currentTab = "000";
        this.saveState();
    },
    
    loadFromLocal() {
        const savedFiles = localStorage.getItem(this.KEYS.FILES);
        const savedOrder = localStorage.getItem(this.KEYS.ORDER);
        const savedCurrent = localStorage.getItem(this.KEYS.CURRENT);
        
        if (savedFiles && savedOrder) {
            try {
                AppState.files = JSON.parse(savedFiles) || {};
                AppState.tabOrder = JSON.parse(savedOrder) || [];
                AppState.currentTab = savedCurrent || (AppState.tabOrder.length > 0 ? AppState.tabOrder[0] : null);
                
                if (window.Tabs && typeof window.Tabs.renderTabs === 'function') {
                    window.Tabs.renderTabs();
                }
                if (window.Tabs && typeof window.Tabs.switchTab === 'function' && AppState.currentTab) {
                    window.Tabs.switchTab(AppState.currentTab);
                }
                if (window.Tabs && typeof window.Tabs.updateTabIndicators === 'function') {
                    window.Tabs.updateTabIndicators();
                }
            } catch (e) {
                this.loadDefaults();
            }
        } else {
            this.loadDefaults();
        }
    },

    getCurrentUAI() {
        if (window.Auth && typeof window.Auth.getCurrentUAI === 'function') {
            const uai = window.Auth.getCurrentUAI();
            if (uai) return uai;
        }
        if (window.Sync && typeof window.Sync.getCurrentUAI === 'function') {
            const uai = window.Sync.getCurrentUAI();
            if (uai) return uai;
        }
        const stored = localStorage.getItem('reco_uai');
        if (stored) return stored;
        return null;
    },

    showSaveFeedback() {
        const saveFeedback = document.getElementById('saveFeedback');
        if (saveFeedback) {
            saveFeedback.style.opacity = '1';
            saveFeedback.style.visibility = 'visible';
            saveFeedback.style.display = 'inline-block';
            saveFeedback.style.color = '#4CAF50';
            saveFeedback.style.fontWeight = 'bold';
            
            setTimeout(() => {
                saveFeedback.style.opacity = '0';
            }, 600);
        }
    },

    saveState() {
        if (this._saving) {
            debugLog(`⏭️ saveState déjà en cours, ignoré`);
            return;
        }
        this._saving = true;
        
        try {
            localStorage.setItem(this.KEYS.FILES, JSON.stringify(AppState.files));
            localStorage.setItem(this.KEYS.ORDER, JSON.stringify(AppState.tabOrder));
            localStorage.setItem(this.KEYS.CURRENT, AppState.currentTab);
            
            this.showSaveFeedback();
            
            if (window.Tabs && typeof window.Tabs.updateTabIndicators === 'function') {
                window.Tabs.updateTabIndicators();
            }
            
            // Sauvegarde Firestore uniquement en mode collaboratif
            const mode = window.Auth ? window.Auth.getCurrentMode() : null;
            const uai = this.getCurrentUAI();
            
            if (mode === 'collab' && uai && window.db && navigator.onLine) {
                debugLog(`📤 Envoi direct vers Firestore (mode collaboratif)`);
                this.sendToFirestore({
                    operation: 'saveAll',
                    data: {
                        files: AppState.files,
                        order: AppState.tabOrder,
                        currentTab: AppState.currentTab
                    }
                }).then(success => {
                    if (success) {
                        this.updateSyncStatus('success', 'Synchronisé');
                        if (this.pendingQueue.length > 0) {
                            this.pendingQueue = [];
                            localStorage.removeItem('reco_pending_queue');
                            this.updateConnectionStatus();
                        }
                    } else {
                        this.addToQueue('saveAll', {
                            files: AppState.files,
                            order: AppState.tabOrder,
                            currentTab: AppState.currentTab
                        });
                    }
                    this._saving = false;
                }).catch(err => {
                    console.error('Erreur:', err);
                    this._saving = false;
                });
            } else if (mode === 'solo') {
                debugLog(`📦 Mode solo, pas d'envoi Firestore`);
                this._saving = false;
            } else {
                this._saving = false;
            }
        } catch (error) {
            console.error('Erreur saveState:', error);
            this._saving = false;
        }
    },

    saveTheme(mode) {
        localStorage.setItem(this.KEYS.THEME, mode);
    },

    loadTheme() {
        return localStorage.getItem(this.KEYS.THEME) || "light";
    },

    saveFontSize(size) {
        localStorage.setItem(this.KEYS.FONT_SIZE, size);
    },

    loadFontSize() {
        return localStorage.getItem(this.KEYS.FONT_SIZE);
    },

    exportTxt(filename, content) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};