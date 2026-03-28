/* -------------------- UI : CONTEXT MENU, MODALES, STATS -------------------- */

const UI = (() => {
    const contextMenu = document.getElementById("contextMenu");
    const renameOption = document.getElementById("renameOption");
    const deleteOption = document.getElementById("deleteOption");

    const statsModal = document.getElementById("statsModal");
    const statsOutput = document.getElementById("statsOutput");
    const statsClose = document.getElementById("statsClose");
    const statsBtn = document.getElementById("statsBtn");
    const statsSave = document.getElementById("statsSave");

    const replaceModal = document.getElementById("replaceModal");
    const replaceInput = document.getElementById("replaceInput");
    const replaceCancel = document.getElementById("replaceCancel");
    const replaceConfirm = document.getElementById("replaceConfirm");
    const replaceTabsBtn = document.getElementById("replaceTabsBtn");

    let clickedTabName = null;

    function setClickedTab(name) {
        clickedTabName = name;
    }

    function showContextMenu(x, y) {
        const menuWidth = 180;
        const menuHeight = 80;
        const maxX = window.innerWidth - menuWidth;
        const maxY = window.innerHeight - menuHeight;

        const posX = Math.min(x, maxX);
        const posY = Math.min(y, maxY);

        contextMenu.style.left = posX + "px";
        contextMenu.style.top = posY + "px";
        contextMenu.style.display = "block";
    }

    function hideContextMenu() {
        contextMenu.style.display = "none";
    }

    function computeStats() {
        const stats = {
            totalTabs: AppState.tabOrder.length,
            totalLines: 0,
            tabs: [],
            emptyTabs: 0,
            filledTabs: 0
        };

        for (const name of AppState.tabOrder) {
            const content = AppState.files[name] || "";
            const lines = content
                .split("\n")
                .filter(l => l.trim() !== "")
                .length;

            stats.totalLines += lines;

            if (lines === 0) stats.emptyTabs++;
            else stats.filledTabs++;

            stats.tabs.push({ name, lines });
        }

        return stats;
    }

    function formatStats(stats) {
        let out = "";

        out += `📊 Statistiques générales\n`;
        out += `• Total onglets : ${stats.totalTabs}\n`;
        out += `• Total lignes : ${stats.totalLines}\n`;
        out += `• Onglets remplis : ${stats.filledTabs}\n`;
        out += `• Onglets vides : ${stats.emptyTabs}\n\n`;

        out += `📁 Détail par onglet\n`;

        stats.tabs.forEach(t => {
            out += `• ${t.name} : ${t.lines} ligne${t.lines > 1 ? "s" : ""}\n`;
        });

        return out;
    }

    function showStatsModal() {
        const stats = computeStats();
        statsOutput.textContent = formatStats(stats);
        statsModal.style.display = "flex";
    }

    function hideStatsModal() {
        statsModal.style.display = "none";
    }

    function exportStats() {
        const content = statsOutput.textContent;
        const filename = `stats-${Storage.formattedDateTime()}.txt`;
        Storage.exportTxt(filename, content);
    }

    function showReplaceModal() {
        replaceInput.value = "";
        replaceModal.style.display = "flex";
        replaceInput.focus();
    }

    function hideReplaceModal() {
        replaceModal.style.display = "none";
    }

    function initContextMenu() {
        document.addEventListener("click", () => hideContextMenu());

        renameOption.addEventListener("click", () => {
            const oldName = clickedTabName;
            const newName = prompt("Nouveau nom :", oldName);
            if (!oldName) return;
            Tabs.renameTab(oldName, newName);
        });

        deleteOption.addEventListener("click", () => {
            if (!clickedTabName) return;
            Tabs.deleteTab(clickedTabName);
        });
    }

    function initStats() {
        if (statsBtn) statsBtn.addEventListener("click", showStatsModal);
        if (statsClose) statsClose.addEventListener("click", hideStatsModal);
        if (statsSave) statsSave.addEventListener("click", exportStats);
        
        const statsBtnMobile = document.getElementById("statsBtnMobile");
        if (statsBtnMobile) statsBtnMobile.addEventListener("click", showStatsModal);
    }

    function initReplaceTabs() {
        if (replaceTabsBtn) replaceTabsBtn.addEventListener("click", showReplaceModal);
        if (replaceCancel) replaceCancel.addEventListener("click", hideReplaceModal);

        if (replaceConfirm) {
            replaceConfirm.addEventListener("click", () => {
                const raw = replaceInput.value;
                if (!raw.trim()) {
                    alert("Aucun nom d’onglet fourni.");
                    return;
                }
                const ok = Tabs.replaceAllTabsFromList(raw);
                if (ok) hideReplaceModal();
            });
        }
        
        const replaceTabsBtnMobile = document.getElementById("replaceTabsBtnMobile");
        if (replaceTabsBtnMobile) replaceTabsBtnMobile.addEventListener("click", showReplaceModal);
    }

    function init() {
        initContextMenu();
        initStats();
        initReplaceTabs();
    }

    return {
        init,
        showContextMenu,
        setClickedTab
    };
})();