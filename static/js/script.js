document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://archandia.onrender.com";


    const openChestButton = document.getElementById('openChestButton');
    const chestImage = document.getElementById('chestImage');
    const itemAnimationContainer = document.getElementById('itemAnimationContainer');

    const menuButtons = document.querySelectorAll('.bottom-menu .menu-button');
    const screens = document.querySelectorAll('.app-container .screen');
    const mainContentContainer = document.getElementById('mainContent'); // The open-chest-screen itself




    async function fetchCharacterTasks(characterId) {
        try {
            const response = await fetch(`${API_BASE}/api/character/${characterId}/tasks`);
            if (!response.ok) {
                // Wyświetl komunikat o błędzie na wzór "No available chests"
                const listaZadanUI = document.getElementById('listaZadan');
                if (listaZadanUI) {
                    listaZadanUI.innerHTML = '';
                    const elementListy = document.createElement('li');
                    elementListy.textContent = 'No available quests';
                    elementListy.classList.add('no-tasks');
                    elementListy.style.color = 'red';
                    elementListy.style.cursor = 'not-allowed';
                    elementListy.style.pointerEvents = 'none';
                    listaZadanUI.appendChild(elementListy);
                }
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Otrzymane zadania:', data);
            window.dostepneZadania = data; // Zastąpienie przykładowych zadań danymi z serwera (globalnie)
            return window.dostepneZadania;
        } catch (err) {
            console.error('Błąd pobierania zadań:', err);
            // Wyświetl komunikat o błędzie na wzór "No available chests"
            const listaZadanUI = document.getElementById('listaZadan');
            if (listaZadanUI) {
                listaZadanUI.innerHTML = '';
                const elementListy = document.createElement('li');
                elementListy.textContent = 'No available tasks';
                elementListy.classList.add('no-tasks');
                elementListy.style.color = 'red';
                elementListy.style.cursor = 'not-allowed';
                elementListy.style.pointerEvents = 'none';
                listaZadanUI.appendChild(elementListy);
            }
            return null;
        }
    }

    // automatyczne zwiększanie zawartości pola tekstowego
    document.addEventListener('input', function(e) {
        if (e.target.tagName === 'TEXTAREA') {
            e.target.style.height = 'auto';
            e.target.style.height = (e.target.scrollHeight) + 'px';
        }
    });

    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        if (event) event.preventDefault();
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }
    // const droppedItemImage = document.getElementById('droppedItem'); // If you need to change item src

    
    
    // Przykładowy ekwipunek użytkownika (w rzeczywistej aplikacji byłby zarządzany dynamicznie)
    let ekwipunekUzytkownika = [
        { idPrzedmiotu: "artifact_พลังงาน_01", nazwa: "Rdzeń Energii", ilosc: 3, wlasciwosci: { rzadkosc: "rzadki", poziom_naladowania: "pelny" } },
        { idPrzedmiotu: "scroll_ochrony_03", nazwa: "Zwoj Ochrony Większej", ilosc: 1, wlasciwosci: { zapieczetowany: true } },
        { idPrzedmiotu: "crystal_mocy_gorski", nazwa: "Górski Kryształ Mocy", ilosc: 4, wlasciwosci: { czystosc: "wysoka" } }, // Za mało
        { idPrzedmiotu: "potion_leczenia_01", nazwa: "Mała Mikstura Leczenia", ilosc: 10 }
    ];


    // === SEKCJA EKRANU QUEST ===

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGFyYWN0ZXJJZCI6IjEiLCJleHAiOjE3NDk0ODc2NTd9._d3Pr2cjKsDDG51uXyQ6D6n7LM2SHtS2EfAqC5EKxwA";


    const ekranZdobywaj = document.getElementById('questScreen');
    const listaZadanUI = document.getElementById('listaZadan');
    const panelSzczegolowZadaniaUI = document.querySelector('.szczegoly-zadania-panel');

    const tytulZadaniaUI = document.getElementById('tytulZadania');
    const opisZadaniaUI = document.getElementById('opisZadania');
    const wymaganePrzedmiotyListaUI = document.getElementById('wymaganePrzedmiotyLista');
    const rewardListUi = document.getElementById('rewardList'); 
    const startingEndpointInfoUI = document.getElementById('startingEndpointInfo');
    const metodaHttpInfoUI = document.getElementById('metodaHttpInfo');
    const questavailableInfoUI = document.getElementById('questAvailableTillInfo');
    const questEndsAtInfoUI = document.getElementById('questEndsInfo');


    // === Pola w ekranie Chests ===
    const chestNameUI = document.getElementById('chestName');
    const chestImageUI = document.getElementById('chestImage');
    const chestRarityUI = document.getElementById('chestRarity');
    const requiredKeysListUI = document.getElementById('requiredKeysList');
    const lootListUi = document.getElementById('lootList');

    
    // pola w ekranie Inventory ===
    const inventoryContainerUI = document.getElementById('inventory-container');


    // === Sckrypt dla wyświetlania sekcji Requests w ekranie Zadania ===
    const requestsSectionItem = {};

    // Funkcja dodająca Sekcję z Requestami dla Zadania
    function addNewRequestsSection() {
        const requestsSectionId = "requestsSection1";
        requestsSectionItem[requestsSectionId] = { tabCounter: 0, activeTabId: null, requestChain: [] };

        const taskSection = document.createElement('details');
        taskSection.classList.add('task-section');
        taskSection.id = requestsSectionId;
        taskSection.open = true;

        const summary = document.createElement('summary');
        summary.textContent = `Requests`;
        taskSection.appendChild(summary);

        const tabsContainer = document.createElement('div');
        tabsContainer.classList.add('tabs-container');
        tabsContainer.id = `${requestsSectionId}-tabs`;

        const tabContentContainer = document.createElement('div');
        tabContentContainer.id = `${requestsSectionId}-content`;



        const addTabButton = document.createElement('button');
        addTabButton.textContent = '+ Request';
        addTabButton.id = `add-request-tab-button`;
        addTabButton.onclick = () => {
            addNewTab(requestsSectionId);
        };
        tabsContainer.appendChild(addTabButton);

        taskSection.appendChild(tabsContainer);
        taskSection.appendChild(tabContentContainer);

        document.getElementById('tasksContainer').appendChild(taskSection);

        addNewTab(requestsSectionId);
    }

    document.getElementById('startQuest').addEventListener('click', addNewRequestsSection);

    // Funkcja dodająca zakładki dla poszczególnych requestów w Zadaniu
    function addNewTab(requestsSectionId) {
        const requestsSection = requestsSectionItem[requestsSectionId];
        requestsSection.tabCounter++;
        const tabId = `${requestsSectionId}-tab-${requestsSection.tabCounter}`;
        requestsSection.activeTabId = tabId;

        const tabButton = document.createElement('button');
        tabButton.textContent = `Request ${requestsSection.tabCounter}`;
        tabButton.id = `${tabId}-button`;
        tabButton.onclick = () => switchToTab(requestsSectionId, tabId);

        const tabsContainer = document.getElementById(`${requestsSectionId}-tabs`);
        tabsContainer.insertBefore(tabButton, tabsContainer.lastElementChild);

        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.id = `${tabId}-content`;
        tabContent.innerHTML = `
            <label class="request-section-label" for="${tabId}-method">HTTP Method:</label>
            <select class="select-field" id="${tabId}-method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
            </select>

            <label class="request-section-label" for="${tabId}-url">URL:</label>
            <input class="text-area-input-field" type="text" id="${tabId}-url" placeholder="https://api.example.com/data">

            <label class="request-section-label" for="${tabId}-headers">Query Params:</label>
            <div class="request-section-labels-container" id="${tabId}-query-params-container">
                <div class="request-section-labels-key-value-pair-container">
                    <div class="request-section-labels-row-container" id="${tabId}-query-param-row-0-key-row">
                        <label class="request-section-query-params-label" for="${tabId}-query-param-key">Key:</label>
                        <input class="text-area-input-field" type="text" id="${tabId}-query-param-row-0-key" placeholder="Key">
                    </div>
                    <div class="request-section-labels-row-container" id="${tabId}-query-param-row-0-value-row">
                        <label class="request-section-query-params-label" for="${tabId}-query-param-value">Value:</label>
                        <input class="text-area-input-field" type="text" id="${tabId}-query-param-row-0-value" placeholder="Value">
                    </div>
                </div>
            </div>
            <div class="request-section-labels-row-container">
                <button id="addNewQueryParamRow" class="utility-button">Add Param</button>
            </div>
            

            <label class="request-section-label" for="${tabId}-body">Request Body (JSON):</label>
            <textarea id="${tabId}-body" placeholder='{"key": "value"}'></textarea>

            <div class="button-group">
                <span id="${tabId}-json-msg" class="json-msg" style="display: block;"></span>
                <button class="action-button" id="${tabId}-send-button">Send Request</button>
            </div>

            <label class="request-section-label" for="${tabId}-response">Response:</label>
            <textarea id="${tabId}-response" readonly data-response-keys="[]"></textarea>
        `;

        document.getElementById(`${requestsSectionId}-content`).appendChild(tabContent);
        switchToTab(requestsSectionId, tabId);

        // funkcja wyświetlania błędów struktury JSON dla Request body
        const bodyTextarea = tabContent.querySelector(`#${tabId}-body`);
        const outputField = document.getElementById(`${tabId}-json-msg`);
        if (bodyTextarea) {
            bodyTextarea.addEventListener('blur', function () {
                try {
                    const raw = bodyTextarea.value.trim();
                    if (!raw) return; // nie formatuj pustego
                    const parsed = JSON.parse(raw);
                    const pretty = JSON.stringify(parsed, null, 2);
                    bodyTextarea.value = pretty;
                    outputField.classList.remove('error');
                    outputField.textContent = "✅ JSON is correct";
                    autoResizeTextarea(bodyTextarea); 
                } catch (err) {
                    outputField.textContent = "❌ JSON error: " + err.message;
                    bodyTextarea.classList.add('error');
                }
            });
        }
    }

    // Funkcja do dodawania nowej pary Key/Value
    let queryParamRowCounter = 0;

    function addQueryParamRow(tabId) {
        const container = document.getElementById(`${tabId}-query-params-container`);
        if (!container) return;

        queryParamRowCounter++;
        const uniqueId = `${tabId}-query-param-row-${queryParamRowCounter}`;

        // Tworzenie pary Key
        const keyValuePairContainer = document.createElement('div');
        keyValuePairContainer.className = 'request-section-labels-key-value-pair-container';
        const keyRow = document.createElement('div');
        keyRow.className = 'request-section-labels-row-container';
        keyRow.id = `${uniqueId}-key-row`;
        const keyLabel = document.createElement('label');
        keyLabel.className = 'request-section-query-params-label';
        keyLabel.textContent = 'Key:';
        keyLabel.setAttribute('for', `${uniqueId}-key`);
        const keyInput = document.createElement('input');
        keyInput.className = 'text-area-input-field';
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.setAttribute('name', 'query-param-key');
        keyInput.id = `${uniqueId}-key`;
        keyValuePairContainer.appendChild(keyRow);
        keyValuePairContainer.appendChild(keyLabel);
        keyValuePairContainer.appendChild(keyInput);

        keyRow.appendChild(keyLabel);
        keyRow.appendChild(keyInput);

        // Tworzenie pary Value
        const valueRow = document.createElement('div');
        valueRow.className = 'request-section-labels-row-container';
        valueRow.id = `${uniqueId}-value-row`;
        const valueLabel = document.createElement('label');
        valueLabel.className = 'request-section-query-params-label';
        valueLabel.textContent = 'Value:';
        valueLabel.setAttribute('for', `${uniqueId}-value`);
        const valueInput = document.createElement('input');
        valueInput.className = 'text-area-input-field';
        valueInput.type = 'text';
        valueInput.placeholder = 'Value';
        valueInput.setAttribute('name', 'query-param-value');
        valueInput.id = `${uniqueId}-value`;
        valueRow.appendChild(valueLabel);
        valueRow.appendChild(valueInput);

        // Dodaj do kontenera NA KOŃCU
        container.appendChild(keyValuePairContainer);
        keyValuePairContainer.appendChild(keyRow);
        keyValuePairContainer.appendChild(valueRow);
    }

    // Delegacja zdarzeń dla dynamicznych przycisków w kontenerze dla dodawania nowej pary Key/Value
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'addNewQueryParamRow') {
            // Szukamy kontenera z parami w rodzeństwie (poprzedni element względem przycisku)
            const rowContainer = e.target.closest('.request-section-labels-row-container');
            let container = null;
            if (rowContainer) {
                // Szukamy poprzedniego rodzeństwa, które jest .request-section-labels-container
                let prev = rowContainer.previousElementSibling;
                while (prev) {
                    if (prev.classList.contains('request-section-labels-container')) {
                        container = prev;
                        break;
                    }
                    prev = prev.previousElementSibling;
                }
            }
            if (container && container.id) {
                // Wyciągnij tabId z id kontenera
                // id ma postać "${tabId}-query-params-container"
                const tabId = container.id.replace('-query-params-container', '');
                addQueryParamRow(tabId);
            }
            e.preventDefault();
        }
    });

    function switchToTab(requestsSectionId, tabId) {
        const requestsSection = requestsSectionItem[requestsSectionId];
        const tabsContainer = document.getElementById(`${requestsSectionId}-tabs`);
        const tabButtons = tabsContainer.querySelectorAll('button');
        tabButtons.forEach(btn => btn.classList.remove('active-tab'));
        document.getElementById(`${tabId}-button`).classList.add('active-tab');

        const contentContainer = document.getElementById(`${requestsSectionId}-content`);
        const tabContents = contentContainer.querySelectorAll('.tab-content');
        tabContents.forEach(div => div.classList.remove('active-tab-content'));
        document.getElementById(`${tabId}-content`).classList.add('active-tab-content');

        requestsSection.activeTabId = tabId;

        // Usuń zawartość zmiennej przechowywanej pod kluczem w sessionStorage
        sessionStorage.setItem(`${tabId}-last-successful-request-data`, "");
    }


    // === Sckrypt dla wyświetlania sekcji Requests Sequence w ekranie Zadania ===
    let methodAndUrlsFieldCounter = 1;

    // Zmienna przechowuje docelowo listę metod i URLi
    const sequenceOptions = [];

    // Funkcja do dodawania nowej opcji do sequenceOptions
    function insertMethodAndUrlIntoSequenceOptions(method, url) {
        // method i url mogą być obiektami {method: "...", url: "..."}
        // lub stringami, więc obsłuż oba przypadki
        let m, u;
        if (typeof method === 'object' && method !== null) {
            m = method.method;
            u = method.url;
        } else {
            m = method;
            u = url;
        }
        // Dodajemy do sequenceOptions jako { value, label }
        const value = `${m}:${u}`;
        const label = `${m}: ${u}`;
        // Unikaj duplikatów
        if (!sequenceOptions.some(opt => opt.value === value)) {
            sequenceOptions.push({ value, label });
        }
    }

    // Aktualizuje wszystkie selecty z klasą sequence-select-field na podstawie sequenceOptions
    function updateSequenceSelectFields() {
        const selects = document.querySelectorAll('.sequence-select-field');
        selects.forEach(select => {
        // Zachowaj aktualnie wybraną wartość
        const currentValue = select.value;
        // Wyczyść istniejące opcje
        select.innerHTML = '';
        // Dodaj nowe opcje
        sequenceOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });
        // Przywróć wybraną wartość jeśli istnieje
        if ([...select.options].some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
        });
    }

    // Funkcja dodająca Sekcję z Requestam Sequence dla Zadania
    function addNewSequenceTab() {
        const sequenceTabId = `sequence1`;

        const taskSection = document.createElement('details');
        taskSection.classList.add('task-section');
        taskSection.id = sequenceTabId;
        taskSection.open = true;

        const summary = document.createElement('summary');
        summary.textContent = `Requests Sequence`;
        taskSection.appendChild(summary);

        const tabContentContainer = document.createElement('div');
        tabContentContainer.id = `${sequenceTabId}-content`;


        //taskSection.appendChild(tabsContainer);
        taskSection.appendChild(tabContentContainer);

          

        document.getElementById('requestsSequenceContainer').appendChild(taskSection);
        let tabId = "requestSequenceTab-1";
        const tabContent = document.createElement('div');
        tabContent.classList.add('request-sequence-tab-content');
        tabContent.id = `${tabId}-content`;

        // Generuj <option> na podstawie sequenceOptions
        const optionsHtml = sequenceOptions.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');

        tabContent.innerHTML = `
            <label class="request-section-label" for="${tabId}-method-url">Methods and URLs:</label>
            <div class="sequence-section-labels-container">
            <div class="sequence-section-labels-row-container">
                <label class="sequence-section-method-url-label" id="${tabId}-method-url-label">${methodAndUrlsFieldCounter}.</label>
                <select class="sequence-select-field" id="${tabId}-method-url-${methodAndUrlsFieldCounter}">
                ${optionsHtml}
                </select>
            </div>
            </div>
        `;
        methodAndUrlsFieldCounter++;

        document.getElementById(`${sequenceTabId}-content`).appendChild(tabContent);
        sequenceOptions.length = 0;
        insertMethodAndUrlIntoSequenceOptions("", "");
        updateSequenceSelectFields();

    }


    //Funckja do dodawania nowej pary metod i URL

    function addMethodAndUrlPair() {
        //dodajOpcjeDoSequenceOptions("3", "PUT: archandia/put_order/golundo?BlacksmithId=2aLyaegQQdS7&ManualId=vN1qOsHVRkq2");
        //updateSequenceSelectFields();

        const container = document.querySelector('.request-sequence-tab-content');
        if (!container) return;

        const methodAndUrlPairContainer = document.createElement('div');
        methodAndUrlPairContainer.className = 'sequence-section-labels-container';
        const methodAndUrlRow = document.createElement('div');
        methodAndUrlRow.className = 'sequence-section-labels-row-container';
        methodAndUrlRow.id = `sequence1-method-url-label`;
        const methodAndUrlLabel = document.createElement('label');
        methodAndUrlLabel.className = 'sequence-section-method-url-label';
        methodAndUrlLabel.textContent = `${methodAndUrlsFieldCounter}.`;
        const methodAndUrlSelect = document.createElement('select');
        methodAndUrlSelect.className = 'sequence-select-field';
        methodAndUrlSelect.id = `sequence1-method-url-${methodAndUrlsFieldCounter}`;
        methodAndUrlSelect.innerHTML = `
            ${sequenceOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        `;
        methodAndUrlRow.appendChild(methodAndUrlLabel);
        methodAndUrlRow.appendChild(methodAndUrlSelect);
        methodAndUrlPairContainer.appendChild(methodAndUrlRow);

        // Dodaj do kontenera NA KOŃCU
        container.appendChild(methodAndUrlPairContainer);
        methodAndUrlsFieldCounter++;
        
    }

    // Delegacja zdarzeń dla dynamicznych przycisków w kontenerze dodawania nowej pary metod i URL
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'add-request-tab-button') {
            addMethodAndUrlPair();
            e.preventDefault();
        }
    });

    // Zmiany na GUI po wybraniu Start Quest
    document.getElementById('startQuest').addEventListener('click', function() {
        if (aktualnieWybraneZadanie && aktualnieWybraneZadanie.id) {
            fetch(`${API_BASE}/api/start_task/${aktualnieWybraneZadanie.id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(data => {
                console.log('Task status update:', data);
                // Sprawdź czy odpowiedź jest pozytywna (np. status: "ok" lub success: true)
                if (data && (data.status === 'ok' || data.success === true)) {
                    addNewSequenceTab(); // wywołaj funkcję
                    document.getElementById('startQuest').style.display = 'none'; // ukryj przycisk Start Quest
                    document.getElementById('cancelQuest').style.display = 'inline-block'; // pokaż przycisk Anuluj
                    document.getElementById('availableTillLabel').style.display = 'none'; // usuń etykietę Available Till
                    document.getElementById('completeQuest').style.display = 'inline-block'; // pokaż przycisk Complete Quest
                } else {
                    // Możesz dodać komunikat o błędzie do UI
                    alert('Nie udało się rozpocząć zadania. Spróbuj ponownie.');
                }
            })
            .catch(err => {
                console.error('Error updating task status:', err);
                alert('Błąd połączenia z serwerem. Spróbuj ponownie.');
            });
        }
    });


    // Zmiany na GUI po wybraniu abandon Quest
    document.getElementById('cancelQuest').addEventListener('click', function() {
        if (aktualnieWybraneZadanie && aktualnieWybraneZadanie.id) {
            fetch(`${API_BASE}/api/cancel_task/${aktualnieWybraneZadanie.id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(data => {
                console.log('Task status update:', data);
                // Sprawdź czy odpowiedź jest pozytywna (np. status: "ok" lub success: true)
                if (data && (data.status === 'ok' || data.success === true)) {
                    const tasksContainer = document.getElementById('tasksContainer'); // usuwa istniejącą sekcję z Request
                    const existingTaskSection = tasksContainer.querySelector('.task-section');
                    if (existingTaskSection) {
                        tasksContainer.removeChild(existingTaskSection);
                    }

                    const requestsSequenceContainer = document.getElementById('requestsSequenceContainer'); // usuwa istniejącą sekcję z Request
                    const existingSequenceSection = requestsSequenceContainer.querySelector('.task-section');
                    if (existingSequenceSection) {
                        requestsSequenceContainer.removeChild(existingSequenceSection);
                    }
                    document.getElementById('cancelQuest').style.display = 'none';
                    document.getElementById('completeQuest').style.display = 'none'; 
                    document.getElementById('questsEndsLabel').style.display = 'none'; 
                    document.getElementById('availableTillLabel').style.display = 'block'; 
                    const now = new Date();
                    const formattedNow = now.toISOString().replace('T', ' ').substring(0, 19);
                    document.getElementById('availableTillLabel').textContent = `Quest abandoned at: ${formattedNow}`; // aktualizuj tekst etykiety na czas teraźniejszy


                } else {
                    // Możesz dodać komunikat o błędzie do UI
                    alert('Nie udało się rozpocząć zadania. Spróbuj ponownie.');
                }
            })
            .catch(err => {
                console.error('Error updating task status:', err);
                alert('Błąd połączenia z serwerem. Spróbuj ponownie.');
            });
        }
    });



    let aktualnieWybraneZadanie = null;

    function inicjalizujEkranQuest() {
        // Pobierz characterId z elementu osadzonego przez backend Flask-Login
        const characterId = window.currentCharacterId || document.body.dataset.characterId;
        console.log("Dla Ekranu Quest Aktualny characterId:", characterId);
        fetchCharacterTasks(characterId).then(zadania => {
            if (zadania) {
                dostepneZadania = zadania;
                wyswietlListeZadan();
            }
        });
        panelSzczegolowZadaniaUI.style.display = 'none';
    }

    function wyswietlListeZadan() {
        listaZadanUI.innerHTML = ''; // Wyczyść starą listę

        

        dostepneZadania.forEach(zadanie => {
            const elementListy = document.createElement('li');
            elementListy.textContent = zadanie.title;
            elementListy.dataset.zadanieId = zadanie.id;
            elementListy.addEventListener('click', () => wybierzZadanie(zadanie.id));
            listaZadanUI.appendChild(elementListy);
        });
    }

    function wybierzZadanie(idZadania) {
        methodAndUrlsFieldCounter = 1; // Resetuj licznik pól metody i URL
        aktualnieWybraneZadanie = dostepneZadania.find(z => z.id === idZadania);
        if (!aktualnieWybraneZadanie) return;
        console.log("Wybrane zadanie:", aktualnieWybraneZadanie);
        // Podświetl wybrane zadanie na liście
        document.querySelectorAll('#listaZadan li').forEach(el => {
            el.classList.remove('aktywne-zadanie');
            if (el.dataset.zadanieId === idZadania) {
                el.classList.add('aktywne-zadanie');

                const tasksContainer = document.getElementById('tasksContainer'); // usuwa istniejącą sekcję z Request
                const existingTaskSection = tasksContainer.querySelector('.task-section');
                if (existingTaskSection) {
                    tasksContainer.removeChild(existingTaskSection);
                }

                const requestsSequenceContainer = document.getElementById('requestsSequenceContainer'); // usuwa istniejącą sekcję z Request
                const existingSequenceSection = requestsSequenceContainer.querySelector('.task-section');
                if (existingSequenceSection) {
                    requestsSequenceContainer.removeChild(existingSequenceSection);
                }
            }
        });
        document.getElementById('availableTillLabel').style.display = 'none';
        document.getElementById('cancelQuest').style.display = 'none'; 
        document.getElementById('questsEndsLabel').style.display = 'none'; 
        document.getElementById('completeQuest').style.display = 'none'; 
    
        if (
            (!aktualnieWybraneZadanie.questStartDateTime && !aktualnieWybraneZadanie.questCompletionDateTime &&
            (
                (!aktualnieWybraneZadanie.questEndsAt) || 
                (new Date().toISOString() <= aktualnieWybraneZadanie.questEndsAt)
            )
            )
        ) {
            console.log("Quest is available to start.");
            document.getElementById('startQuest').style.display = 'inline-block';
            document.getElementById('cancelQuest').style.display = 'none';
            document.getElementById('availableTillLabel').style.display = 'block';
            document.getElementById('availableTillLabel').textContent = `Quest available till: ${aktualnieWybraneZadanie.questAvailableTill}`; // aktualizuj tekst etykiety
        } if (aktualnieWybraneZadanie.questStartDateTime && new Date().toISOString() <= aktualnieWybraneZadanie.questEndsAt) {
            console.log("Quest is in progress.");
            document.getElementById('startQuest').style.display = 'none';
            document.getElementById('questsEndsLabel').style.display = 'block';
            document.getElementById('cancelQuest').style.display = 'inline-block';
            document.getElementById('completeQuest').style.display = 'inline-block'; 
            addNewRequestsSection();
            addNewSequenceTab(); 
        }

        // Ukryj przycisk, jeśli bieżąca data jest równa lub większa od questEndsAt
        if (
            aktualnieWybraneZadanie.questEndsAt &&
            new Date().toISOString() >= aktualnieWybraneZadanie.questEndsAt
        ) {
            console.log("Quest has ended or is abandoned.");
            document.getElementById('cancelQuest').style.display = 'none';
            document.getElementById('startQuest').style.display = 'none';
            document.getElementById('availableTillLabel').style.display = 'block';
            document.getElementById('availableTillLabel').textContent = `Quest abandoned at: ${aktualnieWybraneZadanie.questEndsAt}`; // aktualizuj tekst etykiety
        }
        // Quest jest zakończony
        if (aktualnieWybraneZadanie.questCompletionDateTime) {
            console.log("Quest is completed.");
            document.getElementById('cancelQuest').style.display = 'none';
            document.getElementById('startQuest').style.display = 'none';
            document.getElementById('questsEndsLabel').style.display = 'none';
            document.getElementById('availableTillLabel').style.display = 'block';
            document.getElementById('availableTillLabel').textContent = `Quest completed at: ${aktualnieWybraneZadanie.questCompletionDateTime}`; // aktualizuj tekst etykiety
        }

        tytulZadaniaUI.textContent = aktualnieWybraneZadanie.title;
        opisZadaniaUI.textContent = aktualnieWybraneZadanie.description;
        startingEndpointInfoUI.textContent = aktualnieWybraneZadanie.startingEndpoint;
        metodaHttpInfoUI.textContent = aktualnieWybraneZadanie.httpMethod;
        questavailableInfoUI.textContent = aktualnieWybraneZadanie.questAvailableTill; 
        questEndsAtInfoUI.textContent = aktualnieWybraneZadanie.questActiveToDateTime; // nie aktualizuje się na GUI tuz po rozpoczęciu questa, ponieważ musiałoby zostać zwrotnie przesłanie 
        
        window.currentTaskId = aktualnieWybraneZadanie.id;
        console.log("Aktualnie wybrane zadanie ID:", window.currentTaskId);

        wymaganePrzedmiotyListaUI.innerHTML = '';
        rewardListUi.innerHTML = ''; 
        let czyMoznaPodjacZadanie = true;
        console.log("Wymagane przedmioty:", aktualnieWybraneZadanie);
        aktualnieWybraneZadanie.wymaganePrzedmioty.forEach(wymPrzedmiot => {
            const li = document.createElement('li');
            const posiadanyPrzedmiot = sprawdzPrzedmiotWEkwipunku(wymPrzedmiot.ItemIdRequired, wymPrzedmiot.ItemAmountRequired, wymPrzedmiot.MinimumItemRarityRequired);
            const img = document.createElement('img');
            img.src = wymPrzedmiot.ItemImageSource; // do zmiany source pliku w bazie danych
            img.alt = wymPrzedmiot.ItemNameRequired;
            img.classList.add('requiredItemImg');
            li.appendChild(img);
            li.appendChild(document.createTextNode(` ${wymPrzedmiot.ItemAmountRequired}x ${wymPrzedmiot.ItemNameRequired}`));
            if (wymPrzedmiot.ItemPropertiesRequired) {
                li.textContent += ` (${formatujWlasciwosci(wymPrzedmiot.ItemPropertiesRequired)})`;
            }
            if (posiadanyPrzedmiot) {
                li.classList.add('posiadane');
            } else {
                li.classList.add('nieposiadane');
                czyMoznaPodjacZadanie = false;
            }
            wymaganePrzedmiotyListaUI.appendChild(li);
            
        });

        aktualnieWybraneZadanie.reward.forEach(rew => {
            const li = document.createElement('li');
            const img = document.createElement('img');
            img.src = rew.rewardImageSource; // do zmiany source pliku w bazie danych
            img.alt = rew.rewardName;
            img.classList.add('rewardImg');
            li.appendChild(img);
            li.appendChild(document.createTextNode(` ${rew.rewardItemAmount}x ${rew.rewardName}`));
            rewardListUi.appendChild(li);
        });

        panelSzczegolowZadaniaUI.style.display = 'block';
    }

    function formatujWlasciwosci(wlasciwosci) {
        if (!wlasciwosci) return '';
        return Object.entries(wlasciwosci).map(([klucz, wartosc]) => `${klucz}: ${wartosc}`).join(', ');
    }



    function sprawdzPrzedmiotWEkwipunku(idPrzedmiotu, wymaganaIlosc, wymaganeWlasciwosci = null) {
        const przedmiot = ekwipunekUzytkownika.find(p => p.idPrzedmiotu === idPrzedmiotu);
        if (!przedmiot || przedmiot.ilosc < wymaganaIlosc) {
            return false;
        }
        if (wymaganeWlasciwosci) {
            for (const klucz in wymaganeWlasciwosci) {
                if (!przedmiot.wlasciwosci || przedmiot.wlasciwosci[klucz] !== wymaganeWlasciwosci[klucz]) {
                    return false;
                }
            }
        }
        return true; // Użytkownik posiada przedmiot w odpowiedniej ilości i z właściwościami
    }




   

     // Inicjalizacja, jeśli ekran "Quest" jest domyślnie aktywny
    if (document.querySelector('#questScreen.active-screen')) {
        inicjalizujEkranQuest();
    }


    // Funkcje obsługi wysyłania Requestów i odbierania Response
        
    function getRequestData(tabId) {
        const method = document.getElementById(`${tabId}-method`).value;
        const url = document.getElementById(`${tabId}-url`).value;
        const body = document.getElementById(`${tabId}-body`).value;
        // Zbierz wszystkie pary key/value dla danego tabId, iterując maksymalnie 30 razy
        const queryParams = [];
        for (let rowIndex = 0; rowIndex < 30; rowIndex++) {
            const keyInput = document.getElementById(`${tabId}-query-param-row-${rowIndex}-key`);
            const valueInput = document.getElementById(`${tabId}-query-param-row-${rowIndex}-value`);
            if (!keyInput || !valueInput) {
                continue; // Przechodzimy dalej, jeśli nie ma któregoś z inputów
            }
            // Dodaj tylko jeśli key lub value nie jest puste
            if (keyInput.value !== '' || valueInput.value !== '') {
                queryParams.push({
                    key: keyInput.value,
                    value: valueInput.value
                });
            }
        }
        const requestData = {
            method,
            url,
            body,
            queryParams
        };
        return { requestData };
    }

    async function sendHttpRequest(requestData) {
        // Build query string from queryParams array
        let url = requestData.url;
        if (requestData.queryParams && requestData.queryParams.length > 0) {
            const params = requestData.queryParams
                .filter(q => q.key !== '')
                .map(q => encodeURIComponent(q.key) + '=' + encodeURIComponent(q.value))
                .join('&');
            if (params) {
                url += (url.includes('?') ? '&' : '?') + params;
            }
        }

        // Get characterId from global/window or data attribute
        const characterId = window.currentCharacterId || document.body.dataset.characterId;

        // Prepare headers (no JWT token)
        const headers = {};
        // Add Content-Type for methods with body
        if (['POST', 'PUT', 'PATCH'].includes(requestData.method.toUpperCase())) {
            headers['Content-Type'] = 'application/json';
        }

        // Prepare fetch options
        const options = {
            method: requestData.method,
            headers: headers
        };

        // Attach characterId to body if method allows body
        if (['POST', 'PUT', 'PATCH'].includes(requestData.method.toUpperCase())) {
            let bodyObj = {};
            try {
                bodyObj = requestData.body ? JSON.parse(requestData.body) : {};
            } catch (e) {
                // If body is not valid JSON, fallback to raw string
                bodyObj = requestData.body || {};
            }
            // Only add characterId if not already present
            if (typeof bodyObj === 'object' && !Array.isArray(bodyObj) && characterId && !bodyObj.characterId) {
                bodyObj.characterId = characterId;
            }
            options.body = typeof bodyObj === 'object' ? JSON.stringify(bodyObj) : bodyObj;
        }

        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            console.log('Odpowiedź:', data);
            return { status: response.status, data };
        } catch (error) {
            return { status: 0, error: error.message };
        }
    }


    function printResponseInResponseField(tabId, jsonData, requestData) {
        const responseField = document.getElementById(`${tabId}-response`);
        if (!responseField) return;
        try {
            responseField.value = JSON.stringify(jsonData, null, 2);
        } catch (e) {
            responseField.value = String(jsonData);
        }
        autoResizeTextarea(responseField); 
        if (jsonData.status === 200) {
            handleMethodAndUrlFromSuccessRequest(tabId, jsonData, requestData.method, requestData.url)
        }

    }

    function handleMethodAndUrlFromSuccessRequest(tabId, jsonData, method, url) {
        if (jsonData.status === 200) {
            // Zapisz do sessionStorage pod kluczem związanym z tabId
            sessionStorage.setItem(
                `${tabId}-last-successful-request-data`,
                JSON.stringify({ method, url })
            );
            //console.log('Zapisano dane ostatniego udanego żądania:', { method, url });
            insertMethodAndUrlIntoSequenceOptions(method, url);
            updateSequenceSelectFields();
        }
    }

    // Delegacja zdarzeń: wykrywa kliknięcie na przycisk "Send Request" i wywołuje getRequestData(tabId)
    document.addEventListener('click', async function(e) {
        e.preventDefault();
        if (e.target && e.target.id && e.target.id.endsWith('-send-button')) {
            const tabId = e.target.id.replace('-send-button', '');
            console.log('Wysłano żądanie dla zakładki:', tabId);
            const { requestData } = getRequestData(tabId);
            const response = await sendHttpRequest(requestData);
            printResponseInResponseField(tabId, response, requestData);
        }
    });



    //testowo taskId jest przechowywany lokalnie, docelowo powinien być zapisywany w momencie otwarcia zadania
    //const taskId = "Rej6VMrPSyrU";

    // testowo requestsSequence jest przechowywane lokalnie, docelowo powinno być zapisywane na podstawie wybranych wartości w selectach w sekcji sequence
    const requestsSequence = 'GET:http://127.0.0.1:5000/get_manual?ItemType=Crossbow&ItemName=Advance Crossbow';

    /**
     * Funkcja służąca do weryfikacji spełnienia wymagań ukończenia questa.
     * @param {string} taskId
     * @param {Array} requestsSequence
     * @returns {Promise<object>}
     */
    async function sendCompleteQuestRequest(taskId, requestsSequence) {
        console.log('Wysyłanie żądania ukończenia questa:', taskId, requestsSequence);
        const url = `${API_BASE}/check_requirements`;
        const body = JSON.stringify({ taskId, requestsSequence });
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body
            });
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                document.getElementById('cancelQuest').style.display = 'none';
                document.getElementById('questsEndsLabel').style.display = 'none';
                document.getElementById('completeQuest').style.display = 'none';
                document.getElementById('availableTillLabel').style.display = 'block'; 
                const now = new Date();
                const formattedNow = now.toISOString().replace('T', ' ').substring(0, 19);
                document.getElementById('availableTillLabel').textContent = `Quest completed at: ${formattedNow}`; // aktualizuj tekst etykiety na czas teraźniejszy
                const tasksContainer = document.getElementById('tasksContainer'); // usuwa istniejącą sekcję z Request
                const existingTaskSection = tasksContainer.querySelector('.task-section');
                if (existingTaskSection) {
                    tasksContainer.removeChild(existingTaskSection);
                }

                const requestsSequenceContainer = document.getElementById('requestsSequenceContainer'); // usuwa istniejącą sekcję z Request
                const existingSequenceSection = requestsSequenceContainer.querySelector('.task-section');
                if (existingSequenceSection) {
                    requestsSequenceContainer.removeChild(existingSequenceSection);
                }
                return await response.json();
            }
            
            return { status: response.status, data: await response.text() };
        } catch (err) {
            return { status: 0, error: err.message };
        }
    }

    // DOCELOWA FUNCKJA Obsługa kliknięcia przycisku "Complete Quest"
    document.getElementById('completeQuest').addEventListener('click', async function () {
        const sequenceSelects = document.querySelectorAll('.sequence-select-field');
        const requestsSequence = Array.from(sequenceSelects)
            .map(select => select.value)
            //.filter(val => val && val !== ':') // pomiń puste lub domyślne wartości
            .join(';');
        const result = await sendCompleteQuestRequest(window.currentTaskId, requestsSequence);
        // Możesz wyświetlić wynik w UI, np. alert lub dedykowane pole
        console.log('Wynik ukończenia zadania:', result);
        });

    // === KONIEC SEKCJI EKRANU QUEST ===



    // === SEKCJA EKRANU Otwórz Skrzynię ===
    const listaChestsUI = document.getElementById('listaChests');
    const panelSzczegolowChestaUI = document.querySelector('.szczegoly-chesta-panel');

    let dostepneChesty = []; 

    async function wyswietlListeChests() {
        listaChestsUI.innerHTML = ''; // Wyczyść starą listę
        const data = await fetchChestsList();
        console.log('Dostępne skrzynie:', data);
        dostepneChesty = data || dostepneChesty; // Użyj pobranej listy jeśli istnieje

        // dostepneChesty to tablica z jednym obiektem, gdzie klucze to ID skrzyń
        if (!Array.isArray(dostepneChesty) || dostepneChesty.length === 0 || typeof dostepneChesty[0] !== 'object') {
            const elementListy = document.createElement('li');
            elementListy.textContent = 'No available chests';
            elementListy.classList.add('no-chests');
            // Możesz dodać klasę CSS, aby wyróżnić ten element
            elementListy.style.color = 'red'; 
            elementListy.style.cursor = 'not-allowed';
            elementListy.style.pointerEvents = 'none';
            listaChestsUI.appendChild(elementListy);
            return;
        }

        // Jeśli dostepneChesty to tablica obiektów skrzyń (każdy z polem chestId)
        const chestsArr = Array.isArray(dostepneChesty) ? dostepneChesty : [];
        const chestIds = chestsArr.map(chest => chest.chestId);

        if (chestIds.length === 0) {
            const elementListy = document.createElement('li');
            elementListy.textContent = 'No available chests';
            listaChestsUI.appendChild(elementListy);
            return;
        }

        chestIds.forEach(chestId => {
            // Find the chest object in chestsArr with the matching chestId
            const chest = chestsArr.find(chest => chest.chestId === chestId);
            if (!chest) return;
            const elementListy = document.createElement('li');
            elementListy.textContent = chest.name;
            elementListy.dataset.chestId = chestId;
            elementListy.addEventListener('click', () => wybierzChest(chestId, data));
            listaChestsUI.appendChild(elementListy);
        });
    }

    async function fetchChestsList() {
        try {
            const response = await fetch(`${API_BASE}/get_chests_list`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            window.chests_list = data;
            return data;
        } catch (err) {
            console.error('Błąd pobierania listy skrzyń:', err);
            window.chests_list = {};
            return {};
        }
    }

    let aktualnieWybranyChest = null;

    function wybierzChest(chestId, chestData) {
        aktualnieWybranyChest = chestData.find(c => String(c.chestId) === String(chestId));
        if (!aktualnieWybranyChest) return;
        console.log('Aktualnie wybrany chest:', aktualnieWybranyChest);
        if (document.querySelector('.chest-error-msg')) {
            // Usuń istniejący komunikat błędu, jeśli jest
            document.querySelector('.chest-error-msg').remove();
        }
        // Podświetl wybrane zadanie na liście
        document.querySelectorAll('#listaChests li').forEach(el => {
            el.classList.remove('aktywny-chest');
            if (el.dataset.chestId === String(chestId)) {
                el.classList.add('aktywny-chest');

                const tasksContainer = document.getElementById('tasksContainer'); // usuwa istniejącą sekcję z Request
                const existingTaskSection = tasksContainer.querySelector('.task-section');
                if (existingTaskSection) {
                    tasksContainer.removeChild(existingTaskSection);
                }

                const requestsSequenceContainer = document.getElementById('requestsSequenceContainer'); // usuwa istniejącą sekcję z Request
                const existingSequenceSection = requestsSequenceContainer.querySelector('.task-section');
                if (existingSequenceSection) {
                    requestsSequenceContainer.removeChild(existingSequenceSection);
                }
            }
        });


        chestNameUI.textContent = aktualnieWybranyChest.name;
        chestImageUI.src = "/static/" + aktualnieWybranyChest.chestImageSource; // do zmniany source pliku w bazie danych
        chestRarityUI.textContent = aktualnieWybranyChest.rarity;

        requiredKeysListUI.innerHTML = '';
        aktualnieWybranyChest.requiredKeys.forEach(reqKey => {
            const listItem = document.createElement('li');
            // Dodaj obrazek przed nazwą klucza
            if (reqKey.keyImageSource) {
            const img = document.createElement('img');
            img.src = "/static/" + reqKey.keyImageSource; // do zmniany source pliku w bazie danych
            img.alt = reqKey.keyName;
            img.classList.add('requiredKeysImg');
            listItem.appendChild(img);
            }
            listItem.appendChild(document.createTextNode(reqKey.keyName));
            if (reqKey.requiredProperties) {
            listItem.appendChild(document.createTextNode(` (${formatujWlasciwosci(reqKey.requiredProperties)})`));
            }
            requiredKeysListUI.appendChild(listItem);
        });

        panelSzczegolowChestaUI.style.display = 'block';

    }

    wyswietlListeChests();
    let isAnimating = false;

    // --- Chest Opening Logic ---
    openChestButton.addEventListener('click', async () => {
        if (isAnimating || !aktualnieWybranyChest) return;

        isAnimating = true;
        openChestButton.disabled = true;

        let lootData = null;
        try {
            lootData = await openChest(aktualnieWybranyChest.chestId);
        } catch (e) {
            lootData = null;
        }

        // Obsługa wielu obrazków naraz (lootIdImageSource jako tablica lub string)
        const lootImages = [];
        if (lootData) {
            // lootData.lootIdImageSource zawsze tablica wg nowego formatu
            if (Array.isArray(lootData.lootIdImageSource)) {
                lootData.lootIdImageSource.forEach(src => {
                    lootImages.push(`<img src="${src}" alt="Loot" class="dropped-item">`);
                });
            } else if (lootData.lootIdImageSource) {
                lootImages.push(`<img src="${lootData.lootIdImageSource}" alt="Loot" class="dropped-item">`);
            }
        }

        // Animacja tylko jeśli lootData istnieje (czyli odpowiedź z serwera jest prawidłowa)
        if (lootData && lootImages.length > 0) {
            chestImage.classList.add('opening');
            setTimeout(() => {
                const droppedItemContainer = document.getElementById('itemAnimationContainer');
                if (droppedItemContainer) {
                    droppedItemContainer.innerHTML = `<div style="display: flex; gap: 12px; justify-content: center;">${lootImages.join('')}</div>`;
                }
                itemAnimationContainer.classList.add('animate-drop');
            }, 400);

            setTimeout(() => {
                itemAnimationContainer.classList.remove('animate-drop');
                chestImage.classList.remove('opening');
                openChestButton.disabled = false;
                isAnimating = false;
            }, 3400);
        } else {
            openChestButton.disabled = false;
            isAnimating = false;
        }
    });

    /**
     * Otwiera skrzynię o podanym chestId.
     * @param {string} chestId
     * @returns {Promise<object>} Odpowiedź z serwera: { lootId, lootIdImageSource }
     */
    async function openChest(chestId, characterId = window.currentCharacterId) {
        try {
            const response = await fetch(`${API_BASE}/open_chest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chest_id: chestId, character_id: characterId })
            });

            const data = await response.json();

            // Obsługa odpowiedzi z kodem 403 i komunikatem w polu status.message
            if (data && data.status && data.status.code === 403) {
                // Usuń istniejący komunikat błędu, jeśli jest
                const prevError = document.querySelector('.chest-error-msg');
                if (prevError) prevError.remove();

                // Utwórz nowy komunikat błędu
                const errorDiv = document.createElement('div');
                errorDiv.className = 'chest-error-msg';
                errorDiv.style.color = 'red';
                errorDiv.style.marginTop = '10px';
                errorDiv.textContent = data.status.message;

                // Wstaw tuż po requiredKeysList
                const requiredKeysList = document.getElementById('requiredKeysList');
                if (requiredKeysList && requiredKeysList.parentNode) {
                    requiredKeysList.parentNode.insertBefore(errorDiv, requiredKeysList.nextSibling);
                }

                return null;
            }

            if (!response.ok) {
                throw new Error('Błąd podczas otwierania skrzyni');
            }

            // Oczekiwany format: { lootId, lootIdImageSource }
            // Serwer zwraca bezpośrednio { lootId, lootIdImageSource }
            // lub { data: { lootId, lootIdImageSource } }
            // Obsłuż oba przypadki
            if (data && data.lootId && data.lootIdImageSource) {
                return data;
            } else if (data && data.data && data.data.lootId && data.data.lootIdImageSource) {
                return data.data;
            } else {
                return null;
            }
        } catch (err) {
            console.error('Błąd openChest:', err);
            return null;
        }
    }

    // --- Bottom Menu Navigation Logic ---
    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isAnimating) return; // Don't switch screens during animation

            const targetScreenId = button.dataset.target; // Lub button.getAttribute('data-target')
            const targetScreen = document.getElementById(targetScreenId) || document.querySelector(`.${targetScreenId}`); // Dodatkowe sprawdzenie dla open-chest-screen

            if (targetScreen && targetScreen.id === 'questScreen') {
                inicjalizujEkranQuest();
            } else if (targetScreen && targetScreen.id === 'inventoryScreen') {
                
                
                // Dodaj Inventory do kontenera
                const inventoryContainer = document.querySelector('.inventory-container');
                if (inventoryContainer) {
                    inventoryContainer.innerHTML = `
                        <h3>Inventory</h3>
                        <iframe id="inventory-iframe" src="static/html/inventory.html" width="100%" height="100%" style="border: none; padding: 0;"></iframe>
                    `;
                    const iframe = document.getElementById('inventory-iframe');
                    iframe.onload = () => {
                        iframe.contentWindow.postMessage({
                            characterId: window.currentCharacterId
                        }, '*');
                    };
                }
            }
            // Deactivate all screens and buttons
            screens.forEach(screen => screen.classList.remove('active-screen'));
            menuButtons.forEach(btn => btn.classList.remove('active'));



            if (targetScreen) {
                targetScreen.classList.add('active-screen');
            }
            button.classList.add('active');

             // Ensure the mainContent (open-chest-screen) is correctly referenced if targeted
            if (targetScreenId === 'open-chest-screen') {
                mainContentContainer.classList.add('active-screen');
            } else {
                mainContentContainer.classList.remove('active-screen'); // Hide if another screen is chosen
            }
        });
    });

   

    // Set the "Otwórz" screen as active by default
    const initialScreen = document.querySelector('.open-chest-screen');
    const initialButton = document.querySelector('.menu-button[data-target="open-chest-screen"]');
    if (initialScreen) initialScreen.classList.add('active-screen');
    if (initialButton) initialButton.classList.add('active');


    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/logout', { method: 'GET', credentials: 'same-origin' });
                window.location.href = '/login';
            } catch (err) {
                window.location.href = '/login';
            }
        });
    }


});
