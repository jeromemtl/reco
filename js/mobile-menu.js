/* -------------------- MENU MOBILE (HAMBURGER) -------------------- */

const MobileMenu = (() => {
    let isOpen = false;
    
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMenuBtn');
    
    function openMenu() {
        if (!mobileNav || !overlay || !hamburger) return;
        mobileNav.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
        isOpen = true;
    }
    
    function closeMenu() {
        if (!mobileNav || !overlay || !hamburger) return;
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
        isOpen = false;
    }
    
    function toggleMenu() {
        if (isOpen) closeMenu();
        else openMenu();
    }
    
    function bindMobileButtons() {
        // Scanner caméra
        const cameraBtnMobile = document.getElementById('cameraScanBtnMobile');
        const cameraBtnDesktop = document.getElementById('cameraScanBtn');
        if (cameraBtnMobile && cameraBtnDesktop) {
            cameraBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                cameraBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Exporter l'onglet
        const saveBtnMobile = document.getElementById('saveBtnTopMobile');
        const saveBtnDesktop = document.getElementById('saveBtnTop');
        if (saveBtnMobile && saveBtnDesktop) {
            saveBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                saveBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Exporter tous
        const saveAllBtnMobile = document.getElementById('saveAllBtnTopMobile');
        const saveAllBtnDesktop = document.getElementById('saveAllBtnTop');
        if (saveAllBtnMobile && saveAllBtnDesktop) {
            saveAllBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                saveAllBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Remplacer onglets
        const replaceBtnMobile = document.getElementById('replaceTabsBtnMobile');
        const replaceBtnDesktop = document.getElementById('replaceTabsBtn');
        if (replaceBtnMobile && replaceBtnDesktop) {
            replaceBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                replaceBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Réinitialiser
        const resetBtnMobile = document.getElementById('resetBtnTopMobile');
        const resetBtnDesktop = document.getElementById('resetBtnTop');
        if (resetBtnMobile && resetBtnDesktop) {
            resetBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                resetBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Statistiques
        const statsBtnMobile = document.getElementById('statsBtnMobile');
        const statsBtnDesktop = document.getElementById('statsBtn');
        if (statsBtnMobile && statsBtnDesktop) {
            statsBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                statsBtnDesktop.click();
                closeMenu();
            });
        }
        
        // Thème (gestion spéciale avec remplacement d'événement)
        const themeBtnMobile = document.getElementById('themeBtnTopMobile');
        const themeBtnDesktop = document.getElementById('themeBtnTop');
        if (themeBtnMobile && themeBtnDesktop) {
            // Remplacer l'élément pour supprimer tous les anciens événements
            const newThemeBtn = themeBtnMobile.cloneNode(true);
            themeBtnMobile.parentNode.replaceChild(newThemeBtn, themeBtnMobile);
            
            newThemeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                themeBtnDesktop.click();
                
                // Mettre à jour l'icône du menu mobile après changement de thème
                setTimeout(() => {
                    const isDark = document.body.classList.contains('dark');
                    const iconSpan = newThemeBtn.querySelector('.btn-icon');
                    const textSpan = newThemeBtn.querySelector('.btn-text');
                    if (iconSpan) {
                        iconSpan.textContent = isDark ? '☀️' : '🌙';
                    }
                    if (textSpan && !textSpan.textContent.includes('Mode')) {
                        textSpan.textContent = isDark ? 'Mode clair' : 'Mode nuit';
                    }
                    closeMenu();
                }, 100);
            });
            
            // Mettre à jour la référence
            const mobileNavContent = document.querySelector('.mobile-nav-content');
            if (mobileNavContent) {
                const updatedBtn = document.getElementById('themeBtnTopMobile');
                if (updatedBtn) {
                    // Remplacer dans l'objet si nécessaire
                }
            }
        }
        
        // Déconnexion
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');
        const logoutBtnDesktop = document.getElementById('logoutBtn');
        if (logoutBtnMobile && logoutBtnDesktop) {
            logoutBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                logoutBtnDesktop.click();
                closeMenu();
            });
        }
    }
    
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && isOpen) closeMenu();
    }
    
    function updateThemeIcon() {
        const themeBtnMobile = document.getElementById('themeBtnTopMobile');
        if (!themeBtnMobile) return;
        const isDark = document.body.classList.contains('dark');
        const iconSpan = themeBtnMobile.querySelector('.btn-icon');
        const textSpan = themeBtnMobile.querySelector('.btn-text');
        if (iconSpan) iconSpan.textContent = isDark ? '☀️' : '🌙';
        if (textSpan && !textSpan.textContent.includes('Mode')) {
            textSpan.textContent = isDark ? 'Mode clair' : 'Mode nuit';
        }
    }
    
    function observeThemeChanges() {
        const observer = new MutationObserver(() => updateThemeIcon());
        observer.observe(document.body, { attributes: true });
        updateThemeIcon();
    }
    
    function handleResize() {
        if (window.innerWidth > 768 && isOpen) closeMenu();
    }
    
    function init() {
        if (!hamburger || !mobileNav || !overlay) {
            console.warn('⚠️ Éléments du menu mobile non trouvés');
            return;
        }
        
        hamburger.addEventListener('click', toggleMenu);
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);
        if (overlay) overlay.addEventListener('click', closeMenu);
        document.addEventListener('keydown', handleEscapeKey);
        window.addEventListener('resize', handleResize);
        bindMobileButtons();
        observeThemeChanges();
        
        debugLog('📱 Menu mobile initialisé');
    }
    
    return {
        init,
        open: openMenu,
        close: closeMenu,
        toggle: toggleMenu,
        isOpen: () => isOpen
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileMenu.init());
} else {
    MobileMenu.init();
}