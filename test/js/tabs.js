/* -------------------- ONGLET & TABS -------------------- */

const Tabs = (() => {
    const note = document.getElementById("note");
    const tabsContainer = document.getElementById("tabs");
    
    let isRemoteUpdate = false;

    const addBtn = document.createElement("div");
    addBtn.id = "addTabBtn";
    addBtn.textContent = "+ Ajouter";

    function createTab(name) {
        if (AppState.files[name]) return false;
        AppState.files[name] = "";
        AppState.tabOrder.push(name);
        Storage.saveState();
        return true;
    }

    function updateTabIndicators() {
        document.querySelectorAll(".tab").forEach(tab => {
            const name = tab.dataset.name;
            const content = AppState.files[name] || "";
            if (content.trim().length > 0) {
                tab.classList.add("hasContent");
            } else {
                tab.classList.remove("hasContent");
            }
        });
    }

    function reorderTabs(dragged, target) {
        const oldIndex = AppState.tabOrder.indexOf(dragged);
        const newIndex = AppState.tabOrder.indexOf(target);
        if (oldIndex === -1 || newIndex === -1) return;
        AppState.tabOrder.splice(oldIndex, 1);
        AppState.tabOrder.splice(newIndex, 0, dragged);
        Storage.saveState();
    }

    function renderTabs() {
        [...tabsContainer.children].forEach(el => {
            if (el.id !== "addTabBtn") el.remove();
        });

        AppState.tabOrder.forEach(name => {
            const tab = document.createElement("div");
            tab.className = "tab";
            tab.textContent = name;
            tab.dataset.name = name;
            tab.draggable = true;

            tab.addEventListener("click", () => switchTab(name));

            tab.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                UI.setClickedTab(name);
                UI.showContextMenu(e.pageX, e.pageY);
            });

            tab.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", name);
            });

            tab.addEventListener("dragover", (e) => e.preventDefault());

            tab.addEventListener("drop", (e) => {
                e.preventDefault();
                const dragged = e.dataTransfer.getData("text/plain");
                const target = name;
                if (!dragged || dragged === target) return;
                reorderTabs(dragged, target);
                renderTabs();
                Editor.autoSave();
            });

            tabsContainer.insertBefore(tab, addBtn);
        });

        updateTabIndicators();
    }

    function switchTab(name) {
        if (!AppState.isRestoring && AppState.currentTab !== null && !isRemoteUpdate) {
            AppState.files[AppState.currentTab] = note.value;
        }
        
        // Si c'est une mise à jour distante, ne pas déclencher de sauvegarde
        if (!isRemoteUpdate) {
            Storage.saveState();
        }

        AppState.currentTab = name;
        note.value = AppState.files[name] || "";

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        [...tabsContainer.children].forEach(t => {
            if (t.dataset.name === name) t.classList.add("active");
        });

        Editor.updateLineCount();
    }

    function resetAllTabs() {
        if (!confirm("Voulez-vous vraiment tout réinitialiser ?\nTous les onglets et contenus seront supprimés.")) {
            return;
        }

        AppState.files = {};
        AppState.tabOrder = [
            "000","100","200","300","400","500","600","700","800","900",
            "A","BD","C","M","N","P","R","T","FL"
        ];

        AppState.tabOrder.forEach(name => AppState.files[name] = "");

        AppState.currentTab = "000";
        note.value = "";
        Editor.updateLineCount();

        Storage.saveState();
        renderTabs();
        switchTab("000");
    }

    function initAddButton() {
        addBtn.addEventListener("click", () => {
            const name = prompt("Nom du nouvel onglet :");
            if (!name) return;

            if (!createTab(name)) {
                alert("Un onglet portant ce nom existe déjà.");
                return;
            }

            renderTabs();
            switchTab(name);
            Editor.autoSave();
        });
        tabsContainer.appendChild(addBtn);
    }

    function renameTab(oldName, newName) {
        if (!newName || newName === oldName) return;

        if (AppState.files[newName]) {
            alert("Un onglet portant ce nom existe déjà.");
            return;
        }

        AppState.files[newName] = AppState.files[oldName];
        delete AppState.files[oldName];

        const index = AppState.tabOrder.indexOf(oldName);
        if (index !== -1) AppState.tabOrder[index] = newName;

        if (AppState.currentTab === oldName) AppState.currentTab = newName;

        renderTabs();
        switchTab(newName);
        Editor.autoSave();
    }

    function deleteTab(name) {
        if (!confirm(`Supprimer l’onglet "${name}" ?`)) return;

        delete AppState.files[name];
        AppState.tabOrder = AppState.tabOrder.filter(n => n !== name);

        if (AppState.tabOrder.length > 0) {
            AppState.currentTab = AppState.tabOrder[0];
            note.value = AppState.files[AppState.currentTab] || "";
        } else {
            AppState.currentTab = null;
            note.value = "";
        }

        Editor.updateLineCount();
        renderTabs();
        if (AppState.currentTab) switchTab(AppState.currentTab);
        Editor.autoSave();
    }

    function replaceAllTabsFromList(list) {
        const lines = list
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.length > 0);

        if (lines.length === 0) {
            alert("Aucun nom d’onglet fourni.");
            return false;
        }

        const unique = [...new Set(lines)];

        AppState.files = {};
        AppState.tabOrder = [];

        unique.forEach(name => {
            AppState.files[name] = "";
            AppState.tabOrder.push(name);
        });

        AppState.currentTab = unique[0];
        note.value = "";
        Editor.updateLineCount();

        Storage.saveState();
        renderTabs();
        switchTab(AppState.currentTab);

        return true;
    }
    
    // Callbacks pour les mises à jour distantes
    function onRemoteUpdate(files, changes) {
        isRemoteUpdate = true;
        
        // Mettre à jour les fichiers
        AppState.files = files;
        
        // Appliquer les changements à l'UI si nécessaire
        updateTabIndicators();
        
        // Si l'onglet courant a changé et qu'on est dessus
        if (AppState.currentTab && AppState.files[AppState.currentTab] !== undefined) {
            const currentValue = note.value;
            const newValue = AppState.files[AppState.currentTab] || "";
            if (currentValue !== newValue) {
                note.value = newValue;
                Editor.updateLineCount();
            }
        }
        
        isRemoteUpdate = false;
    }
    
    function onOrderUpdate(order) {
        if (order && Array.isArray(order) && order.length > 0) {
            isRemoteUpdate = true;
            AppState.tabOrder = order;
            renderTabs();
            
            // Re-sélectionner l'onglet courant
            if (AppState.currentTab) {
                const tabExists = AppState.tabOrder.includes(AppState.currentTab);
                if (tabExists) {
                    switchTab(AppState.currentTab);
                } else if (AppState.tabOrder.length > 0) {
                    switchTab(AppState.tabOrder[0]);
                }
            }
            isRemoteUpdate = false;
        }
    }
    
    function onCurrentTabUpdate(currentTab) {
        if (currentTab && currentTab !== AppState.currentTab) {
            isRemoteUpdate = true;
            switchTab(currentTab);
            isRemoteUpdate = false;
        }
    }

    function init() {
        initAddButton();
        renderTabs();
        if (AppState.currentTab) switchTab(AppState.currentTab);
    }

    return {
        init,
        renderTabs,
        switchTab,
        resetAllTabs,
        renameTab,
        deleteTab,
        replaceAllTabsFromList,
        updateTabIndicators,
        onRemoteUpdate,
        onOrderUpdate,
        onCurrentTabUpdate
    };
})();