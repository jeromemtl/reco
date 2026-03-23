/* -------------------- MENU MOBILE (HAMBURGER) -------------------- */

const MobileMenu = (() => {
    let isOpen = false;
    
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeMenuBtn');
    
    const mobileButtons = {
        cameraScan: document.getElementById('cameraScanBtnMobile'),
        save: document.getElementById('saveBtnTopMobile'),
        saveAll: document.getElementById('saveAllBtnTopMobile'),
        replaceTabs: document.getElementById('replaceTabsBtnMobile'),
        reset: document.getElementById('resetBtnTopMobile'),
        stats: document.getElementById('statsBtnMobile'),
        theme: document.getElementById('themeBtnTopMobile'),
        logout: document.getElementById('logoutBtnMobile')
    };
    
    const desktopButtons = {
        cameraScan: document.getElementById('cameraScanBtn'),
        save: document.getElementById('saveBtnTop'),
        saveAll: document.getElementById('saveAllBtnTop'),
        replaceTabs: document.getElementById('replaceTabsBtn'),
        reset: document.getElementById('resetBtnTop'),
        stats: document.getElementById('statsBtn'),
        theme: document.getElementById('themeBtnTop'),
        logout: document.getElementById('logoutBtn')
    };
    
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
        for (const [key, mobileBtn] of Object.entries(mobileButtons)) {
            const desktopBtn = desktopButtons[key];
            if (mobileBtn && desktopBtn) {
                mobileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    desktopBtn.click();
                    closeMenu();
                });
            }
        }
    }
    
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && isOpen) closeMenu();
    }
    
    function updateThemeIcon() {
        if (!mobileButtons.theme) return;
        const isDark = document.body.classList.contains('dark');
        const iconSpan = mobileButtons.theme.querySelector('.btn-icon');
        const textSpan = mobileButtons.theme.querySelector('.btn-text');
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
        
        console.log('📱 Menu mobile initialisé');
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