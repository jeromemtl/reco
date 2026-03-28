/* -------------------- SCANNER CAMÉRA -------------------- */

const CameraScanner = (() => {
    let html5QrcodeScanner = null;
    let isScanning = false;
    let isStarting = false;
    let scanTimeout = null;
    let audioContext = null;
    let hasFlash = false;
    let debugCounter = 0;
    
    function debug(msg, data) {
        const time = new Date().toLocaleTimeString();
        const counter = ++debugCounter;
        console.log(`[${time}] [${counter}] 🔍 ${msg}`, data !== undefined ? data : '');
    }
    
    async function checkFlashSupport() {
        debug('checkFlashSupport - début');
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                debug('checkFlashSupport - mediaDevices non disponible');
                return false;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            debug('checkFlashSupport - caméras trouvées:', hasCamera);
            if (!hasCamera) return false;
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            
            const track = stream.getVideoTracks()[0];
            if (!track) {
                stream.getTracks().forEach(t => t.stop());
                return false;
            }
            
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            stream.getTracks().forEach(t => t.stop());
            
            const hasTorch = !!(capabilities && capabilities.torch);
            debug('checkFlashSupport - flash supporté:', hasTorch);
            return hasTorch;
        } catch (error) {
            debug('checkFlashSupport - erreur:', error.message);
            return false;
        }
    }
    
    function playBeep() {
        const beepEnabled = document.getElementById("beep-option")?.checked;
        if (!beepEnabled) return;
        
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = "sine";
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.3;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {}
    }
    
    function getCurrentTabLineCount() {
        if (!AppState.currentTab) return 0;
        const content = AppState.files[AppState.currentTab] || "";
        const lines = content.split("\n").filter(l => l.trim() !== "").length;
        return lines;
    }
    
    function updateLineCountDisplay() {
        const lineCountBadge = document.querySelector('.badge-lines');
        if (lineCountBadge && AppState.currentTab) {
            const lineCount = getCurrentTabLineCount();
            lineCountBadge.innerHTML = `📊 ${lineCount} ligne${lineCount > 1 ? 's' : ''}`;
        }
    }
    
    async function createScannerUI() {
        debug('createScannerUI - création de l\'interface');
        const oldContainer = document.getElementById("camera-scanner-container");
        if (oldContainer) {
            debug('createScannerUI - suppression ancien conteneur');
            oldContainer.remove();
        }
        
        const currentTabName = AppState.currentTab || "Aucun";
        const lineCount = getCurrentTabLineCount();
        
        hasFlash = await checkFlashSupport();
        debug('createScannerUI - flash supporté:', hasFlash);
        
        const container = document.createElement("div");
        container.id = "camera-scanner-container";
        
        const flashButtonHTML = hasFlash ? `
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                <button id="toggle-flash" class="flash-button">🔦 Flash</button>
            </div>
        ` : '';
        
        container.innerHTML = `
            <div id="scanner-overlay">
                <div class="scanner-modal">
                    <div class="scanner-header">
                        <h3>📷 Scanner</h3>
                        <div class="scanner-badges">
                            <div class="badge-lines">
                                📊 ${lineCount} ligne${lineCount > 1 ? 's' : ''}
                            </div>
                            <div class="badge-tab">
                                📌 ${currentTabName}
                            </div>
                        </div>
                        <button id="close-scanner" class="close-scanner">✖</button>
                    </div>
                    
                    <div id="qr-reader" style="width: 100%; margin: 0 auto;"></div>
                    
                    ${flashButtonHTML}
                    
                    <p id="scanner-status" class="scanner-status">
                        Pointez la caméra vers un code-barres
                    </p>
                    
                    <div class="scanner-option">
                        <label>
                            <input type="checkbox" id="beep-option" checked> 
                            <span>🔊 Bip sonore</span>
                        </label>
                    </div>
                    
                    <div class="last-code-container">
                        <div class="last-code-title">📋 Dernier code ajouté :</div>
                        <div id="last-code-display" class="last-code-display">—</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        debug('createScannerUI - interface ajoutée au DOM');
        
        const closeBtn = document.getElementById("close-scanner");
        if (closeBtn) {
            debug('createScannerUI - bouton fermer trouvé');
            closeBtn.addEventListener("click", (e) => {
                debug('createScannerUI - clic sur bouton fermer');
                stopScanner();
            });
        } else {
            debug('createScannerUI - ATTENTION: bouton fermer NON trouvé');
        }
        
        if (hasFlash) {
            const flashBtn = document.getElementById("toggle-flash");
            if (flashBtn) flashBtn.addEventListener("click", toggleFlash);
        }
        
        return container;
    }
    
    function updateLastCode(code) {
        const lastCodeDisplay = document.getElementById("last-code-display");
        if (lastCodeDisplay) {
            lastCodeDisplay.textContent = code;
        }
    }
    
    async function startScanner() {
        debug('startScanner - appelée');
        
        if (isScanning) {
            debug('startScanner - déjà en scan (isScanning=true), annulation');
            return;
        }
        
        if (isStarting) {
            debug('startScanner - déjà en démarrage (isStarting=true), annulation');
            return;
        }
        
        isStarting = true;
        debug('startScanner - début du processus');
        
        if (!AppState || !AppState.currentTab) {
            debug('startScanner - AppState non prêt, réessai dans 500ms');
            setTimeout(() => {
                isStarting = false;
                startScanner();
            }, 500);
            return;
        }
        debug('startScanner - AppState prêt, currentTab:', AppState.currentTab);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            debug('startScanner - mediaDevices non disponible');
            alert("❌ Votre navigateur ne supporte pas l'accès à la caméra.");
            isStarting = false;
            return;
        }
        debug('startScanner - mediaDevices disponible');
        
        try {
            debug('startScanner - test accès caméra...');
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            testStream.getTracks().forEach(track => track.stop());
            debug('startScanner - accès caméra OK');
        } catch (err) {
            debug('startScanner - ERREUR accès caméra:', err.name + ' - ' + err.message);
            if (err.name === 'NotAllowedError') {
                alert("❌ Accès à la caméra refusé.\n\nVeuillez autoriser l'accès dans les paramètres de votre navigateur.");
            } else if (err.name === 'NotFoundError') {
                alert("❌ Aucune caméra trouvée sur cet appareil.");
            } else {
                alert(`❌ Erreur caméra: ${err.message}`);
            }
            isStarting = false;
            return;
        }
        
        debug('startScanner - création de l\'interface...');
        await createScannerUI();
        await new Promise(resolve => setTimeout(resolve, 100));
        debug('startScanner - interface créée');
        
        const config = {
            fps: 15,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const width = Math.min(300, viewfinderWidth * 0.8);
                const height = Math.min(150, viewfinderHeight * 0.4);
                return { width: Math.round(width), height: Math.round(height) };
            },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: false,
            useBarCodeDetectorIfSupported: true,
            disableFlip: false,
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };
        
        const onScanSuccess = (decodedText, decodedResult) => {
            if (scanTimeout) return;
            
            let code = decodedText.trim();
            debug('onScanSuccess - code détecté:', code);
            const added = addCodeToTextarea(code);
            
            if (added) {
                updateLastCode(code);
                playBeep();
                
                const statusEl = document.getElementById("scanner-status");
                if (statusEl) {
                    statusEl.innerHTML = "✅ Code ajouté !";
                    statusEl.style.color = "#4CAF50";
                }
                
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(100);
                }
                
                document.body.style.backgroundColor = "#4CAF50";
                setTimeout(() => {
                    document.body.style.backgroundColor = "";
                }, 100);
                
                scanTimeout = setTimeout(() => {
                    scanTimeout = null;
                }, 2000);
            }
        };
        
        const onScanFailure = (errorMessage) => {
            // Ignorer les erreurs de scan normales
        };
        
        html5QrcodeScanner = new Html5Qrcode("qr-reader");
        debug('startScanner - html5QrcodeScanner créé');
        
        const cameraConfigs = [
            { facingMode: { exact: "environment" } },
            { facingMode: "environment" },
            { facingMode: "user" }
        ];
        
        let started = false;
        
        for (let i = 0; i < cameraConfigs.length; i++) {
            const cameraConfig = cameraConfigs[i];
            if (started) break;
            try {
                debug(`startScanner - essai config ${i+1}/${cameraConfigs.length}:`, JSON.stringify(cameraConfig));
                await html5QrcodeScanner.start(
                    cameraConfig,
                    config,
                    onScanSuccess,
                    onScanFailure
                );
                started = true;
                isScanning = true;
                debug(`startScanner - ✅ DÉMARRÉ avec succès (config ${i+1})`);
                const statusEl = document.getElementById("scanner-status");
                if (statusEl) {
                    statusEl.textContent = "Scannez un code-barres...";
                    statusEl.style.color = "";
                }
            } catch (err) {
                debug(`startScanner - échec config ${i+1}:`, err.message);
            }
        }
        
        if (!started) {
            debug('startScanner - ❌ ÉCHEC TOTAL: aucune configuration n\'a fonctionné');
            const statusEl = document.getElementById("scanner-status");
            if (statusEl) {
                statusEl.innerHTML = "❌ Impossible d'accéder à la caméra<br><small>Vérifiez les permissions</small>";
                statusEl.style.color = "#f44336";
            }
            document.getElementById("camera-scanner-container")?.remove();
            html5QrcodeScanner = null;
        }
        
        isStarting = false;
        debug('startScanner - fin du processus, isScanning=' + isScanning);
    }
    
    function stopScanner() {
        debug('stopScanner - appelée, isScanning=' + isScanning + ', html5QrcodeScanner=' + !!html5QrcodeScanner);
        
        if (scanTimeout) {
            clearTimeout(scanTimeout);
            scanTimeout = null;
        }
        
        if (html5QrcodeScanner && isScanning) {
            debug('stopScanner - arrêt en cours...');
            html5QrcodeScanner.stop().then(() => {
                debug('stopScanner - arrêt réussi');
                html5QrcodeScanner.clear();
                document.getElementById("camera-scanner-container")?.remove();
                html5QrcodeScanner = null;
                isScanning = false;
                
                setTimeout(() => {
                    if (typeof Editor !== 'undefined' && Editor.forceCloudSave) {
                        Editor.forceCloudSave();
                    }
                    if (typeof Tabs !== 'undefined' && Tabs.updateTabIndicators) {
                        Tabs.updateTabIndicators();
                    }
                    if (typeof Editor !== 'undefined' && Editor.updateLineCount) {
                        Editor.updateLineCount();
                    }
                }, 100);
                
            }).catch((err) => {
                debug('stopScanner - erreur arrêt:', err.message);
                document.getElementById("camera-scanner-container")?.remove();
                isScanning = false;
                html5QrcodeScanner = null;
            });
        } else {
            debug('stopScanner - rien à arrêter, nettoyage');
            document.getElementById("camera-scanner-container")?.remove();
            isScanning = false;
            html5QrcodeScanner = null;
            
            setTimeout(() => {
                if (typeof Editor !== 'undefined' && Editor.forceCloudSave) {
                    Editor.forceCloudSave();
                }
                if (typeof Tabs !== 'undefined' && Tabs.updateTabIndicators) {
                    Tabs.updateTabIndicators();
                }
                if (typeof Editor !== 'undefined' && Editor.updateLineCount) {
                    Editor.updateLineCount();
                }
            }, 100);
        }
    }
    
    function toggleFlash() {
        debug('toggleFlash - appelée');
        if (!html5QrcodeScanner || !isScanning || !hasFlash) return;
        
        html5QrcodeScanner.getRunningTrackCameraCapabilities().then(capabilities => {
            if (capabilities.torchFeature().isSupported()) {
                const torchOn = !capabilities.torchFeature().value();
                capabilities.torchFeature().apply(torchOn);
                
                const flashBtn = document.getElementById("toggle-flash");
                if (flashBtn) {
                    flashBtn.innerHTML = torchOn ? "🔦 Flash désactivé" : "🔦 Flash";
                }
                debug('toggleFlash - flash:', torchOn ? 'allumé' : 'éteint');
            }
        }).catch(() => {});
    }
    
    function addCodeToTextarea(code) {
        const note = document.getElementById("note");
        if (!note) {
            alert("Erreur: zone de texte non trouvée");
            return false;
        }
        
        if (!AppState.currentTab) {
            alert("Sélectionnez un onglet d'abord");
            return false;
        }
        
        if (note.value.length > 0 && !note.value.endsWith('\n')) {
            note.value += '\n' + code;
        } else {
            note.value += code;
        }
        
        if (note.value === '') {
            note.value = code;
        }
        
        AppState.files[AppState.currentTab] = note.value;
        
        localStorage.setItem('cdiFiles', JSON.stringify(AppState.files));
        localStorage.setItem('cdiTabOrder', JSON.stringify(AppState.tabOrder));
        localStorage.setItem('cdiCurrentTab', AppState.currentTab);
        
        Storage.saveState();
        
        if (window.Tabs) window.Tabs.updateTabIndicators();
        if (typeof Editor !== 'undefined') {
            Editor.updateLineCount();
        }
        
        updateLineCountDisplay();
        
        note.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    }
    
    function init() {
        debug('init - initialisation du scanner');
        const cameraBtn = document.getElementById("cameraScanBtn");
        const cameraBtnMobile = document.getElementById("cameraScanBtnMobile");
        
        debug('init - boutons trouvés:', {
            desktop: !!cameraBtn,
            mobile: !!cameraBtnMobile
        });
        
        if (cameraBtn) {
            const newBtn = cameraBtn.cloneNode(true);
            cameraBtn.parentNode.replaceChild(newBtn, cameraBtn);
            newBtn.addEventListener("click", (e) => {
                debug('init - clic sur bouton desktop');
                startScanner();
            });
            debug('init - bouton desktop attaché');
        }
        
        if (cameraBtnMobile) {
            const newBtnMobile = cameraBtnMobile.cloneNode(true);
            cameraBtnMobile.parentNode.replaceChild(newBtnMobile, cameraBtnMobile);
            newBtnMobile.addEventListener("click", (e) => {
                debug('init - clic sur bouton mobile (hamburger)');
                startScanner();
            });
            debug('init - bouton mobile attaché');
        }
        
        debug('📷 Scanner initialisé - prêt');
    }
    
    return {
        init,
        startScanner,
        stopScanner,
        get isScanning() { return isScanning; }
    };
})();