/* -------------------- SCANNER CAMÉRA -------------------- */

const CameraScanner = (() => {
    let html5QrcodeScanner = null;
    let isScanning = false;
    let scanTimeout = null;
    let audioContext = null;
    let hasFlash = false;
    
    // Vérifier si le flash est supporté
    async function checkFlashSupport() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return false;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');
            if (!hasCamera) {
                return false;
            }
            
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
            
            return !!(capabilities && capabilities.torch);
        } catch (error) {
            return false;
        }
    }
    
    // Créer un bip sonore avec l'API Web Audio
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
    
    // Obtenir le nombre de lignes de l'onglet courant
    function getCurrentTabLineCount() {
        if (!AppState.currentTab) return 0;
        
        const content = AppState.files[AppState.currentTab] || "";
        const lines = content.split("\n").filter(l => l.trim() !== "").length;
        return lines;
    }
    
    // Mettre à jour l'affichage du compteur
    function updateLineCountDisplay() {
        const lineCountBadge = document.querySelector('.badge-lines');
        if (lineCountBadge && AppState.currentTab) {
            const lineCount = getCurrentTabLineCount();
            lineCountBadge.innerHTML = `📊 ${lineCount} ligne${lineCount > 1 ? 's' : ''}`;
        }
    }
    
    // Créer l'interface du scanner
    async function createScannerUI() {
        const oldContainer = document.getElementById("camera-scanner-container");
        if (oldContainer) oldContainer.remove();
        
        const currentTabName = AppState.currentTab || "Aucun";
        const lineCount = getCurrentTabLineCount();
        
        hasFlash = await checkFlashSupport();
        
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
                    
                    <select id="camera-select" style="margin: 10px auto; display: block; padding: 8px; border-radius: 5px; background: var(--bg-light); color: var(--text-light);">
                        <option value="">Chargement des caméras...</option>
                    </select>
                    
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
        
        document.getElementById("close-scanner").addEventListener("click", stopScanner);
        
        if (hasFlash) {
            document.getElementById("toggle-flash").addEventListener("click", toggleFlash);
        }
        
        return container;
    }
    
    function updateLastCode(code) {
        const lastCodeDisplay = document.getElementById("last-code-display");
        if (lastCodeDisplay) {
            lastCodeDisplay.textContent = code;
        }
    }
    
    // Fonction pour lister les caméras disponibles
    async function listCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('📷 Caméras disponibles:', videoDevices);
            
            const cameraSelect = document.getElementById('camera-select');
            if (cameraSelect && videoDevices.length > 0) {
                cameraSelect.innerHTML = videoDevices.map((device, i) => 
                    `<option value="${device.deviceId}">Caméra ${i + 1}${device.label ? ` (${device.label})` : ''}</option>`
                ).join('');
                cameraSelect.insertAdjacentHTML('afterbegin', '<option value="">Auto</option>');
                cameraSelect.value = '';
            }
            return videoDevices;
        } catch (err) {
            console.error('Erreur liste caméras:', err);
            return [];
        }
    }
    
    async function startScanner() {
        if (isScanning) return;
        
        // Vérifier si la caméra est disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("❌ Votre navigateur ne supporte pas l'accès à la caméra.\n\n" +
                  "Utilisez Chrome, Safari ou Firefox sur mobile.");
            return;
        }
        
        // Tester l'accès caméra avant d'ouvrir l'UI
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            testStream.getTracks().forEach(track => track.stop());
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                alert("❌ Accès à la caméra refusé.\n\n" +
                      "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
            } else if (err.name === 'NotFoundError') {
                alert("❌ Aucune caméra trouvée sur cet appareil.");
            } else {
                alert(`❌ Erreur caméra: ${err.message}`);
            }
            return;
        }
        
        await createScannerUI();
        
        // Lister les caméras disponibles
        const videoDevices = await listCameras();
        
        const config = {
            fps: 15,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const height = Math.min(150, viewfinderHeight * 0.6);
                const width = Math.min(300, height * 2);
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
            const added = addCodeToTextarea(code);
            
            if (added) {
                updateLastCode(code);
                playBeep();
                
                document.getElementById("scanner-status").innerHTML = "✅ Code ajouté !";
                document.getElementById("scanner-status").style.color = "#4CAF50";
                
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
        
        // Fonction pour démarrer avec une caméra spécifique
        const startWithCamera = async (cameraId = null) => {
            const cameraConfig = cameraId 
                ? { deviceId: { exact: cameraId } }
                : { facingMode: "environment" };
            
            return html5QrcodeScanner.start(
                cameraConfig,
                config,
                onScanSuccess,
                onScanFailure
            );
        };
        
        // Essayer avec la caméra arrière d'abord
        try {
            await startWithCamera();
            isScanning = true;
            const statusEl = document.getElementById("scanner-status");
            if (statusEl) {
                statusEl.textContent = "Scannez un code-barres...";
            }
        } catch (err) {
            console.log('Erreur avec caméra arrière, essai caméra avant:', err);
            
            // Fallback : caméra avant
            try {
                await startWithCamera();
                isScanning = true;
                const statusEl = document.getElementById("scanner-status");
                if (statusEl) {
                    statusEl.textContent = "Scannez un code-barres (caméra avant)...";
                }
            } catch (err2) {
                console.error('Échec caméra avant:', err2);
                
                // Dernier fallback : première caméra disponible
                if (videoDevices.length > 0) {
                    try {
                        await startWithCamera(videoDevices[0].deviceId);
                        isScanning = true;
                        const statusEl = document.getElementById("scanner-status");
                        if (statusEl) {
                            statusEl.textContent = "Scannez un code-barres...";
                        }
                    } catch (err3) {
                        const statusEl = document.getElementById("scanner-status");
                        if (statusEl) {
                            statusEl.innerHTML = "❌ Impossible d'accéder à la caméra<br><small>Vérifiez les permissions</small>";
                            statusEl.style.color = "#f44336";
                        }
                    }
                } else {
                    const statusEl = document.getElementById("scanner-status");
                    if (statusEl) {
                        statusEl.innerHTML = "❌ Aucune caméra détectée";
                        statusEl.style.color = "#f44336";
                    }
                }
            }
        }
        
        // Gestionnaire de changement de caméra
        const cameraSelect = document.getElementById('camera-select');
        if (cameraSelect) {
            cameraSelect.addEventListener('change', async (e) => {
                if (html5QrcodeScanner && isScanning) {
                    const newCameraId = e.target.value;
                    if (!newCameraId) return;
                    
                    try {
                        await html5QrcodeScanner.stop();
                        await startWithCamera(newCameraId);
                        const statusEl = document.getElementById("scanner-status");
                        if (statusEl) {
                            statusEl.textContent = "Caméra changée, prêt à scanner";
                        }
                    } catch (err) {
                        console.error('Erreur changement caméra:', err);
                        const statusEl = document.getElementById("scanner-status");
                        if (statusEl) {
                            statusEl.innerHTML = "❌ Impossible de changer de caméra";
                            statusEl.style.color = "#f44336";
                        }
                    }
                }
            });
        }
    }
    
    function stopScanner() {
        if (AppState.currentTab) {
            const note = document.getElementById("note");
            if (note) {
                AppState.files[AppState.currentTab] = note.value;
                Storage.saveState();
            }
        }
        
        if (scanTimeout) {
            clearTimeout(scanTimeout);
            scanTimeout = null;
        }
        
        if (html5QrcodeScanner && isScanning) {
            html5QrcodeScanner.stop().then(() => {
                html5QrcodeScanner.clear();
                document.getElementById("camera-scanner-container")?.remove();
                html5QrcodeScanner = null;
                isScanning = false;
                
                setTimeout(() => {
                    if (typeof Editor !== 'undefined' && Editor.autoSave) {
                        Editor.autoSave();
                    }
                    if (typeof Tabs !== 'undefined' && Tabs.updateTabIndicators) {
                        Tabs.updateTabIndicators();
                    }
                    if (typeof Editor !== 'undefined' && Editor.updateLineCount) {
                        Editor.updateLineCount();
                    }
                }, 100);
                
            }).catch(() => {
                document.getElementById("camera-scanner-container")?.remove();
                isScanning = false;
            });
        } else {
            document.getElementById("camera-scanner-container")?.remove();
            isScanning = false;
            
            setTimeout(() => {
                if (typeof Editor !== 'undefined' && Editor.autoSave) {
                    Editor.autoSave();
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
        if (!html5QrcodeScanner || !isScanning || !hasFlash) return;
        
        html5QrcodeScanner.getRunningTrackCameraCapabilities().then(capabilities => {
            if (capabilities.torchFeature().isSupported()) {
                const torchOn = !capabilities.torchFeature().value();
                capabilities.torchFeature().apply(torchOn);
                
                const flashBtn = document.getElementById("toggle-flash");
                if (flashBtn) {
                    flashBtn.innerHTML = torchOn ? "🔦 Flash désactivé" : "🔦 Flash";
                }
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
        Storage.saveState();
        
        if (typeof Editor !== 'undefined') {
            Editor.updateLineCount();
        }
        
        updateLineCountDisplay();
        
        note.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    }
    
    function init() {
        const cameraBtn = document.getElementById("cameraScanBtn");
        const cameraBtnMobile = document.getElementById("cameraScanBtnMobile");
        
        if (cameraBtn) {
            cameraBtn.addEventListener("click", startScanner);
        }
        if (cameraBtnMobile) {
            cameraBtnMobile.addEventListener("click", startScanner);
        }
        
        console.log('📷 Scanner initialisé');
    }
    
    return {
        init,
        startScanner,
        stopScanner,
        get isScanning() { return isScanning; }
    };
})();
