document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('inventory-grid');
    const tabsContainer = document.getElementById('inventory-tabs-container');
    const tooltipElement = document.getElementById('tooltip');
    const tooltipName = document.getElementById('tooltip-name');
    const tooltipItemTypeKind = document.getElementById('tooltip-item-type-kind');
    

    const API_BASE = "https://archandia.onrender.com";

    // Zmienna globalna na poziomie modułu, dostępna dla wszystkich funkcji
    let characterId = null;

    window.addEventListener('message', (event) => {
        if (event.data && event.data.characterId) {
            characterId = event.data.characterId;
            console.log("Dla Ekranu Inventory ID postaci:", characterId);
            initializeInventory();
        }
    });

    const NUM_TABS = 5;
    const SLOTS_PER_TAB = 25; // 5x5

    let currentTabId = 0;
    let allInventoryData = {}; // { 0: [items], 1: [items], ... }
    let draggedItemElement = null;
    let draggedItemData = null; // { itemId, originalTabId, originalSlotIndex, element }

    // --- INICJALIZACJA ---
    async function initializeInventory() {
        createTabButtons();
        await fetchInventoryData(); // Ładuje allInventoryData
        renderTab(currentTabId);
    }

    function createTabButtons() {
        tabsContainer.innerHTML = '';
        for (let i = 0; i < NUM_TABS; i++) {
            const button = document.createElement('button');
            button.classList.add('tab-button');
            button.dataset.tabId = i;
            button.textContent = `Bag ${i + 1}`;
            if (i === currentTabId) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => switchTab(i));

            // Drag and Drop listeners for tabs
            button.addEventListener('dragover', handleTabDragOver);
            button.addEventListener('dragleave', handleTabDragLeave);
            button.addEventListener('drop', handleTabDrop);

            tabsContainer.appendChild(button);
        }
    }

    async function fetchInventoryData() {
        try {
            const response = await fetch(`${API_BASE}/api/character/${characterId}/inventory`);
            console.log("Fetching inventory data for character ID:", characterId);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            allInventoryData = data; // Serwer zwraca już { tab_id: [items] }
            console.log("Załadowano ekwipunek:", allInventoryData);
        } catch (error) {
            console.error("Błąd ładowania ekwipunku:", error);
            // Inicjalizuj puste dane, jeśli błąd
            for(let i=0; i < NUM_TABS; i++) {
                allInventoryData[i] = [];
            }
        }
    }

    function switchTab(tabId) {
        if (tabId === currentTabId && gridContainer.children.length > 0) return; // Już na tej zakładce
        currentTabId = tabId;
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.tabId) === tabId);
        });

        renderTab(tabId);
    }

    function renderTab(tabId) {
        gridContainer.innerHTML = ''; // Wyczyść siatkę

        const itemsInThisTab = allInventoryData[tabId] || [];
        const itemMap = new Map(); // itemId -> itemData
        itemsInThisTab.forEach(item => itemMap.set(item.slot_index, item));

        for (let i = 0; i < SLOTS_PER_TAB; i++) {
            const slot = document.createElement('div');
            slot.classList.add('inventory-slot');
            slot.dataset.slotIndex = i;
            slot.dataset.tabId = tabId; // Ważne dla logiki drop

            const itemData = itemMap.get(i);
            if (itemData) {
                const itemElement = createItemElement(itemData);
                slot.appendChild(itemElement);
            }
            addSlotDragDropListeners(slot);
            gridContainer.appendChild(slot);
        }
    }

    function createItemElement(itemData) {
        const item = document.createElement('img');
        item.id = `item-${itemData.item_id}`;
        item.src = "/static/" + (itemData.imagesource || 'images/default.jpg');
        item.alt = itemData.name;
        item.classList.add('inventory-item');
        item.draggable = true;

        // Przechowywanie danych na elemencie
        item.dataset.itemId = itemData.item_id;
        item.dataset.itemName = itemData.name;
        item.dataset.itemTypeKind = itemData.itemtypekind || 'Brak opisu.';
        item.dataset.originalTabId = itemData.tab_id;
        item.dataset.originalSlotIndex = itemData.slot_index;
        item.dataset.stack = itemData.stack || null;

        addItemListeners(item);

        // Dodaj licznik stack w prawym dolnym rogu, jeśli stack > 1
        if (itemData.stack && parseInt(itemData.stack) > 1) {
            const stackLabel = document.createElement('span');
            stackLabel.className = 'stack-label';
            stackLabel.textContent = itemData.stack;
            // Ustaw pozycjonowanie względem rodzica
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.appendChild(item);
            wrapper.appendChild(stackLabel);
            return wrapper;
        }

        return item;
    }

    // --- OBSŁUGA TOOLTIPA ---
    function showTooltip(event) {
        const item = event.target.closest('.inventory-item');
        if (!item) return;
        tooltipName.textContent = item.dataset.itemName;
        tooltipItemTypeKind.textContent = item.dataset.itemTypeKind;
        tooltipElement.style.left = `${event.pageX + 15}px`;
        tooltipElement.style.top = `${event.pageY + 10}px`;
        tooltipElement.style.display = 'block';
    }
    function hideTooltip() { tooltipElement.style.display = 'none'; }
    function updateTooltipPosition(event) {
        if (tooltipElement.style.display === 'block') {
            tooltipElement.style.left = `${event.pageX + 15}px`;
            tooltipElement.style.top = `${event.pageY + 10}px`;
        }
    }

    // --- LISTENERY DLA ITEMÓW ---
    function addItemListeners(item) {
        item.addEventListener('mouseover', showTooltip);
        item.addEventListener('mouseout', hideTooltip);
        item.addEventListener('mousemove', updateTooltipPosition);

        // Desktop drag & drop
        item.addEventListener('dragstart', (event) => {
            draggedItemElement = item;
            draggedItemData = {
                itemId: item.dataset.itemId,
                originalTabId: parseInt(item.dataset.originalTabId),
                originalSlotIndex: parseInt(item.dataset.originalSlotIndex),
                element: item
            };
            event.dataTransfer.setData('text/plain', item.dataset.itemId);
            setTimeout(() => item.classList.add('dragging'), 0);
            hideTooltip();
        });

        item.addEventListener('dragend', () => {
            draggedItemElement?.classList.remove('dragging');
            draggedItemElement = null;
            draggedItemData = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            document.querySelectorAll('.drag-over-tab').forEach(el => el.classList.remove('drag-over-tab'));
        });

        // Mobile touch drag & drop
        item.addEventListener('touchstart', (event) => {
            event.preventDefault();
            draggedItemElement = item;
            draggedItemData = {
                itemId: item.dataset.itemId,
                originalTabId: parseInt(item.dataset.originalTabId),
                originalSlotIndex: parseInt(item.dataset.originalSlotIndex),
                element: item
            };
            item.classList.add('dragging');
            hideTooltip();
        }, { passive: false });

        item.addEventListener('touchend', (event) => {
            item.classList.remove('dragging');
            draggedItemElement = null;
            draggedItemData = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            document.querySelectorAll('.drag-over-tab').forEach(el => el.classList.remove('drag-over-tab'));
        });
    }

    // --- LISTENERY DLA SLOTÓW ---
    function addSlotDragDropListeners(slot) {
        slot.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (slot.children.length === 0 || slot.children[0] !== draggedItemElement) {
                slot.classList.add('drag-over');
            }
        });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', handleSlotDrop);

        // Mobile
        slot.addEventListener('touchmove', (event) => {
            event.preventDefault();
            // Możesz dodać efekt podświetlenia slotu pod palcem, jeśli chcesz
        }, { passive: false });

        slot.addEventListener('touchend', async (event) => {
            event.preventDefault();
            if (!draggedItemData) return;
            const targetSlot = slot;
            const targetSlotIndex = parseInt(targetSlot.dataset.slotIndex);
            const targetTabId = parseInt(targetSlot.dataset.tabId);

            let updates = [];
            const existingItemInTargetSlot = targetSlot.querySelector('.inventory-item');

            if (draggedItemData.originalTabId === targetTabId && draggedItemData.originalSlotIndex === targetSlotIndex) {
                return;
            }

            updates.push({
                itemId: draggedItemData.itemId,
                targetTabId: targetTabId,
                targetSlotIndex: targetSlotIndex
            });

            if (existingItemInTargetSlot && existingItemInTargetSlot !== draggedItemElement) {
                updates.push({
                    itemId: existingItemInTargetSlot.dataset.itemId,
                    targetTabId: draggedItemData.originalTabId,
                    targetSlotIndex: draggedItemData.originalSlotIndex
                });
            }

            await sendUpdatesToBackend(updates);

            draggedItemElement?.classList.remove('dragging');
            draggedItemElement = null;
            draggedItemData = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            document.querySelectorAll('.drag-over-tab').forEach(el => el.classList.remove('drag-over-tab'));
        });
    }

    // --- LOGIKA UPUSZCZANIA NA SLOT ---
    async function handleSlotDrop(event) {
        event.preventDefault();
        const targetSlot = event.target.closest('.inventory-slot');
        targetSlot.classList.remove('drag-over');

        if (!draggedItemData || !targetSlot) return;

        const targetSlotIndex = parseInt(targetSlot.dataset.slotIndex);
        const targetTabId = parseInt(targetSlot.dataset.tabId); // Powinno być currentTabId

        let updates = [];

        // Przedmiot, który jest już w slocie docelowym (jeśli jest)
        const existingItemInTargetSlot = targetSlot.querySelector('.inventory-item');

        if (draggedItemData.originalTabId === targetTabId && draggedItemData.originalSlotIndex === targetSlotIndex) {
            console.log("Upuszczono na ten sam slot.");
            return; // Nic nie rób
        }

        // 1. Główny przeciągany przedmiot
        updates.push({
            itemId: draggedItemData.itemId,
            targetTabId: targetTabId,
            targetSlotIndex: targetSlotIndex
        });

        // 2. Jeśli slot docelowy był zajęty, przedmiot stamtąd musi się przenieść do slotu źródłowego
        if (existingItemInTargetSlot && existingItemInTargetSlot !== draggedItemElement) {
            updates.push({
                itemId: existingItemInTargetSlot.dataset.itemId,
                targetTabId: draggedItemData.originalTabId, // do oryginalnej zakładki przeciąganego
                targetSlotIndex: draggedItemData.originalSlotIndex // do oryginalnego slotu przeciąganego
            });
        }
        
        await sendUpdatesToBackend(updates);
    }

    // --- LISTENERY DLA ZAKŁADEK (TABÓW) JAKO CELÓW UPUSZCZENIA ---
    function handleTabDragOver(event) {
        event.preventDefault();
        const tabButton = event.target.closest('.tab-button');
        if (tabButton && draggedItemData) {
            // Nie podświetlaj, jeśli to ta sama zakładka i nie ma sensu upuszczać na nią samą
            if (parseInt(tabButton.dataset.tabId) !== draggedItemData.originalTabId) {
                 tabButton.classList.add('drag-over-tab');
            }
        }
    }
    function handleTabDragLeave(event) {
        const tabButton = event.target.closest('.tab-button');
        tabButton?.classList.remove('drag-over-tab');
    }
    async function handleTabDrop(event) {
        event.preventDefault();
        const targetTabButton = event.target.closest('.tab-button');
        targetTabButton?.classList.remove('drag-over-tab');

        if (!draggedItemData || !targetTabButton) return;

        const targetTabId = parseInt(targetTabButton.dataset.tabId);

        // Jeśli upuszczamy na zakładkę, z której przedmiot pochodzi, nic nie rób
        if (targetTabId === draggedItemData.originalTabId) {
            console.log("Upuszczono na zakładkę źródłową, bez sensu.");
            return;
        }
        
        // Przeniesienie do pierwszej wolnej pozycji w docelowej zakładce
        let updates = [{
            itemId: draggedItemData.itemId,
            targetTabId: targetTabId
            // targetSlotIndex zostanie określony przez backend
        }];

        await sendUpdatesToBackend(updates);
    }

    // Mobile: obsługa upuszczania na zakładki przez dotyk
    document.addEventListener('touchend', async (event) => {
        if (!draggedItemData) return;
        // Znajdź tab pod palcem
        const touch = event.changedTouches ? event.changedTouches[0] : null;
        if (!touch) return;
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const tabButton = elem?.closest && elem.closest('.tab-button');
        if (tabButton && parseInt(tabButton.dataset.tabId) !== draggedItemData.originalTabId) {
            tabButton.classList.remove('drag-over-tab');
            const targetTabId = parseInt(tabButton.dataset.tabId);
            let updates = [{
                itemId: draggedItemData.itemId,
                targetTabId: targetTabId
            }];
            await sendUpdatesToBackend(updates);
            draggedItemElement?.classList.remove('dragging');
            draggedItemElement = null;
            draggedItemData = null;
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            document.querySelectorAll('.drag-over-tab').forEach(el => el.classList.remove('drag-over-tab'));
        }
    }, { passive: false });

    // --- WYSYŁANIE AKTUALIZACJI DO SERWERA ---
    async function sendUpdatesToBackend(updatesArray) {
        console.log("Wysyłanie aktualizacji:", updatesArray);
        try {
            const response = await fetch(`${API_BASE}/api/character/${characterId}/inventory/update_items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: updatesArray })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Błąd serwera: ${response.status} - ${errorData.error} - ${errorData.details || ''}`);
            }
            const result = await response.json();
            console.log("Odpowiedź serwera:", result);
            
            // Po pomyślnej aktualizacji na backendzie, odśwież dane i UI
            await fetchInventoryData(); 
            renderTab(currentTabId); // Odśwież bieżącą zakładkę
            // Można też przełączyć na zakładkę, na którą przeniesiono item, jeśli to była inna zakładka
            // np. jeśli `updatesArray[0].targetTabId !== currentTabId`, to `switchTab(updatesArray[0].targetTabId)`

        } catch (error) {
            console.error("Nie udało się zaktualizować ekwipunku:", error);
            // TODO: Można zaimplementować logikę cofania zmian w UI, jeśli serwer odrzucił
            alert(`Błąd aktualizacji ekwipunku: ${error.message}`);
        }
    }

});
