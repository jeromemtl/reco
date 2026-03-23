/* -------------------- MENU MOBILE (HAMBURGER) -------------------- */

const MobileMenu = (() => {
    let isOpen = false;
    
    // Éléments DOM
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMenuBtn');
    
    // Boutons du menu mobile
    const mobileButtons = {
        cameraScan: document.getElementById('cameraScanBtnMobile'),
        save: document.getElementById('saveBtnTopMobile'),
        saveAll: document.getElementById('saveAllBtnTopMobile'),
        replaceTabs: document.getElementById('replaceTabsBtnMobile'),
        reset: document.getElementById('resetBtnTopMobile'),
        stats: document.getElementById('statsBtnMobile'),
        theme: document.getElementById('themeBtnTopMobile')
    };
    
    // Boutons desktop correspondants
    const desktopButtons = {
        cameraScan: document.getElementById('cameraScanBtn'),
        save: document.getElementById('saveBtnTop'),
        saveAll: document.getElementById('saveAllBtnTop'),
        replaceTabs: document.getElementById('replaceTabsBtn'),
        reset: document.getElementById('resetBtnTop'),
        stats: document.getElementById('statsBtn'),
        theme: document.getElementById('themeBtnTop')
    };
    
    // Fonction pour ouvrir le menu
    function openMenu() {
        if (!mobileNav || !overlay || !hamburger) return;
        
        mobileNav.classList.add('open');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden'; // Empêche le scroll arrière
        isOpen = true;
    }
    
    // Fonction pour fermer le menu
    function closeMenu() {
        if (!mobileNav || !overlay || !hamburger) return;
        
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
        isOpen = false;
    }
    
    // Toggle du menu
    function toggleMenu() {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Liaison des événements des boutons mobiles avec les boutons desktop
    function bindMobileButtons() {
        // Scanner caméra
        if (mobileButtons.cameraScan && desktopButtons.cameraScan) {
            mobileButtons.cameraScan.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.cameraScan.click();
                closeMenu();
            });
        }
        
        // Exporter l'onglet
        if (mobileButtons.save && desktopButtons.save) {
            mobileButtons.save.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.save.click();
                closeMenu();
            });
        }
        
        // Exporter tous les onglets
        if (mobileButtons.saveAll && desktopButtons.saveAll) {
            mobileButtons.saveAll.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.saveAll.click();
                closeMenu();
            });
        }
        
        // Remplacer les onglets
        if (mobileButtons.replaceTabs && desktopButtons.replaceTabs) {
            mobileButtons.replaceTabs.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.replaceTabs.click();
                closeMenu();
            });
        }
        
        // Réinitialiser
        if (mobileButtons.reset && desktopButtons.reset) {
            mobileButtons.reset.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.reset.click();
                closeMenu();
            });
        }
        
        // Statistiques
        if (mobileButtons.stats && desktopButtons.stats) {
            mobileButtons.stats.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.stats.click();
                closeMenu();
            });
        }
        
        // Thème
        if (mobileButtons.theme && desktopButtons.theme) {
            mobileButtons.theme.addEventListener('click', (e) => {
                e.preventDefault();
                desktopButtons.theme.click();
                closeMenu();
            });
        }
    }
    
    // Fermer le menu avec la touche Échap
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && isOpen) {
            closeMenu();
        }
    }
    
    // Mettre à jour l'icône du thème dans le menu mobile
    function updateThemeIcon() {
        if (!mobileButtons.theme) return;
        
        const isDark = document.body.classList.contains('dark');
        const iconSpan = mobileButtons.theme.querySelector('.btn-icon');
        const textSpan = mobileButtons.theme.querySelector('.btn-text');
        
        if (iconSpan) {
            iconSpan.textContent = isDark ? '☀️' : '🌙';
        }
        if (textSpan && !textSpan.textContent.includes('Mode')) {
            textSpan.textContent = isDark ? 'Mode clair' : 'Mode nuit';
        }
    }
    
    // Observer les changements de thème pour mettre à jour l'icône
    function observeThemeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    updateThemeIcon();
                }
            });
        });
        
        observer.observe(document.body, { attributes: true });
        updateThemeIcon();
    }
    
    // Vérifier si l'appareil est mobile
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }
    
    // Réinitialiser l'état du menu lors du redimensionnement
    function handleResize() {
        if (!isMobileDevice() && isOpen) {
            // Si on passe en mode desktop avec le menu ouvert, on le ferme
            closeMenu();
        }
    }
    
    // Initialisation
    function init() {
        if (!hamburger || !mobileNav || !overlay) {
            console.warn('⚠️ Éléments du menu mobile non trouvés');
            return;
        }
        
        // Événements
        hamburger.addEventListener('click', toggleMenu);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }
        
        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }
        
        document.addEventListener('keydown', handleEscapeKey);
        window.addEventListener('resize', handleResize);
        
        // Liaison des boutons
        bindMobileButtons();
        
        // Observer les changements de thème
        observeThemeChanges();
        
        console.log('📱 Menu mobile initialisé');
    }
    
    // Exposer les méthodes utiles
    return {
        init,
        open: openMenu,
        close: closeMenu,
        toggle: toggleMenu,
        isOpen: () => isOpen
    };
})();

// Initialisation automatique quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MobileMenu.init();
    });
} else {
    MobileMenu.init();
}