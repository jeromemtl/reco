/* -------------------- ONGLET & TABS -------------------- */

const Tabs = (() => {
    const note = document.getElementById("note");
    const tabsContainer = document.getElementById("tabs");
    
    let isRemoteUpdate = false;
    let addBtn = null;

    function getAddButton() {
        if (!addBtn || !tabsContainer.contains(addBtn)) {
            addBtn = document.createElement("div");
            addBtn.id = "addTabBtn";
            addBtn.textContent = "+ Ajouter";
            addBtn.addEventListener("click", () => {
                const name = prompt("Nom du nouvel onglet :");
                if (!name) return;

                if (AppState.files[name]) {
                    alert("Un onglet portant ce nom existe déjà.");
                    return;
                }

                if (!createTab(name)) {
                    alert("Erreur lors de la création de l'onglet.");
                    return;
                }

                renderTabs();
                switchTab(name);
                if (window.Editor) window.Editor.autoSave();
            });
        }
        return addBtn;
    }

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
        console.log('🎨 renderTabs appelé, tabOrder:', AppState.tabOrder);
        
        // Vider le conteneur (garder seulement le bouton ajouter s'il existe)
        while (tabsContainer.firstChild) {
            tabsContainer.removeChild(tabsContainer.firstChild);
        }

        // Créer les onglets
        AppState.tabOrder.forEach(name => {
            const tab = document.createElement("div");
            tab.className = "tab";
            tab.textContent = name;
            tab.dataset.name = name;
            tab.draggable = true;

            tab.addEventListener("click", () => switchTab(name));

            tab.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (window.UI) {
                    window.UI.setClickedTab(name);
                    window.UI.showContextMenu(e.pageX, e.pageY);
                }
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
                if (window.Editor) window.Editor.autoSave();
            });

            tabsContainer.appendChild(tab);
        });

        // Ajouter le bouton à la fin
        const btn = getAddButton();
        tabsContainer.appendChild(btn);

        updateTabIndicators();
    }

    function switchTab(name) {
        console.log('🔄 switchTab vers:', name);
        
        if (!AppState.isRestoring && AppState.currentTab !== null && !isRemoteUpdate) {
            AppState.files[AppState.currentTab] = note.value;
        }
        
        AppState.currentTab = name;
        
        // Mettre à jour la valeur du textarea
        const content = AppState.files[name] || "";
        if (note.value !== content) {
            note.value = content;
        }

        // Mettre à jour la classe active sur les onglets
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        const activeTab = document.querySelector(`.tab[data-name="${name}"]`);
        if (activeTab) activeTab.classList.add("active");

        if (window.Editor) {
            window.Editor.updateLineCount();
        }
        
        // Sauvegarder l'état (sauf si c'est une mise à jour distante)
        if (!isRemoteUpdate) {
            Storage.saveState();
        }
    }

    function resetAllTabs() {
        if (!confirm("Voulez-vous vraiment tout réinitialiser ?\nTous les onglets et contenus seront supprimés.")) {
            return;
        }

        const defaultTabs = [
            "000","100","200","300","400","500","600","700","800","900",
            "A","BD","C","M","N","P","R","T","FL"
        ];

        AppState.files = {};
        AppState.tabOrder = [...defaultTabs];

        defaultTabs.forEach(name => AppState.files[name] = "");

        AppState.currentTab = "000";
        note.value = "";
        
        if (window.Editor) window.Editor.updateLineCount();

        Storage.saveState();
        renderTabs();
        switchTab("000");
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
        if (window.Editor) window.Editor.autoSave();
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

        if (window.Editor) window.Editor.updateLineCount();
        renderTabs();
        if (AppState.currentTab) switchTab(AppState.currentTab);
        if (window.Editor) window.Editor.autoSave();
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
        
        if (window.Editor) window.Editor.updateLineCount();

        Storage.saveState();
        renderTabs();
        switchTab(AppState.currentTab);

        return true;
    }
    
    // Callback pour les mises à jour distantes depuis Firebase
    function onRemoteUpdate(files) {
        console.log('🌍 Mise à jour distante reçue, nombre d\'onglets:', Object.keys(files).length);
        isRemoteUpdate = true;
        
        // Mettre à jour les fichiers
        AppState.files = files;
        
        // Si tabOrder est vide, le créer depuis les clés des fichiers
        if (AppState.tabOrder.length === 0 && Object.keys(files).length > 0) {
            AppState.tabOrder = Object.keys(files);
            console.log('📋 tabOrder créé depuis les clés:', AppState.tabOrder);
            renderTabs();
        }
        
        // Mettre à jour les indicateurs visuels (point vert)
        updateTabIndicators();
        
        // Si l'onglet courant existe, mettre à jour l'affichage du textarea
        if (AppState.currentTab && AppState.files[AppState.currentTab] !== undefined) {
            const currentValue = note.value;
            const newValue = AppState.files[AppState.currentTab] || "";
            if (currentValue !== newValue) {
                note.value = newValue;
                if (window.Editor) window.Editor.updateLineCount();
            }
        }
        
        isRemoteUpdate = false;
    }
    
    function onOrderUpdate(order) {
        console.log('📋 Mise à jour de l\'ordre reçue:', order);
        if (order && Array.isArray(order) && order.length > 0) {
            isRemoteUpdate = true;
            AppState.tabOrder = order;
            renderTabs();
            
            // Re-sélectionner l'onglet courant s'il existe
            if (AppState.currentTab && AppState.tabOrder.includes(AppState.currentTab)) {
                switchTab(AppState.currentTab);
            } else if (AppState.tabOrder.length > 0) {
                switchTab(AppState.tabOrder[0]);
            }
            isRemoteUpdate = false;
        }
    }
    
    function onCurrentTabUpdate(currentTab) {
        console.log('📍 Mise à jour de l\'onglet courant reçue:', currentTab);
        if (currentTab && currentTab !== AppState.currentTab) {
            isRemoteUpdate = true;
            switchTab(currentTab);
            isRemoteUpdate = false;
        }
    }

    function init() {
        console.log('📑 Initialisation des onglets');
        
        // Si des onglets existent déjà, les afficher
        if (AppState.tabOrder && AppState.tabOrder.length > 0) {
            renderTabs();
            if (AppState.currentTab) {
                switchTab(AppState.currentTab);
            } else if (AppState.tabOrder.length > 0) {
                switchTab(AppState.tabOrder[0]);
            }
        } else {
            // Aucun onglet, on attend Firebase ou on charge les défauts
            console.log('Aucun onglet trouvé, en attente de données...');
        }
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