/* -------------------- GESTION DES MODALES -------------------- */

(function() {
    // Modales RGPD
    const privacyModal = document.getElementById('privacyModal');
    const legalModal = document.getElementById('legalModal');
    const privacyLink = document.getElementById('privacyLink');
    const legalLink = document.getElementById('legalLink');
    const privacyClose = document.getElementById('privacyClose');
    const legalClose = document.getElementById('legalClose');
    
    // Modale de changement de mode
    const modeSwitchModal = document.getElementById('modeSwitchModal');
    const modeSwitchTitle = document.getElementById('modeSwitchTitle');
    const modeSwitchMessage = document.getElementById('modeSwitchMessage');
    const modeSwitchCancel = document.getElementById('modeSwitchCancel');
    const modeSwitchConfirm = document.getElementById('modeSwitchConfirm');
    
    let pendingMode = null;
    let pendingUAI = null;
    
    function openModal(modal) {
        if (modal) modal.style.display = 'flex';
    }
    
    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }
    
    // Gestion modales RGPD
    if (privacyLink) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(privacyModal);
        });
    }
    
    if (legalLink) {
        legalLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(legalModal);
        });
    }
    
    if (privacyClose) {
        privacyClose.addEventListener('click', () => closeModal(privacyModal));
    }
    
    if (legalClose) {
        legalClose.addEventListener('click', () => closeModal(legalModal));
    }
    
    // Fermeture des modales RGPD en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) closeModal(privacyModal);
        if (e.target === legalModal) closeModal(legalModal);
        if (e.target === modeSwitchModal) closeModal(modeSwitchModal);
    });
    
    // Gestion de l'affichage du message d'aide UAI selon le mode
    const modeCollab = document.getElementById('modeCollab');
    const modeSolo = document.getElementById('modeSolo');
    const uaiHelp = document.getElementById('uaiHelp');
    
    function updateUAIHelp() {
        if (modeCollab && modeCollab.checked) {
            uaiHelp.textContent = 'Obligatoire en mode collaboratif';
            uaiHelp.style.color = '#666';
        } else {
            uaiHelp.textContent = 'Optionnel en mode solo (utilisé pour les statistiques)';
            uaiHelp.style.color = '#4CAF50';
        }
    }
    
    if (modeCollab && modeSolo) {
        modeCollab.addEventListener('change', updateUAIHelp);
        modeSolo.addEventListener('change', updateUAIHelp);
        updateUAIHelp();
    }
    
    // Fonction pour afficher la modale de changement de mode
    function showModeSwitchModal(targetMode, targetUAI) {
        pendingMode = targetMode;
        pendingUAI = targetUAI;
        
        // Récupérer le nombre de lignes locales
        let localLines = 0;
        if (window.AppState && window.AppState.files) {
            for (const content of Object.values(window.AppState.files)) {
                if (content) {
                    localLines += content.split('\n').filter(l => l.trim()).length;
                }
            }
        }
        
        if (targetMode === 'collab') {
            modeSwitchTitle.innerHTML = '⚠️ Passage en mode collaboratif';
            modeSwitchMessage.innerHTML = `
                <p><strong>📤 Vos données locales vont être synchronisées dans le cloud.</strong></p>
                <p>Ce qui va se passer :</p>
                <ul>
                    <li>Vous avez actuellement <strong>${localLines} lignes</strong> en local.</li>
                    <li>Si d'autres appareils utilisent le même UAI (<strong>${pendingUAI || '?'}</strong>), les données seront fusionnées (concaténées).</li>
                    <li>Aucune perte de données.</li>
                    <li>Tous les appareils verront les mêmes données.</li>
                </ul>
                <p>Souhaitez-vous continuer ?</p>
            `;
        } else {
            modeSwitchTitle.innerHTML = '⚠️ Passage en mode solo';
            modeSwitchMessage.innerHTML = `
                <p><strong>📤 Vos données ne seront plus synchronisées.</strong></p>
                <p>Ce qui va se passer :</p>
                <ul>
                    <li>Les modifications que vous ferez ne seront pas envoyées aux autres appareils.</li>
                    <li>Les modifications des autres appareils ne seront pas visibles sur celui-ci.</li>
                    <li>Les données restent disponibles sur les autres appareils.</li>
                    <li>Vos données locales actuelles (<strong>${localLines} lignes</strong>) seront conservées.</li>
                </ul>
                <p>Souhaitez-vous continuer ?</p>
            `;
        }
        
        openModal(modeSwitchModal);
    }
    
    function closeModeSwitchModal() {
        closeModal(modeSwitchModal);
        pendingMode = null;
        pendingUAI = null;
    }
    
    if (modeSwitchCancel) {
        modeSwitchCancel.addEventListener('click', closeModeSwitchModal);
    }
    
    if (modeSwitchConfirm) {
        modeSwitchConfirm.addEventListener('click', async () => {
            closeModeSwitchModal();
            
            // Simuler le clic sur le bouton de connexion avec le mode choisi
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn && pendingMode) {
                // Mettre à jour le mode sélectionné
                const modeRadio = document.getElementById(pendingMode === 'collab' ? 'modeCollab' : 'modeSolo');
                if (modeRadio) modeRadio.checked = true;
                
                // Mettre à jour l'UAI
                const uaiInput = document.getElementById('uaiInput');
                if (uaiInput && pendingUAI) uaiInput.value = pendingUAI;
                
                // Déclencher la connexion
                loginBtn.click();
            }
        });
    }
    
    // Exposer la fonction globalement
    window.showModeSwitchModal = showModeSwitchModal;
    
    // Fermeture avec Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(privacyModal);
            closeModal(legalModal);
            closeModal(modeSwitchModal);
        }
    });
})();