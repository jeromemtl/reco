/* -------------------- STORAGE & ÉTAT GLOBAL -------------------- */

const AppState = {
    files: {},
    tabOrder: [],
    currentTab: null,
    isRestoring: true
};

const Storage = {
    KEYS: {
        FILES: "cdiFiles",
        ORDER: "cdiTabOrder",
        CURRENT: "cdiCurrentTab",
        THEME: "cdiTheme",
        FONT_SIZE: "textareaFontSize"
    },

    formattedDateTime() {
        const d = new Date();
        const pad = n => String(n).padStart(2, "0");
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const time = `${pad(d.getHours())}h${pad(d.getMinutes())}`;
        return `${date}_${time}`;
    },

    loadState() {
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
        }
    },

    saveState() {
        localStorage.setItem(this.KEYS.FILES, JSON.stringify(AppState.files));
        localStorage.setItem(this.KEYS.ORDER, JSON.stringify(AppState.tabOrder));
        localStorage.setItem(this.KEYS.CURRENT, AppState.currentTab);
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