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

    const edytorJsonInput = document.getElementById('edytorJsonInput');
    const podpowiedzJsonButton = document.getElementById('podpowiedzJsonButton');
    const wyslijZadanieButton = document.getElementById('wyslijZadanieButton');
    const informacjaZwrotnaZadaniaUI = document.getElementById('informacjaZwrotnaZadania');



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

        const sequenceSection = document.createElement('div');
        sequenceSection.classList.add('sequence-section');
        sequenceSection.id = `${requestsSectionId}-sequence`;
        sequenceSection.innerHTML = '<h3>Sekwencja Żądań</h3><div id="' + requestsSectionId + '-sequence-container"></div>';

        const addTabButton = document.createElement('button');
        addTabButton.textContent = '+ Nowe Żądanie';
        addTabButton.onclick = () => addNewTab(requestsSectionId);
        tabsContainer.appendChild(addTabButton);

        taskSection.appendChild(tabsContainer);
        taskSection.appendChild(tabContentContainer);
        taskSection.appendChild(sequenceSection);

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
        tabButton.textContent = `Żądanie ${requestsSection.tabCounter}`;
        tabButton.id = `${tabId}-button`;
        tabButton.onclick = () => switchToTab(requestsSectionId, tabId);

        const tabsContainer = document.getElementById(`${requestsSectionId}-tabs`);
        tabsContainer.insertBefore(tabButton, tabsContainer.lastElementChild);

        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.id = `${tabId}-content`;
        tabContent.innerHTML = `
            <label for="${tabId}-method">Metoda HTTP:</label>
            <select id="${tabId}-method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
            </select>

            <label for="${tabId}-url">URL:</label>
            <input type="text" id="${tabId}-url" placeholder="https://api.example.com/data">

            <label for="${tabId}-body">Body (JSON):</label>
            <textarea id="${tabId}-body" placeholder='{"key": "value"}'></textarea>

            <div class="button-group">
                <button onclick="sendRequest('${tabId}')">Wyślij Żądanie</button>
            </div>

            <label for="${tabId}-response">Odpowiedź:</label>
            <textarea id="${tabId}-response" readonly data-response-keys="[]"></textarea>
        `;

        document.getElementById(`${requestsSectionId}-content`).appendChild(tabContent);
        switchToTab(requestsSectionId, tabId);
    }

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

        //const tabsContainer = document.createElement('div');
        //tabsContainer.classList.add('tabs-container');
        //tabsContainer.id = `${sequenceTabId}-tabs`;

        const tabContentContainer = document.createElement('div');
        tabContentContainer.id = `${sequenceTabId}-content`;

        const sequenceSection = document.createElement('div');
        sequenceSection.classList.add('sequence-section');
        sequenceSection.id = `${sequenceTabId}-sequence`;
        sequenceSection.innerHTML = '<h3>Sekwencja Żądań</h3><div id="' + sequenceTabId + '-sequence-container"></div>';

        //const addTabButton = document.createElement('button');
        //addTabButton.textContent = '+ Nowe Żądanie';
        //addTabButton.onclick = () => addNewTab(sequenceTabId);
        //tabsContainer.appendChild(addTabButton);

        //taskSection.appendChild(tabsContainer);
        taskSection.appendChild(tabContentContainer);
        taskSection.appendChild(sequenceSection);

        document.getElementById('requestsSequenceContainer').appendChild(taskSection);
        let tabId = "requestSequenceTab-1"
        const tabContent = document.createElement('div');
        tabContent.classList.add('request-sequence-tab-content');
        tabContent.id = `${tabId}-content`;
        tabContent.innerHTML = `
            <label for="${tabId}-method">Metoda HTTP:</label>
            <select id="${tabId}-method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
            </select>
        `;

        document.getElementById(`${sequenceTabId}-content`).appendChild(tabContent);

        //addNewTab(sequenceTabId);
    }

    document.getElementById('startQuest').addEventListener('click', addNewSequenceTab);

    



    let aktualnieWybraneZadanie = null;

    function inicjalizujEkranQuest() {
        wyswietlListeZadan();
        panelSzczegolowZadaniaUI.style.display = 'none';
        informacjaZwrotnaZadaniaUI.textContent = '';
        informacjaZwrotnaZadaniaUI.className = 'feedback-message'; // Reset stylu
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

        tytulZadaniaUI.textContent = aktualnieWybraneZadanie.tytul;
        opisZadaniaUI.textContent = aktualnieWybraneZadanie.opis;
        startingEndpointInfoUI.textContent = aktualnieWybraneZadanie.startingEndpoint;
        metodaHttpInfoUI.textContent = aktualnieWybraneZadanie.metodaHttp;
        questavailableInfoUI.textContent = aktualnieWybraneZadanie.questAvailableTill; 

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

        wyslijZadanieButton.disabled = !czyMoznaPodjacZadanie;
        if (!czyMoznaPodjacZadanie) {
            informacjaZwrotnaZadaniaUI.textContent = "Nie posiadasz wszystkich wymaganych przedmiotów, aby podjąć to zadanie.";
            informacjaZwrotnaZadaniaUI.className = 'feedback-message error';
        } else {
            informacjaZwrotnaZadaniaUI.textContent = '';
            informacjaZwrotnaZadaniaUI.className = 'feedback-message';
        }


        edytorJsonInput.value = ''; // Wyczyść edytor przy wyborze nowego zadania
        panelSzczegolowZadaniaUI.style.display = 'block';
    }

    function formatujWlasciwosci(wlasciwosci) {
        if (!wlasciwosci) return '';
        return Object.entries(wlasciwosci).map(([klucz, wartosc]) => `${klucz}: ${wartosc}`).join(', ');
    }

    podpowiedzJsonButton.addEventListener('click', () => {
        if (aktualnieWybraneZadanie && aktualnieWybraneZadanie.oczekiwanyJsonPrzyklad) {
            edytorJsonInput.value = JSON.stringify(aktualnieWybraneZadanie.oczekiwanyJsonPrzyklad, null, 2); // Formatowanie z wcięciami
        } else {
            alert("Dla tego zadania nie zdefiniowano przykładu JSON.");
        }
    });

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

    wyslijZadanieButton.addEventListener('click', () => {
        if (!aktualnieWybraneZadanie) return;

        informacjaZwrotnaZadaniaUI.textContent = '';
        informacjaZwrotnaZadaniaUI.className = 'feedback-message';

        // 1. Sprawdzenie, czy użytkownik nadal ma przedmioty (na wszelki wypadek)
        let czyNadalMaPrzedmioty = true;
        aktualnieWybraneZadanie.wymaganePrzedmioty.forEach(wymPrzedmiot => {
            if (!sprawdzPrzedmiotWEkwipunku(wymPrzedmiot.idPrzedmiotu, wymPrzedmiot.ilosc, wymPrzedmiot.wymaganeWlasciwosci)) {
                czyNadalMaPrzedmioty = false;
            }
        });

        if (!czyNadalMaPrzedmioty) {
            informacjaZwrotnaZadaniaUI.textContent = "Błąd: Straciłeś wymagane przedmioty. Sprawdź ekwipunek.";
            informacjaZwrotnaZadaniaUI.className = 'feedback-message error';
            wyslijZadanieButton.disabled = true;
            return;
        }

        // 2. Parsowanie JSON z edytora
        let payloadUzytkownika;
        try {
            payloadUzytkownika = JSON.parse(edytorJsonInput.value);
        } catch (error) {
            informacjaZwrotnaZadaniaUI.textContent = `Błąd w formacie JSON: ${error.message}`;
            informacjaZwrotnaZadaniaUI.className = 'feedback-message error';
            return;
        }

        // 3. Symulacja wysłania żądania i walidacji "backendowej"
        wyslijZadanieButton.disabled = true; // Zapobiegaj wielokrotnemu klikaniu
        informacjaZwrotnaZadaniaUI.textContent = "Przetwarzanie żądania...";
        informacjaZwrotnaZadaniaUI.className = 'feedback-message';


        // Symulacja opóźnienia sieciowego
        setTimeout(() => {
            const { sukces, wiadomosc, zuzytePrzedmioty } = walidujZadaniePoStronieSerwera(aktualnieWybraneZadanie, payloadUzytkownika, ekwipunekUzytkownika);

            if (sukces) {
                informacjaZwrotnaZadaniaUI.textContent = `Sukces! ${wiadomosc || 'Zadanie wykonane poprawnie.'}`;
                informacjaZwrotnaZadaniaUI.className = 'feedback-message success';

                // Usuń zużyte przedmioty z ekwipunku
                if (zuzytePrzedmioty) {
                    zuzytePrzedmioty.forEach(zp => {
                        const index = ekwipunekUzytkownika.findIndex(p => p.idPrzedmiotu === zp.idPrzedmiotu);
                        if (index > -1) {
                            ekwipunekUzytkownika[index].ilosc -= zp.ilosc;
                            if (ekwipunekUzytkownika[index].ilosc <= 0) {
                                ekwipunekUzytkownika.splice(index, 1); // Usuń przedmiot, jeśli ilość spadnie do 0
                            }
                        }
                    });
                }
                // Dodaj nagrody (tutaj można rozbudować logikę)
                console.log("Dodano nagrodę:", aktualnieWybraneZadanie.nagroda);
                // TODO: Implementacja dodawania nagród do statystyk/ekwipunku gracza

                // Odśwież widok lub zablokuj zadanie
                // np. usuń zadanie z listy dostępnych
                // dostepneZadania = dostepneZadania.filter(z => z.id !== aktualnieWybraneZadanie.id);
                // inicjalizujEkranQuest(); // Odświeży listę i schowa szczegóły
            } else {
                informacjaZwrotnaZadaniaUI.textContent = `Błąd: ${wiadomosc || 'Żądanie nie spełnia kryteriów zadania.'}`;
                informacjaZwrotnaZadaniaUI.className = 'feedback-message error';
            }
            // Ponownie włącz przycisk, jeśli zadanie nie zostało np. usunięte z listy
             wyslijZadanieButton.disabled = false; // Włącz przycisk z powrotem
             // Możesz też odświeżyć listę wymaganych przedmiotów, bo ekwipunek mógł się zmienić
             wybierzZadanie(aktualnieWybraneZadanie.id);


        }, 1500); // Symulowane opóźnienie
    });


    function walidujZadaniePoStronieSerwera(zadanie, payload, aktualnyEkwipunek) {
        // To jest kluczowa funkcja, gdzie implementujesz logikę sprawdzania,
        // czy JSON użytkownika jest poprawny dla KONKRETNEGO zadania.
        // Sprawdza ona, czy payload zawiera odpowiednie ID przedmiotów, ilości, właściwości,
        // zgodnie z tym, czego oczekuje zadanie.
        // To jest walidacja SAMEGO PAYLOADU, a nie tylko tego, czy user MA itemy.

        // Przykład dla zadania "zad001"
        if (zadanie.id === "zad001") {
            if (!payload.items_payload || !Array.isArray(payload.items_payload)) {
                return { sukces: false, wiadomosc: "Payload musi zawierać tablicę 'items_payload'." };
            }

            let przedmiotyDoZuzycia = [];
            let spelniaWymogi = true;
            let wiadomoscBledu = "";

            // Wymagane przedmioty dla zadania, które muszą być w payloadzie
            const oczekiwanyRdzen = payload.items_payload.find(p => p.item_id === "artifact_พลังงาน_01");
            const oczekiwanyZwoj = payload.items_payload.find(p => p.item_id === "scroll_ochrony_03");

            const wymaganyRdzenDef = zadanie.wymaganePrzedmioty.find(p => p.idPrzedmiotu === "artifact_พลังงาน_01");
            const wymaganyZwojDef = zadanie.wymaganePrzedmioty.find(p => p.idPrzedmiotu === "scroll_ochrony_03");


            if (!oczekiwanyRdzen || oczekiwanyRdzen.quantity < wymaganyRdzenDef.ilosc) {
                spelniaWymogi = false;
                wiadomoscBledu += `Nie wysłano wystarczającej ilości (${wymaganyRdzenDef.ilosc}) Rdzeni Energii w żądaniu. `;
            } else if (oczekiwanyRdzen.properties.rarity !== "rare" /* TODO: bardziej generyczna walidacja właściwości */) {
                spelniaWymogi = false;
                wiadomoscBledu += "Rdzeń Energii musi mieć właściwość rzadkosc: 'rzadki'. ";
            } else {
                // Sprawdź, czy user FAKTYCZNIE MA tyle itemów o tych właściwościach, ile deklaruje w JSON
                const maWystarczajaco = sprawdzPrzedmiotWEkwipunku("artifact_พลังงาน_01", oczekiwanyRdzen.quantity, {rzadkosc: "rzadki"});
                if (!maWystarczajaco) {
                    return { sukces: false, wiadomosc: "Deklarujesz wysłanie więcej Rdzeni Energii (rzadkich) niż posiadasz." };
                }
                przedmiotyDoZuzycia.push({ idPrzedmiotu: "artifact_พลังงาน_01", ilosc: wymaganyRdzenDef.ilosc });
            }

            if (!oczekiwanyZwoj || oczekiwanyZwoj.quantity < wymaganyZwojDef.ilosc) {
                spelniaWymogi = false;
                wiadomoscBledu += `Nie wysłano wystarczającej ilości (${wymaganyZwojDef.ilosc}) Zwojów Ochrony Większej. `;
            } else {
                 const maWystarczajaco = sprawdzPrzedmiotWEkwipunku("scroll_ochrony_03", oczekiwanyZwoj.quantity); // Zakładamy brak specjalnych właściwości dla zwoju w tym teście payloadu
                if (!maWystarczajaco) {
                    return { sukces: false, wiadomosc: "Deklarujesz wysłanie więcej Zwojów Ochrony niż posiadasz." };
                }
                przedmiotyDoZuzycia.push({ idPrzedmiotu: "scroll_ochrony_03", ilosc: wymaganyZwojDef.ilosc });
            }


            if (spelniaWymogi) {
                // Dodatkowa walidacja struktury np. destination_zone
                if (payload.destination_zone !== "Elgore_City_Center") {
                     return { sukces: false, wiadomosc: "Nieprawidłowa 'destination_zone' w payloadzie." };
                }
                return { sukces: true, wiadomosc: "Artefakty dostarczone do Elgore!", zuzytePrzedmioty: przedmiotyDoZuzycia };
            } else {
                return { sukces: false, wiadomosc: wiadomoscBledu };
            }
        }
        // TODO: Dodać logikę walidacji dla innych zadań (np. zad002)

        return { sukces: false, wiadomosc: "Nie zaimplementowano logiki walidacji dla tego zadania." };
    }


   

     // Inicjalizacja, jeśli ekran "Quest" jest domyślnie aktywny
    if (document.querySelector('#questScreen.active-screen')) {
        inicjalizujEkranQuest();
    }



    
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