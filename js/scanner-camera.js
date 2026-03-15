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
    
    // Créer l'interface du scanner
    async function createScannerUI() {
        const oldContainer = document.getElementById("camera-scanner-container");
        if (oldContainer) oldContainer.remove();
        
        const currentTabName = AppState.currentTab || "Aucun";
        
        hasFlash = await checkFlashSupport();
        
        const container = document.createElement("div");
        container.id = "camera-scanner-container";
        
        const flashButtonHTML = hasFlash ? `
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                <button id="toggle-flash" style="
                    padding: 10px 20px;
                    background: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">🔦 Flash</button>
            </div>
        ` : '';
        
        container.innerHTML = `
            <div id="scanner-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            ">
                <div style="
                    background: white;
                    padding: 15px;
                    border-radius: 15px;
                    width: 95%;
                    max-width: 500px;
                    text-align: center;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin:0;">📷 Scanner</h3>
                        <div style="
                            background: #e3f2fd;
                            color: #1976d2;
                            padding: 5px 10px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: bold;
                        ">
                            📌 ${currentTabName}
                        </div>
                        <button id="close-scanner" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            padding: 0 10px;
                        ">✖</button>
                    </div>
                    
                    <div id="qr-reader" style="width: 100%; margin: 0 auto;"></div>
                    
                    ${flashButtonHTML}
                    
                    <p id="scanner-status" style="margin: 15px 0 5px 0; color: #666; font-size: 14px;">
                        Pointez la caméra vers un code-barres
                    </p>
                    
                    <div style="display: flex; gap: 20px; justify-content: center; margin: 10px 0;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="checkbox" id="beep-option" checked> 
                            <span style="font-size: 16px;">🔊 Bip sonore</span>
                        </label>
                    </div>
                    
                    <div id="last-code-container" style="
                        margin-top: 15px;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        font-family: monospace;
                        font-size: 14px;
                        text-align: left;
                        word-break: break-all;
                    ">
                        <div style="font-weight: bold; margin-bottom: 5px; color: #333;">📋 Dernier code ajouté :</div>
                        <div id="last-code-display" style="color: #2ecc71;">—</div>
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
    
    async function startScanner() {
        if (isScanning) return;
        
        await createScannerUI();
        
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
            disableFlip: true,
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };
        
        html5QrcodeScanner = new Html5Qrcode("qr-reader");
        
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
        
        const onScanFailure = (errorMessage) => {};
        
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            isScanning = true;
            const statusEl = document.getElementById("scanner-status");
            if (statusEl) {
                statusEl.textContent = "Scannez un code-barres...";
            }
        }).catch((err) => {
            const statusEl = document.getElementById("scanner-status");
            if (statusEl) {
                statusEl.innerHTML = "❌ Erreur d'accès à la caméra<br><small>Vérifiez les permissions</small>";
                statusEl.style.color = "#f44336";
            }
        });
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
        
        note.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
    }
    
    function init() {
        const cameraBtn = document.getElementById("cameraScanBtn");
        if (cameraBtn) {
            cameraBtn.addEventListener("click", startScanner);
        }
    }
    
    return {
        init,
        startScanner,
        stopScanner,
        get isScanning() { return isScanning; }
    };
})();