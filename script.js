document.addEventListener('DOMContentLoaded', () => {
    const openChestButton = document.getElementById('openChestButton');
    const chestImage = document.getElementById('chestImage');
    const itemAnimationContainer = document.getElementById('itemAnimationContainer');
    // const droppedItemImage = document.getElementById('droppedItem'); // If you need to change item src

    // Przykładowa struktura danych dla zadań
    const dostepneZadania = [
        {
            id: "zad001",
            tytul: "Dostawa Artefaktów do Elgore",
            opis: "Miasto Elgore pilnie potrzebuje zestawu magicznych artefaktów. Skonstruuj żądanie PUT zawierające listę przedmiotów z ich ID i właściwościami. Upewnij się, że endpoint to '/archlord/elgore/supply_drop'.",
            startingEndpoint: "/archlord/elgore/supply_drop", 
            metodaHttp: "PUT",
            questAvailableTill: "2025-12-31T23:59:59Z", 
            questEndsAt: "2025-06-30T23:59:59Z", 
            wymaganePrzedmioty: [ 
                { idPrzedmiotu: "artifact_พลังงาน_01", nazwa: "Rdzeń Energii", ilosc: 2, wymaganeWlasciwosci: { rzadkosc: "rzadki" } },
                { idPrzedmiotu: "scroll_ochrony_03", nazwa: "Zwoj Ochrony Większej", ilosc: 1 }
            ],
            reward: [
                { rewardId: "normal_key", rewardName: "Normal Key", rewardAmount: 5 },
                { rewardId: "unique_key", rewardName: "Unique Key", rewardAmount: 1 },
                { rewardId: "legendary_key", rewardName: "Legendary Key", rewardAmount: 1 }
            ],
            oczekiwanyJsonPrzyklad: { // Może służyć jako podpowiedź lub do walidacji struktury
                "shipment_id": "USER_GENERATED_ID",
                "destination_zone": "Elgore_City_Center",
                "items_payload": [
                    { "item_id": "artifact_พลังงาน_01", "quantity": 2, "properties": { "rarity": "rare", "charge_level": "full" } },
                    { "item_id": "scroll_ochrony_03", "quantity": 1, "properties": { "sealed": true } }
                ],
                "notes": "Pilna dostawa"
            },
            nagroda: { punktyDoswiadczenia: 150, zloto: 200, przedmioty: [{idPrzedmiotu: "elgore_supply_token", ilosc: 1}] }
        },
        {
            id: "zad002",
            tytul: "Zlecenie na Kryształy Mocy dla Chantra",
            opis: "Mistrzowie z Chantra poszukują rzadkich Kryształów Mocy. Twoim zadaniem jest przygotowanie żądania PUT z listą tych kryształów na endpoint '/archlord/chantra/crystal_order'.",
            startingEndpoint: "/archlord/chantra/crystal_order",
            metodaHttp: "PUT",
            questAvailableTill: "2025-12-31T23:59:59Z",
            questEndsAt: "2025-06-30T23:59:59Z", 
            wymaganePrzedmioty: [
                { idPrzedmiotu: "crystal_mocy_gorski", nazwa: "Górski Kryształ Mocy", ilosc: 5, wymaganeWlasciwosci: { czystosc: "wysoka" } },
            ],
            reward: [
                { rewardId: "normal_key", rewardName: "Normal Key", rewardAmount: 5 },
                { rewardId: "unique_key", rewardName: "Unique Key", rewardAmount: 1 },
                { rewardId: "legendary_key", rewardName: "Legendary Key", rewardAmount: 1 }
            ],
            oczekiwanyJsonPrzyklad: {
                "order_reference": "USER_REF_XYZ",
                "requested_by": "Master_Rylai",
                "crystals": [
                    { "crystal_id": "crystal_mocy_gorski", "count": 5, "specs": { "purity": "wysoka", "source": "DragonSpineMountains" } }
                ]
            },
            nagroda: { punktyDoswiadczenia: 250, zloto: 350 }
        }
        // Dodaj więcej zadań
    ];
    
    // Przykładowy ekwipunek użytkownika (w rzeczywistej aplikacji byłby zarządzany dynamicznie)
    let ekwipunekUzytkownika = [
        { idPrzedmiotu: "artifact_พลังงาน_01", nazwa: "Rdzeń Energii", ilosc: 3, wlasciwosci: { rzadkosc: "rzadki", poziom_naladowania: "pelny" } },
        { idPrzedmiotu: "scroll_ochrony_03", nazwa: "Zwoj Ochrony Większej", ilosc: 1, wlasciwosci: { zapieczetowany: true } },
        { idPrzedmiotu: "crystal_mocy_gorski", nazwa: "Górski Kryształ Mocy", ilosc: 4, wlasciwosci: { czystosc: "wysoka" } }, // Za mało
        { idPrzedmiotu: "potion_leczenia_01", nazwa: "Mała Mikstura Leczenia", ilosc: 10 }
    ];


    // === SEKCJA EKRANU QUEST ===

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGFyYWN0ZXJJZCI6IjEiLCJleHAiOjE3NDc3MTkzMTN9.FZTeEgOPx3wnrmEGLad0jJCZk6el0rCzCksoUPs5iA4";


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
                <button class="action-button" id="${tabId}-send-button">Send Request</button>
            </div>

            <label class="request-section-label" for="${tabId}-response">Response:</label>
            <textarea id="${tabId}-response" readonly data-response-keys="[]"></textarea>
        `;

        document.getElementById(`${requestsSectionId}-content`).appendChild(tabContent);
        switchToTab(requestsSectionId, tabId);
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

    // Delegacja zdarzeń dla dynamicznych przycisków w kontenerze
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
    }


    // === Sckrypt dla wyświetlania sekcji Requests Sequence w ekranie Zadania ===
    let methodAndUrlsFieldCounter = 1;

    // Przenieś opcje do zmiennej globalnej/metodowej
    const sequenceOptions = [
        { value: "1", label: "GET: get_manual?ItemType=Crossbow&ItemName=Advance Crossbow" },
        { value: "2", label: "POST: archandia/post_order/golundo?BlacksmithId=2aLyaegQQdS7&ManualId=vN1qOsHVRkq2" }
        // Dodaj kolejne opcje tutaj
    ];

    // Funkcja do dodawania nowej opcji do sequenceOptions
    function dodajOpcjeDoSequenceOptions(value, label) {
        sequenceOptions.push({ value, label });
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

    }


    //Funckja do dodawania nowej pary metod i URL

    function addMethodAndUrlPair() {
        dodajOpcjeDoSequenceOptions("3", "PUT: archandia/put_order/golundo?BlacksmithId=2aLyaegQQdS7&ManualId=vN1qOsHVRkq2");
        updateSequenceSelectFields();

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

    // Delegacja zdarzeń dla dynamicznych przycisków w kontenerze
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'add-request-tab-button') {
            addMethodAndUrlPair();
            e.preventDefault();
        }
    });

    // Zmiany na GUI po wybraniu Start Quest
    document.getElementById('startQuest').addEventListener('click', function() {
        addNewSequenceTab(); // wywołaj funkcję
        this.style.display = 'none'; // ukryj przycisk Start Quest
        document.getElementById('cancelQuest').style.display = 'inline-block'; // pokaż przycisk Anuluj
        document.getElementById('availableTillLabel').style.display = 'none'; // usuń etykietę Available Till
        document.getElementById('questsEndsLabel').style.display = 'block'; // pokaż etykietę Quest Ends
        document.getElementById('completeQuest').style.display = 'inline-block'; // pokaż przycisk Complete Quest
    });


    let aktualnieWybraneZadanie = null;

    function inicjalizujEkranQuest() {
        wyswietlListeZadan();
        panelSzczegolowZadaniaUI.style.display = 'none';
    }

    function wyswietlListeZadan() {
        listaZadanUI.innerHTML = ''; // Wyczyść starą listę
        dostepneZadania.forEach(zadanie => {
            const elementListy = document.createElement('li');
            elementListy.textContent = zadanie.tytul;
            elementListy.dataset.zadanieId = zadanie.id;
            elementListy.addEventListener('click', () => wybierzZadanie(zadanie.id));
            listaZadanUI.appendChild(elementListy);
        });
    }

    function wybierzZadanie(idZadania) {
        methodAndUrlsFieldCounter = 1; // Resetuj licznik pól metody i URL
        aktualnieWybraneZadanie = dostepneZadania.find(z => z.id === idZadania);
        if (!aktualnieWybraneZadanie) return;

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

        document.getElementById('cancelQuest').style.display = 'none'; // Ukryj przycisk CancelQuest
        document.getElementById('questsEndsLabel').style.display = 'none'; // Ukryj etykietę Quest Ends
        document.getElementById('startQuest').style.display = 'inline-block'; // Pokaż przycisk StartQuest
        document.getElementById('availableTillLabel').style.display = 'block'; // pokaż etykietę Available Till


        

        tytulZadaniaUI.textContent = aktualnieWybraneZadanie.tytul;
        opisZadaniaUI.textContent = aktualnieWybraneZadanie.opis;
        startingEndpointInfoUI.textContent = aktualnieWybraneZadanie.startingEndpoint;
        metodaHttpInfoUI.textContent = aktualnieWybraneZadanie.metodaHttp;
        questavailableInfoUI.textContent = aktualnieWybraneZadanie.questAvailableTill; 
        questEndsAtInfoUI.textContent = aktualnieWybraneZadanie.questEndsAt;

        wymaganePrzedmiotyListaUI.innerHTML = '';
        rewardListUi.innerHTML = ''; 
        let czyMoznaPodjacZadanie = true;
        aktualnieWybraneZadanie.wymaganePrzedmioty.forEach(wymPrzedmiot => {
            const li = document.createElement('li');
            const posiadanyPrzedmiot = sprawdzPrzedmiotWEkwipunku(wymPrzedmiot.idPrzedmiotu, wymPrzedmiot.ilosc, wymPrzedmiot.wymaganeWlasciwosci);
            li.textContent = `${wymPrzedmiot.ilosc}x ${wymPrzedmiot.nazwa}`;
            if (wymPrzedmiot.wymaganeWlasciwosci) {
                li.textContent += ` (${formatujWlasciwosci(wymPrzedmiot.wymaganeWlasciwosci)})`;
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
            li.textContent = `${rew.rewardAmount}x ${rew.rewardName}`;
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
        // Zbierz wszystkie pary key/value dla danego tabId, iterując po rosnących indeksach
        const queryParams = [];
        let rowIndex = 0;
        while (true) {
            const keyInput = document.getElementById(`${tabId}-query-param-row-${rowIndex}-key`);
            const valueInput = document.getElementById(`${tabId}-query-param-row-${rowIndex}-value`);
            if (!keyInput || !valueInput) {
                break;
            }
            // Dodaj tylko jeśli key lub value nie jest puste
            if (keyInput.value !== '' || valueInput.value !== '') {
                queryParams.push({
                    key: keyInput.value,
                    value: valueInput.value
                });
            }
            rowIndex++;
        }
        const requestData = {
            method,
            url,
            body,
            queryParams
        };
        console.log('Zebrane queryParams:', requestData);
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

        // Prepare headers
        const headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGFyYWN0ZXJJZCI6IjEiLCJleHAiOjE3NDc3NjAxMDZ9.pxjNwCkFxLJ2vqy6nTUk88glb9_l-Izw2gkBQa-82ag'
        };
        // Add Content-Type for methods with body
        if (['POST', 'PUT', 'PATCH'].includes(requestData.method.toUpperCase())) {
            headers['Content-Type'] = 'application/json';
        }

        // Prepare fetch options
        const options = {
            method: requestData.method,
            headers: headers
        };
        if (requestData.body && ['POST', 'PUT', 'PATCH'].includes(requestData.method.toUpperCase())) {
            options.body = requestData.body;
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
            return { status: response.status, data };
        } catch (error) {
            return { status: 0, error: error.message };
        }
    }


    // Delegacja zdarzeń: wykrywa kliknięcie na przycisk "Send Request" i wywołuje getRequestData(tabId)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id && e.target.id.endsWith('-send-button')) {
            const tabId = e.target.id.replace('-send-button', '');
            console.log('Wysłano żądanie dla zakładki:', tabId);
            const { requestData } = getRequestData(tabId);
            sendHttpRequest(requestData);
        }
    });
    
    // === KONIEC SEKCJI EKRANU QUEST ===

    const menuButtons = document.querySelectorAll('.bottom-menu .menu-button');
    const screens = document.querySelectorAll('.app-container .screen');
    const mainContentContainer = document.getElementById('mainContent'); // The open-chest-screen itself

    let isAnimating = false;

    // --- Chest Opening Logic ---
    openChestButton.addEventListener('click', () => {
        if (isAnimating) return;

        isAnimating = true;
        openChestButton.disabled = true;

        // 1. (Optional) Initial chest animation (e.g., shaking)
        chestImage.classList.add('opening');

        // 2. Start item drop animation after a short delay (e.g., for chest shake to finish)
        setTimeout(() => {
            // You can dynamically set the item image here if needed
            // droppedItemImage.src = "path/to/your/newly_won_item.png";
            itemAnimationContainer.classList.add('animate-drop');
        }, 400); // Corresponds to chestShake animation duration

        // 3. Clean up after the 3-second item animation
        setTimeout(() => {
            itemAnimationContainer.classList.remove('animate-drop');
            chestImage.classList.remove('opening');
            openChestButton.disabled = false;
            isAnimating = false;

            // console.log("Item received!");
            // Add logic here: add item to inventory, show item details, etc.
        }, 3000 + 400); // Total duration: item animation (3s) + initial delay
    });

    // --- Bottom Menu Navigation Logic ---
    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isAnimating) return; // Don't switch screens during animation

            const targetScreenId = button.dataset.target; // Lub button.getAttribute('data-target')
            const targetScreen = document.getElementById(targetScreenId) || document.querySelector(`.${targetScreenId}`); // Dodatkowe sprawdzenie dla open-chest-screen

            if (targetScreen && targetScreen.id === 'questScreen') {
                inicjalizujEkranQuest();
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

});