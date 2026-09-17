"use strict";

/*
===========================================================
DUEL COMMANDER - VALIDADOR DE DECK
===========================================================

REGRAS IMPORTANTES:

- A decklist pode vir exportada da LigaMagic.
- A LigaMagic pode colocar o comandante no meio das 100 cartas.
- O comandante será escolhido separadamente no campo "Comandante".
- Depois de escolhido:
      99 cartas no deck
      +
      1 comandante
      =
      100 cartas

- O Scryfall é usado para localizar as cartas.
- O banlist é controlado pelo banlist.js.
- O autocomplete do comandante usa a API do Scryfall.
===========================================================
*/


/*
===========================================================
CONFIGURAÇÃO
===========================================================
*/

const SCRYFALL_API =
    "https://api.scryfall.com";

const SCRYFALL_NAMED =
    `${SCRYFALL_API}/cards/named`;

const SCRYFALL_AUTOCOMPLETE =
    `${SCRYFALL_API}/cards/autocomplete`;

const SCRYFALL_COLLECTION =
    `${SCRYFALL_API}/cards/collection`;

const CACHE_KEY =
    "duel_commander_scryfall_cache_v4";

const AUTOCOMPLETE_CACHE_KEY =
    "duel_commander_autocomplete_cache_v3";

const MAX_BATCH =
    75;


/*
===========================================================
ELEMENTOS DA PÁGINA
===========================================================
*/

const deckInput =
    document.getElementById("deckInput");

const commanderInput =
    document.getElementById("commanderInput");

const validateButton =
    document.getElementById("validateButton");

const validateButtonText =
    document.getElementById("validateButtonText");

const exampleButton =
    document.getElementById("exampleButton");

const clearButton =
    document.getElementById("clearButton");

const lineCounter =
    document.getElementById("lineCounter");

const loadingSection =
    document.getElementById("loadingSection");

const loadingText =
    document.getElementById("loadingText");

const progressBar =
    document.getElementById("progressBar");

const resultSection =
    document.getElementById("resultSection");

const resultStatus =
    document.getElementById("resultStatus");

const resultStatusIcon =
    document.getElementById("resultStatusIcon");

const resultStatusLabel =
    document.getElementById("resultStatusLabel");

const resultStatusTitle =
    document.getElementById("resultStatusTitle");

const resultStatusDescription =
    document.getElementById("resultStatusDescription");

const totalCards =
    document.getElementById("totalCards");

const uniqueCards =
    document.getElementById("uniqueCards");

const legalCards =
    document.getElementById("legalCards");

const problemCards =
    document.getElementById("problemCards");

const problemsPanel =
    document.getElementById("problemsPanel");

const problemsList =
    document.getElementById("problemsList");

const cardsList =
    document.getElementById("cardsList");

const commanderResultPanel =
    document.getElementById("commanderResultPanel");

const commanderResult =
    document.getElementById("commanderResult");

const newValidationButton =
    document.getElementById("newValidationButton");

const cardTooltip =
    document.getElementById("cardTooltip");

const tooltipImage =
    document.getElementById("tooltipImage");

const commanderPreview =
    document.getElementById("commanderPreview");


/*
===========================================================
ESTADO
===========================================================
*/

let selectedCommanderCard =
    null;

let autocompleteTimer =
    null;

let autocompleteController =
    null;


/*
===========================================================
TRADUÇÕES BÁSICAS
===========================================================
*/

const CARD_TRANSLATIONS = {

    "raio":
        "Lightning Bolt",

    "contramágica":
        "Counterspell",

    "contramagica":
        "Counterspell",

    "ponderar":
        "Ponder",

    "anel solar":
        "Sol Ring",

    "cripta de mana":
        "Mana Crypt",

    "cofre de mana":
        "Mana Vault",

    "tutor vampírico":
        "Vampiric Tutor",

    "tutor vampirico":
        "Vampiric Tutor",

    "tutor místico":
        "Mystical Tutor",

    "tutor mistico":
        "Mystical Tutor",

    "reanimar":
        "Reanimate",

    "força de vontade":
        "Force of Will",

    "forca de vontade":
        "Force of Will",

    "lótus negro":
        "Black Lotus",

    "lotus negro":
        "Black Lotus",

    "lótus de joias":
        "Jeweled Lotus",

    "lotus de joias":
        "Jeweled Lotus",

    "pétala de lótus":
        "Lotus Petal",

    "petala de lotus":
        "Lotus Petal",

    "ilha":
        "Island",

    "montanha":
        "Mountain",

    "planície":
        "Plains",

    "planicie":
        "Plains",

    "floresta":
        "Forest",

    "pântano":
        "Swamp",

    "pantano":
        "Swamp",

    "oráculo de thassa":
        "Thassa's Oracle",

    "oraculo de thassa":
        "Thassa's Oracle",

    "lua de sangue":
        "Blood Moon",

    "tumba antiga":
        "Ancient Tomb",

    "campo dos mortos":
        "Field of the Dead",

    "o anel":
        "The One Ring"

};


/*
===========================================================
EXEMPLO
===========================================================
*/

const EXAMPLE_DECK = `1 Brainstorm
1 Ponder
1 Counterspell
1 Lightning Bolt
1 Sol Ring
1 Mana Crypt
1 Island
1 Mountain
1 Plains
1 Forest`;


/*
===========================================================
UTILITÁRIOS
===========================================================
*/

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function normalizeName(name) {

    if (
        name === null ||
        name === undefined
    ) {

        return "";

    }

    return String(name)
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[’]/g,
            "'"
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toLowerCase();

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function translateCardName(name) {

    const normalized =
        normalizeName(
            name
        );

    return (
        CARD_TRANSLATIONS[
            normalized
        ] ||
        name
    );

}


/*
===========================================================
CACHE SCRYFALL
===========================================================
*/

function getCache() {

    try {

        return JSON.parse(
            localStorage.getItem(
                CACHE_KEY
            ) || "{}"
        );

    } catch {

        return {};

    }

}


function saveCache(cache) {

    try {

        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
                cache
            )
        );

    } catch {

        // Ignora problemas de armazenamento

    }

}


function getAutocompleteCache() {

    try {

        return JSON.parse(
            localStorage.getItem(
                AUTOCOMPLETE_CACHE_KEY
            ) || "{}"
        );

    } catch {

        return {};

    }

}


function saveAutocompleteCache(cache) {

    try {

        localStorage.setItem(
            AUTOCOMPLETE_CACHE_KEY,
            JSON.stringify(
                cache
            )
        );

    } catch {

        // Ignora

    }

}


/*
===========================================================
NOMES DAS FACES DA CARTA
===========================================================
*/

function getCardNames(card) {

    const names = [];

    if (
        card &&
        card.name
    ) {

        names.push(
            card.name
        );

    }

    if (
        card &&
        Array.isArray(
            card.card_faces
        )
    ) {

        for (
            const face
            of card.card_faces
        ) {

            if (
                face &&
                face.name
            ) {

                names.push(
                    face.name
                );

            }

        }

    }

    return [
        ...new Set(
            names
        )
    ];

}


/*
===========================================================
VERIFICAR SE UMA CARTA É A MESMA
===========================================================
*/

function cardMatchesName(
    card,
    requestedName
) {

    if (
        !card ||
        !requestedName
    ) {

        return false;

    }

    const requested =
        normalizeName(
            requestedName
        );

    const translated =
        normalizeName(
            translateCardName(
                requestedName
            )
        );

    const cardNames =
        getCardNames(
            card
        );

    for (
        const name
        of cardNames
    ) {

        const normalized =
            normalizeName(
                name
            );

        if (
            normalized ===
            requested
        ) {

            return true;

        }

        if (
            normalized ===
            translated
        ) {

            return true;

        }

        const parts =
            normalized.split(
                /\s*\/\/\s*/
            );

        if (
            parts.includes(
                requested
            )
        ) {

            return true;

        }

        if (
            parts.includes(
                translated
            )
        ) {

            return true;

        }

    }

    return false;

}


/*
===========================================================
IMAGEM DA CARTA
===========================================================
*/

function getCardImage(card) {

    if (!card) {

        return null;

    }

    if (
        card.image_uris &&
        card.image_uris.normal
    ) {

        return card.image_uris.normal;

    }

    if (
        Array.isArray(
            card.card_faces
        )
    ) {

        for (
            const face
            of card.card_faces
        ) {

            if (
                face &&
                face.image_uris &&
                face.image_uris.normal
            ) {

                return face.image_uris.normal;

            }

        }

    }

    return null;

}


/*
===========================================================
BUSCA INDIVIDUAL NO SCRYFALL
===========================================================
*/

async function fetchScryfallCard(
    cardName
) {

    const cache =
        getCache();

    const normalized =
        normalizeName(
            cardName
        );

    if (
        cache[normalized]
    ) {

        return cache[
            normalized
        ];

    }

    const searchName =
        translateCardName(
            cardName
        );

    const queries = [

        {
            type:
                "exact",

            name:
                searchName
        },

        {
            type:
                "fuzzy",

            name:
                searchName
        }

    ];

    if (
        normalizeName(
            searchName
        ) !==
        normalized
    ) {

        queries.push({

            type:
                "fuzzy",

            name:
                cardName

        });

    }

    for (
        const query
        of queries
    ) {

        for (
            let attempt = 1;
            attempt <= 3;
            attempt++
        ) {

            try {

                const response =
                    await fetch(
                        `${SCRYFALL_NAMED}?${query.type}=${encodeURIComponent(query.name)}`,
                        {
                            headers: {

                                "Accept":
                                    "application/json"

                            }

                        }
                    );

                if (
                    response.status ===
                    429
                ) {

                    const retry =
                        parseInt(
                            response.headers.get(
                                "Retry-After"
                            ) || "1",
                            10
                        );

                    await sleep(
                        Math.max(
                            retry * 1000,
                            1000
                        )
                    );

                    continue;

                }

                if (
                    response.ok
                ) {

                    const data =
                        await response.json();

                    cache[
                        normalized
                    ] =
                        data;

                    cache[
                        normalizeName(
                            data.name
                        )
                    ] =
                        data;

                    for (
                        const faceName
                        of getCardNames(
                            data
                        )
                    ) {

                        cache[
                            normalizeName(
                                faceName
                            )
                        ] =
                            data;

                    }

                    saveCache(
                        cache
                    );

                    return data;

                }

                break;

            } catch (error) {

                if (
                    attempt < 3
                ) {

                    await sleep(
                        attempt * 500
                    );

                }

            }

        }

    }

    throw new Error(
        `Carta não encontrada: ${cardName}`
    );

}


/*
===========================================================
BUSCA EM LOTE
===========================================================
*/

async function fetchScryfallCollection(
    cardNames,
    onProgress
) {

    const cache =
        getCache();

    const results =
        new Map();

    const missing = [];

    let completed =
        0;

    for (
        const name
        of cardNames
    ) {

        const key =
            normalizeName(
                name
            );

        if (
            cache[key]
        ) {

            results.set(
                key,
                cache[key]
            );

            completed++;

        } else {

            missing.push(
                name
            );

        }

    }

    if (onProgress) {

        onProgress(
            completed,
            cardNames.length
        );

    }

    for (
        let i = 0;
        i < missing.length;
        i += MAX_BATCH
    ) {

        const batch =
            missing.slice(
                i,
                i + MAX_BATCH
            );

        let response =
            null;

        for (
            let attempt = 1;
            attempt <= 3;
            attempt++
        ) {

            try {

                response =
                    await fetch(
                        SCRYFALL_COLLECTION,
                        {

                            method:
                                "POST",

                            headers: {

                                "Accept":
                                    "application/json",

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    identifiers:
                                        batch.map(
                                            name => ({
                                                name:
                                                    translateCardName(
                                                        name
                                                    )
                                            })
                                        )

                                })

                        }
                    );

                if (
                    response.status ===
                    429
                ) {

                    const retry =
                        parseInt(
                            response.headers.get(
                                "Retry-After"
                            ) || "1",
                            10
                        );

                    await sleep(
                        Math.max(
                            retry * 1000,
                            1000
                        )
                    );

                    continue;

                }

                if (
                    response.ok
                ) {

                    break;

                }

            } catch {

                response =
                    null;

                await sleep(
                    attempt * 500
                );

            }

        }

        if (
            response &&
            response.ok
        ) {

            const payload =
                await response.json();

            for (
                const card
                of (
                    payload.data ||
                    []
                )
            ) {

                const original =
                    batch.find(
                        name =>
                            cardMatchesName(
                                card,
                                name
                            )
                    );

                if (original) {

                    results.set(
                        normalizeName(
                            original
                        ),
                        card
                    );

                }

                cache[
                    normalizeName(
                        card.name
                    )
                ] =
                    card;

                for (
                    const faceName
                    of getCardNames(
                        card
                    )
                ) {

                    cache[
                        normalizeName(
                            faceName
                        )
                    ] =
                        card;

                }

            }

            saveCache(
                cache
            );

            completed +=
                batch.length;

            if (onProgress) {

                onProgress(
                    completed,
                    cardNames.length
                );

            }

        } else {

            /*
            ================================================
            FALLBACK

            Se o lote falhar, procura individualmente.
            ================================================
            */

            for (
                const name
                of batch
            ) {

                try {

                    const card =
                        await fetchScryfallCard(
                            name
                        );

                    results.set(
                        normalizeName(
                            name
                        ),
                        card
                    );

                } catch {

                    // Será marcado posteriormente

                }

                completed++;

                if (onProgress) {

                    onProgress(
                        completed,
                        cardNames.length
                    );

                }

                await sleep(
                    100
                );

            }

        }

        await sleep(
            120
        );

    }

    return results;

}


/*
===========================================================
PARSER DA DECKLIST
===========================================================
*/

function parseDeckList(
    text
) {

    const cards = [];

    let section =
        "deck";

    let detectedCommander =
        null;

    const lines =
        text.split(
            /\r?\n/
        );

    for (
        const originalLine
        of lines
    ) {

        let line =
            originalLine.trim();

        if (!line) {

            continue;

        }

        /*
        Comentários
        */

        if (
            line.startsWith("#") ||
            line.startsWith("//")
        ) {

            continue;

        }

        const sectionName =
            line
                .toLowerCase()
                .replace(
                    /:/g,
                    ""
                )
                .trim();

        /*
        SEÇÃO COMMANDER

        Caso a decklist venha com Commander.
        */

        if (
            sectionName ===
            "commander" ||
            sectionName ===
            "comandante"
        ) {

            section =
                "commander";

            continue;

        }

        /*
        SEÇÃO DECK
        */

        if (
            sectionName ===
            "deck" ||
            sectionName ===
            "main" ||
            sectionName ===
            "maindeck" ||
            sectionName ===
            "main deck" ||
            sectionName ===
            "biblioteca"
        ) {

            section =
                "deck";

            continue;

        }

        /*
        SIDEBOARD
        */

        if (
            sectionName ===
            "sideboard" ||
            sectionName ===
            "side"
        ) {

            section =
                "sideboard";

            continue;

        }

        /*
        COMPANION
        */

        if (
            sectionName ===
            "companion"
        ) {

            section =
                "companion";

            continue;

        }

        /*
        Remove marcadores.
        */

        line =
            line.replace(
                /^[-*•]\s*/,
                ""
            );

        let quantity =
            1;

        let cardName =
            line;

        /*
        Aceita:

        1 Llanowar Elves
        4x Llanowar Elves
        4 Llanowar Elves
        */

        const match =
            line.match(
                /^(\d+)\s*[xX]?\s+(.+)$/
            );

        if (match) {

            quantity =
                parseInt(
                    match[1],
                    10
                );

            cardName =
                match[2].trim();

        }

        /*
        Remove quantidade residual.
        */

        cardName =
            cardName
                .replace(
                    /^\d+\s+/,
                    ""
                )
                .replace(
                    /\s+\[[^\]]+\]\s*$/i,
                    ""
                )
                .trim();

        if (!cardName) {

            continue;

        }

        const card = {

            inputName:
                cardName,

            translatedName:
                translateCardName(
                    cardName
                ),

            quantity,

            section

        };

        cards.push(
            card
        );

        /*
        Se a própria decklist tiver uma
        seção Commander, guardamos o nome.
        */

        if (
            section ===
            "commander" &&
            !detectedCommander
        ) {

            detectedCommander =
                cardName;

        }

    }

    return {

        cards,

        detectedCommander

    };

}


/*
===========================================================
AGRUPAR CARTAS
===========================================================
*/

function groupCards(
    cards
) {

    const map =
        new Map();

    for (
        const card
        of cards
    ) {

        const key =
            normalizeName(
                card.translatedName
            );

        if (
            !map.has(key)
        ) {

            map.set(
                key,
                {
                    ...card
                }
            );

        } else {

            map.get(
                key
            ).quantity +=
                card.quantity;

        }

    }

    return Array.from(
        map.values()
    );

}


/*
===========================================================
VERIFICAR SE CARTA DA LISTA É O COMANDANTE
===========================================================
*/

function isCommanderEntry(
    deckCard,
    commanderName,
    commanderScryfall
) {

    if (
        !deckCard ||
        !commanderName
    ) {

        return false;

    }

    /*
    PRIMEIRO:

    Compara diretamente com o nome
    digitado/selecionado.
    */

    if (
        normalizeName(
            deckCard.inputName
        ) ===
        normalizeName(
            commanderName
        )
    ) {

        return true;

    }

    /*
    Compara tradução.
    */

    if (
        normalizeName(
            deckCard.translatedName
        ) ===
        normalizeName(
            commanderName
        )
    ) {

        return true;

    }

    /*
    Compara usando o Scryfall.

    Isso resolve casos em que:

    Deck:
    Brígida, Heroína de Kinsbaile

    Campo:
    Brigid, Hero of Kinsbaile
    */

    if (
        commanderScryfall &&
        cardMatchesName(
            commanderScryfall,
            deckCard.inputName
        )
    ) {

        return true;

    }

    /*
    Também verifica o nome traduzido
    da carta.
    */

    if (
        commanderScryfall &&
        cardMatchesName(
            commanderScryfall,
            deckCard.translatedName
        )
    ) {

        return true;

    }

    return false;

}


/*
===========================================================
OBTER COMANDANTE NO SCRYFALL
===========================================================
*/

async function getCommanderCard(
    name
) {

    if (
        selectedCommanderCard &&
        cardMatchesName(
            selectedCommanderCard,
            name
        )
    ) {

        return selectedCommanderCard;

    }

    try {

        const card =
            await fetchScryfallCard(
                name
            );

        selectedCommanderCard =
            card;

        return card;

    } catch {

        return null;

    }

}


/*
===========================================================
CRIAR AUTOCOMPLETE
===========================================================
*/

function createCommanderDropdown() {

    let dropdown =
        document.getElementById(
            "commanderAutocomplete"
        );

    if (dropdown) {

        return dropdown;

    }

    const wrapper =
        commanderInput.parentElement;

    if (!wrapper) {

        return null;

    }

    /*
    Importante:

    O dropdown fica relativo ao campo.
    */

    wrapper.style.position =
        "relative";

    dropdown =
        document.createElement(
            "div"
        );

    dropdown.id =
        "commanderAutocomplete";

    dropdown.style.position =
        "absolute";

    dropdown.style.left =
        "0";

    dropdown.style.right =
        "0";

    dropdown.style.top =
        "calc(100% + 6px)";

    dropdown.style.zIndex =
        "999999";

    dropdown.style.display =
        "none";

    dropdown.style.background =
        "#11151c";

    dropdown.style.border =
        "1px solid rgba(255,255,255,.15)";

    dropdown.style.borderRadius =
        "10px";

    dropdown.style.overflow =
        "hidden";

    dropdown.style.boxShadow =
        "0 20px 50px rgba(0,0,0,.7)";

    dropdown.style.pointerEvents =
        "auto";

    wrapper.appendChild(
        dropdown
    );

    return dropdown;

}


/*
===========================================================
SELEÇÃO DO AUTOCOMPLETE

USAMOS EVENTO GLOBAL EM CAPTURA.

Isso é proposital.

Assim, mesmo que algum CSS ou outro
evento faça o input perder foco, a seleção
da carta acontece antes.
===========================================================
*/

document.addEventListener(
    "mousedown",
    event => {

        const option =
            event.target.closest(
                "[data-commander-name]"
            );

        if (!option) {

            return;

        }

        const dropdown =
            document.getElementById(
                "commanderAutocomplete"
            );

        if (
            !dropdown ||
            !dropdown.contains(
                option
            )
        ) {

            return;

        }

        /*
        Impede o input de perder o foco
        antes da seleção.
        */

        event.preventDefault();

        event.stopPropagation();

        const name =
            option.getAttribute(
                "data-commander-name"
            );

        if (name) {

            selectCommander(
                name
            );

        }

    },
    true
);


/*
===========================================================
CLICK DE SEGURANÇA
===========================================================
*/

document.addEventListener(
    "click",
    event => {

        const option =
            event.target.closest(
                "[data-commander-name]"
            );

        if (!option) {

            return;

        }

        const name =
            option.getAttribute(
                "data-commander-name"
            );

        if (
            name &&
            commanderInput.value !==
                name
        ) {

            selectCommander(
                name
            );

        }

    },
    true
);


/*
===========================================================
ESCONDER AUTOCOMPLETE
===========================================================
*/

function hideCommanderDropdown() {

    const dropdown =
        document.getElementById(
            "commanderAutocomplete"
        );

    if (!dropdown) {

        return;

    }

    dropdown.style.display =
        "none";

    dropdown.innerHTML =
        "";

}


/*
===========================================================
MOSTRAR SUGESTÕES
===========================================================
*/

function showCommanderSuggestions(
    names
) {

    const dropdown =
        createCommanderDropdown();

    if (!dropdown) {

        return;

    }

    if (
        !names ||
        names.length === 0
    ) {

        hideCommanderDropdown();

        return;

    }

    /*
    Usamos BUTTON.

    Isso torna a área clicável inteira
    e evita problemas de seleção.
    */

    dropdown.innerHTML =
        names
            .slice(
                0,
                10
            )
            .map(
                name => `

                    <button
                        type="button"
                        class="commander-autocomplete-option"
                        data-commander-name="${escapeHtml(
                            name
                        )}"
                        style="
                            appearance:none;
                            -webkit-appearance:none;
                            display:flex;
                            align-items:center;
                            gap:12px;
                            width:100%;
                            min-height:48px;
                            padding:10px 14px;
                            box-sizing:border-box;
                            border:0;
                            border-bottom:1px solid rgba(255,255,255,.07);
                            outline:none;
                            color:#fff;
                            background:#11151c;
                            cursor:pointer;
                            text-align:left;
                            font-family:inherit;
                            font-size:14px;
                            user-select:none;
                            -webkit-user-select:none;
                        "
                    >

                        <span
                            style="
                                width:8px;
                                height:8px;
                                min-width:8px;
                                border-radius:50%;
                                background:#35d07f;
                            "
                        ></span>

                        <span
                            style="
                                overflow:hidden;
                                white-space:nowrap;
                                text-overflow:ellipsis;
                                flex:1;
                            "
                        >
                            ${escapeHtml(
                                name
                            )}
                        </span>

                    </button>

                `
            )
            .join("");

    /*
    Hover manual.
    */

    dropdown
        .querySelectorAll(
            "[data-commander-name]"
        )
        .forEach(
            option => {

                option.addEventListener(
                    "mouseenter",
                    () => {

                        option.style.background =
                            "rgba(53,208,127,.10)";

                    }
                );

                option.addEventListener(
                    "mouseleave",
                    () => {

                        option.style.background =
                            "#11151c";

                    }
                );

            }
        );

    dropdown.style.display =
        "block";

}


/*
===========================================================
BUSCAR SUGESTÕES
===========================================================
*/

async function searchCommanderSuggestions(
    query
) {

    const key =
        normalizeName(
            query
        );

    if (
        key.length < 2
    ) {

        hideCommanderDropdown();

        return;

    }

    const cache =
        getAutocompleteCache();

    if (
        cache[key]
    ) {

        /*
        Só mostra se o usuário
        ainda estiver digitando a mesma coisa.
        */

        if (
            normalizeName(
                commanderInput.value
            ) === key
        ) {

            showCommanderSuggestions(
                cache[key]
            );

        }

        return;

    }

    if (
        autocompleteController
    ) {

        autocompleteController.abort();

    }

    autocompleteController =
        new AbortController();

    try {

        const response =
            await fetch(
                `${SCRYFALL_AUTOCOMPLETE}?q=${encodeURIComponent(query)}`,
                {

                    headers: {

                        "Accept":
                            "application/json"

                    },

                    signal:
                        autocompleteController.signal

                }
            );

        if (
            !response.ok
        ) {

            hideCommanderDropdown();

            return;

        }

        const data =
            await response.json();

        const names =
            Array.isArray(
                data.data
            )
                ? data.data.slice(
                    0,
                    10
                )
                : [];

        cache[key] =
            names;

        saveAutocompleteCache(
            cache
        );

        /*
        Não mostra resultado antigo.
        */

        if (
            normalizeName(
                commanderInput.value
            ) !== key
        ) {

            return;

        }

        showCommanderSuggestions(
            names
        );

    } catch (error) {

        if (
            error.name !==
            "AbortError"
        ) {

            console.warn(
                "Erro no autocomplete:",
                error
            );

        }

    }

}


/*
===========================================================
SELECIONAR COMANDANTE
===========================================================
*/

async function selectCommander(
    name
) {

    /*
    Fecha imediatamente o menu.
    */

    hideCommanderDropdown();

    /*
    Coloca o nome REAL selecionado
    no input.
    */

    commanderInput.value =
        name;

    /*
    Cancela timer.
    */

    if (
        autocompleteTimer
    ) {

        clearTimeout(
            autocompleteTimer
        );

        autocompleteTimer =
            null;

    }

    /*
    Cancela requisição antiga.
    */

    if (
        autocompleteController
    ) {

        autocompleteController.abort();

        autocompleteController =
            null;

    }

    /*
    Busca a carta no Scryfall.
    */

    try {

        const card =
            await getCommanderCard(
                name
            );

        if (!card) {

            selectedCommanderCard =
                null;

            if (
                commanderPreview
            ) {

                commanderPreview.classList.add(
                    "hidden"
                );

            }

            return;

        }

        /*
        GUARDA O OBJETO COMPLETO.

        Isso será usado depois para
        identificar o comandante dentro
        da decklist da LigaMagic.
        */

        selectedCommanderCard =
            card;

        renderCommanderPreview(
            card
        );

    } catch (error) {

        console.warn(
            "Não foi possível selecionar o comandante:",
            error
        );

        selectedCommanderCard =
            null;

        if (
            commanderPreview
        ) {

            commanderPreview.classList.add(
                "hidden"
            );

        }

    }

}


/*
===========================================================
PREVIEW DO COMANDANTE
===========================================================
*/

function renderCommanderPreview(
    card
) {

    if (!commanderPreview) {

        return;

    }

    const image =
        getCardImage(
            card
        );

    if (!card) {

        commanderPreview.classList.add(
            "hidden"
        );

        return;

    }

    commanderPreview.innerHTML = `

        <div
            style="
                display:flex;
                align-items:center;
                gap:12px;
                margin-top:12px;
            "
        >

            ${
                image
                    ? `
                        <img
                            src="${escapeHtml(
                                image
                            )}"
                            alt="${escapeHtml(
                                card.name
                            )}"
                            style="
                                width:90px;
                                border-radius:8px;
                                display:block;
                                box-shadow:0 8px 25px rgba(0,0,0,.4);
                            "
                        >
                    `
                    : ""
            }

            <div>

                <strong>
                    ${escapeHtml(
                        card.name
                    )}
                </strong>

                <div
                    style="
                        margin-top:5px;
                        font-size:12px;
                        opacity:.65;
                    "
                >
                    Comandante selecionado
                </div>

            </div>

        </div>

    `;

    commanderPreview.classList.remove(
        "hidden"
    );

}


/*
===========================================================
CAMPO DO COMANDANTE
===========================================================
*/

if (
    commanderInput
) {

    commanderInput.addEventListener(
        "input",
        () => {

            const query =
                commanderInput.value.trim();

            /*
            Como o usuário começou a editar
            novamente, a seleção anterior
            deixa de valer.
            */

            selectedCommanderCard =
                null;

            if (
                commanderPreview
            ) {

                commanderPreview.classList.add(
                    "hidden"
                );

            }

            if (
                autocompleteTimer
            ) {

                clearTimeout(
                    autocompleteTimer
                );

            }

            if (
                query.length < 2
            ) {

                hideCommanderDropdown();

                return;

            }

            autocompleteTimer =
                setTimeout(
                    () => {

                        searchCommanderSuggestions(
                            query
                        );

                    },
                    200
                );

        }
    );

}


/*
===========================================================
ENTER NO CAMPO DE COMANDANTE
===========================================================
*/

if (
    commanderInput
) {

    commanderInput.addEventListener(
        "keydown",
        async event => {

            if (
                event.key ===
                "Escape"
            ) {

                hideCommanderDropdown();

                return;

            }

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                const dropdown =
                    document.getElementById(
                        "commanderAutocomplete"
                    );

                const first =
                    dropdown?.querySelector(
                        "[data-commander-name]"
                    );

                if (first) {

                    const name =
                        first.getAttribute(
                            "data-commander-name"
                        );

                    await selectCommander(
                        name
                    );

                    return;

                }

                const typed =
                    commanderInput.value.trim();

                if (typed) {

                    await selectCommander(
                        typed
                    );

                }

            }

        }
    );

}


/*
===========================================================
CLIQUE FORA DO AUTOCOMPLETE
===========================================================
*/

document.addEventListener(
    "mousedown",
    event => {

        const dropdown =
            document.getElementById(
                "commanderAutocomplete"
            );

        if (!dropdown) {

            return;

        }

        /*
        Se clicou dentro do dropdown,
        não fecha.
        */

        if (
            dropdown.contains(
                event.target
            )
        ) {

            return;

        }

        /*
        Se clicou no input,
        também não fecha.
        */

        if (
            commanderInput &&
            commanderInput.contains(
                event.target
            )
        ) {

            return;

        }

        hideCommanderDropdown();

    }
);


/*
===========================================================
VALIDAR ESTRUTURA DO DECK
===========================================================
*/

function validateDeckStructure(
    cards,
    commander,
    commanderScryfall
) {

    const problems = [];

    let mainDeckCards =
        0;

    let commanderCards =
        0;

    /*
    =======================================================
    PRIMEIRO PASSO

    Conta normalmente tudo.

    O comandante exportado pela LigaMagic
    estará inicialmente dentro da lista.
    =======================================================
    */

    for (
        const card
        of cards
    ) {

        if (
            card.section ===
            "commander"
        ) {

            commanderCards +=
                card.quantity;

        } else if (
            card.section !==
            "sideboard" &&
            card.section !==
            "companion"
        ) {

            mainDeckCards +=
                card.quantity;

        }

    }

    /*
    =======================================================
    SEGUNDO PASSO

    Se temos um comandante selecionado no
    campo, precisamos garantir que ele NÃO
    seja contado como uma carta do deck.

    Isso resolve exatamente o caso:

    LigaMagic:

    1 Llanowar Elves
    1 Brigid, Hero of Kinsbaile
    1 Swords to Plowshares
    ...
    1 Forest

    Total exportado:
    100

    Sendo:

    99 deck
    1 comandante
    =======================================================
    */

    let commanderAlreadyCountedInDeck =
        false;

    if (
        commander
    ) {

        /*
        Se existe uma seção Commander,
        ela já está separada.
        */

        if (
            commanderCards > 0
        ) {

            commanderAlreadyCountedInDeck =
                false;

        } else {

            /*
            Procura o comandante dentro
            das cartas normais.
            */

            for (
                const card
                of cards
            ) {

                if (
                    card.section !==
                    "deck"
                ) {

                    continue;

                }

                if (
                    isCommanderEntry(
                        card,
                        commander,
                        commanderScryfall
                    )
                ) {

                    /*
                    Encontramos a cópia do
                    comandante dentro da lista.
                    */

                    mainDeckCards -=
                        Math.min(
                            1,
                            card.quantity
                        );

                    commanderAlreadyCountedInDeck =
                        true;

                    break;

                }

            }

            /*
            Agora o comandante é contado
            separadamente.
            */

            commanderCards =
                1;

        }

    }

    /*
    =======================================================
    SE NÃO EXISTE COMANDANTE
    =======================================================
    */

    if (!commander) {

        problems.push({

            type:
                "commander",

            name:
                "Comandante",

            reason:
                "Nenhum comandante foi selecionado."

        });

    }

    /*
    =======================================================
    SE EXISTE COMMANDER NA PRÓPRIA DECKLIST
    =======================================================
    */

    if (
        commander &&
        commanderCards === 0
    ) {

        commanderCards =
            1;

    }

    /*
    =======================================================
    TOTAL

    99 + 1 = 100
    =======================================================
    */

    const total =
        mainDeckCards +
        commanderCards;

    if (
        commander &&
        total !== 100
    ) {

        problems.push({

            type:
                "count",

            name:
                "Quantidade de cartas",

            reason:
                `Foram identificadas ${total} cartas. O deck deve possuir 100 cartas contando o comandante.`

        });

    }

    /*
    =======================================================
    SINGLETON

    Importante:

    Se o comandante está dentro da lista,
    ele não deve gerar problema de cópia.
    =======================================================
    */

    const basicLands = [

        "plains",
        "island",
        "swamp",
        "mountain",
        "forest",
        "wastes"

    ];

    for (
        const card
        of cards
    ) {

        if (
            card.section ===
            "commander"
        ) {

            continue;

        }

        if (
            card.section ===
            "sideboard" ||
            card.section ===
            "companion"
        ) {

            continue;

        }

        const normalized =
            normalizeName(
                card.translatedName
            );

        /*
        Terrenos básicos podem repetir.
        */

        if (
            basicLands.includes(
                normalized
            )
        ) {

            continue;

        }

        /*
        Comandante não entra na regra
        de singleton como carta do deck.
        */

        if (
            commander &&
            isCommanderEntry(
                card,
                commander,
                commanderScryfall
            )
        ) {

            continue;

        }

        if (
            card.quantity > 1
        ) {

            problems.push({

                type:
                    "singleton",

                name:
                    card.inputName,

                reason:
                    `${card.quantity} cópias encontradas. O formato utiliza singleton, exceto terrenos básicos.`,

                quantity:
                    card.quantity

            });

        }

    }

    return {

        mainDeckCards,

        commanderCards,

        total,

        commanderAlreadyCountedInDeck,

        problems

    };

}


/*
===========================================================
ANALISAR CARTA
===========================================================
*/

function analyzeCard(
    card,
    scryfall,
    isCommander
) {

    if (!scryfall) {

        return {

            ...card,

            status:
                "unknown",

            reason:
                "Não foi possível localizar esta carta no Scryfall.",

            scryfall:
                null

        };

    }

    /*
    getBanlistStatus vem do banlist.js.
    */

    const status =
        getBanlistStatus(
            scryfall.name,
            Boolean(
                isCommander
            )
        );

    if (
        status.status ===
        "banned"
    ) {

        return {

            ...card,

            status:
                "banned",

            reason:
                status.reason,

            scryfall

        };

    }

    if (
        status.commanderOnly
    ) {

        return {

            ...card,

            status:
                "commanderOnly",

            reason:
                status.reason,

            scryfall

        };

    }

    return {

        ...card,

        status:
            "legal",

        reason:
            status.reason ||
            "",

        scryfall

    };

}


/*
===========================================================
VALIDAR DECK
===========================================================
*/

async function validateDeck() {

    const text =
        deckInput.value.trim();

    if (!text) {

        alert(
            "Cole uma decklist antes de validar."
        );

        return;

    }

    hideTooltip();

    hideCommanderDropdown();

    const parsed =
        parseDeckList(
            text
        );

    /*
    =======================================================
    COMANDANTE

    Se o usuário escolheu no campo,
    usamos o campo.

    Se não escolheu, tentamos usar uma
    seção Commander da decklist.
    =======================================================
    */

    let commander =
        commanderInput.value.trim();

    if (!commander) {

        commander =
            parsed.detectedCommander ||
            "";

    }

    /*
    =======================================================
    BUSCAR O COMANDANTE

    IMPORTANTE:

    Antes de analisar o deck, buscamos
    o comandante para conseguir reconhecer
    a carta dentro da lista da LigaMagic.
    =======================================================
    */

    let commanderScryfall =
        selectedCommanderCard;

    if (
        commander
    ) {

        if (
            !commanderScryfall ||
            !cardMatchesName(
                commanderScryfall,
                commander
            )
        ) {

            commanderScryfall =
                await getCommanderCard(
                    commander
                );

        }

    }

    showLoading();

    validateButton.disabled =
        true;

    if (
        validateButtonText
    ) {

        validateButtonText.textContent =
            "VALIDANDO...";

    }

    resultSection.classList.add(
        "hidden"
    );

    try {

        /*
        ===================================================
        AGRUPAR CARTAS

        O comandante continua sendo buscado
        junto com as cartas para obter imagem
        e status.
        ===================================================
        */

        const grouped =
            groupCards(
                parsed.cards
            );

        const names =
            grouped.map(
                card =>
                    card.translatedName
            );

        /*
        ===================================================
        SCRYFALL
        ===================================================
        */

        const scryfallMap =
            await fetchScryfallCollection(
                names,
                (
                    done,
                    total
                ) => {

                    updateLoadingText(
                        `Consultando cartas: ${done} / ${total}`
                    );

                    updateProgress(
                        done,
                        total
                    );

                }
            );

        /*
        ===================================================
        ANALISAR CARTAS
        ===================================================
        */

        const analyzed =
            grouped.map(
                card => {

                    let scryfall =
                        scryfallMap.get(
                            normalizeName(
                                card.translatedName
                            )
                        );

                    /*
                    Fallback.

                    Procura dentro das cartas retornadas
                    pelo Scryfall.
                    */

                    if (!scryfall) {

                        for (
                            const candidate
                            of scryfallMap.values()
                        ) {

                            if (
                                cardMatchesName(
                                    candidate,
                                    card.inputName
                                )
                            ) {

                                scryfall =
                                    candidate;

                                break;

                            }

                        }

                    }

                    const isCommander =
                        commander &&
                        isCommanderEntry(
                            card,
                            commander,
                            commanderScryfall
                        );

                    return analyzeCard(
                        card,
                        scryfall,
                        Boolean(
                            isCommander
                        )
                    );

                }
            );

        /*
        ===================================================
        DADOS DO COMANDANTE
        ===================================================
        */

        let commanderData =
            null;

        if (
            commander
        ) {

            /*
            Procura primeiro a carta
            dentro da lista.
            */

            const existing =
                analyzed.find(
                    card =>
                        isCommanderEntry(
                            card,
                            commander,
                            commanderScryfall
                        )
                );

            if (
                existing
            ) {

                commanderData = {

                    ...existing,

                    section:
                        "commander",

                    quantity:
                        1

                };

            } else if (
                commanderScryfall
            ) {

                const status =
                    getBanlistStatus(
                        commanderScryfall.name,
                        true
                    );

                commanderData = {

                    inputName:
                        commander,

                    translatedName:
                        commanderScryfall.name,

                    quantity:
                        1,

                    section:
                        "commander",

                    status:
                        status.status,

                    reason:
                        status.reason ||
                        "",

                    scryfall:
                        commanderScryfall

                };

            } else {

                commanderData = {

                    inputName:
                        commander,

                    translatedName:
                        commander,

                    quantity:
                        1,

                    section:
                        "commander",

                    status:
                        "unknown",

                    reason:
                        "Comandante não encontrado no Scryfall.",

                    scryfall:
                        null

                };

            }

        }

        /*
        ===================================================
        ESTRUTURA
        ===================================================
        */

        const structure =
            validateDeckStructure(
                parsed.cards,
                commander,
                commanderScryfall
            );

        /*
        ===================================================
        PROBLEMAS
        ===================================================
        */

        const problems = [
            ...structure.problems
        ];

        /*
        CARTAS BANIDAS / NÃO ENCONTRADAS
        */

        for (
            const card
            of analyzed
        ) {

            /*
            IMPORTANTE:

            O comandante que está no meio da lista
            não deve ser tratado como uma carta
            problemática só porque foi separado
            no campo.

            Ele continua sendo analisado quanto
            à legalidade.
            */

            if (
                card.status ===
                "banned"
            ) {

                problems.push({

                    type:
                        "banned",

                    name:
                        card.scryfall?.name ||
                        card.inputName,

                    reason:
                        card.reason ||
                        "Carta banida no Duel Commander.",

                    quantity:
                        card.quantity

                });

            }

            if (
                card.status ===
                "unknown"
            ) {

                /*
                Se a carta é o comandante,
                ainda precisamos informar caso
                não seja encontrada.
                */

                problems.push({

                    type:
                        "unknown",

                    name:
                        card.inputName,

                    reason:
                        card.reason,

                    quantity:
                        card.quantity

                });

            }

        }

        /*
        ===================================================
        COMANDANTE BANIDO
        ===================================================
        */

        if (
            commanderData &&
            commanderData.status ===
            "banned"
        ) {

            problems.push({

                type:
                    "commander-banned",

                name:
                    commanderData.scryfall?.name ||
                    commander,

                reason:
                    "O comandante está banido como comandante.",

                quantity:
                    1

            });

        }

        /*
        ===================================================
        CONTAGEM DE LEGAIS
        ===================================================
        */

        const legalCount =
            analyzed.reduce(
                (
                    total,
                    card
                ) => {

                    return (
                        total +
                        (
                            card.status ===
                            "legal"
                                ? card.quantity
                                : 0
                        )
                    );

                },
                0
            );

        /*
        ===================================================
        CONTAGEM DE PROBLEMAS
        ===================================================
        */

        const problemCount =
            problems.reduce(
                (
                    total,
                    problem
                ) => {

                    return (
                        total +
                        (
                            problem.quantity ||
                            1
                        )
                    );

                },
                0
            );

        /*
        ===================================================
        RENDER
        ===================================================
        */

        renderResult({

            structure,

            analyzed,

            problems,

            commanderData,

            legalCount,

            problemCount

        });

        hideLoading();

        validateButton.disabled =
            false;

        if (
            validateButtonText
        ) {

            validateButtonText.textContent =
                "VALIDAR DECK";

        }

        resultSection.classList.remove(
            "hidden"
        );

        resultSection.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    } catch (error) {

        console.error(
            "Erro ao validar deck:",
            error
        );

        hideLoading();

        validateButton.disabled =
            false;

        if (
            validateButtonText
        ) {

            validateButtonText.textContent =
                "VALIDAR DECK";

        }

        alert(
            "Ocorreu um erro durante a validação. Pressione F12 e verifique o Console."
        );

    }

}


/*
===========================================================
RENDER RESULTADO
===========================================================
*/

function renderResult(
    data
) {

    const {

        structure,

        analyzed,

        problems,

        commanderData,

        legalCount,

        problemCount

    } = data;

    const invalid =
        problems.length > 0;

    /*
    =======================================================
    STATUS
    =======================================================
    */

    resultStatus.classList.remove(
        "valid",
        "invalid"
    );

    if (invalid) {

        resultStatus.classList.add(
            "invalid"
        );

        resultStatusIcon.textContent =
            "✕";

        resultStatusLabel.textContent =
            "DECK INVÁLIDO";

        resultStatusTitle.textContent =
            "Foram encontrados problemas.";

        resultStatusDescription.textContent =
            "Revise as cartas destacadas abaixo.";

    } else {

        resultStatus.classList.add(
            "valid"
        );

        resultStatusIcon.textContent =
            "✓";

        resultStatusLabel.textContent =
            "DECK VÁLIDO";

        resultStatusTitle.textContent =
            "Seu deck está dentro das regras.";

        resultStatusDescription.textContent =
            "Nenhum problema encontrado.";

    }

    /*
    =======================================================
    ESTATÍSTICAS
    =======================================================
    */

    /*
    Aqui structure.total já é:

    99 deck
    +
    1 comandante
    =
    100
    */

    totalCards.textContent =
        structure.total;

    uniqueCards.textContent =
        analyzed.length;

    legalCards.textContent =
        legalCount;

    problemCards.textContent =
        problemCount;

    /*
    =======================================================
    PROBLEMAS
    =======================================================
    */

    if (
        problems.length
    ) {

        problemsPanel.classList.remove(
            "hidden"
        );

        problemsList.innerHTML =
            problems
                .map(
                    problem => `

                        <div
                            class="problem-item"
                        >

                            <div
                                class="problem-icon"
                            >
                                !
                            </div>

                            <div
                                class="problem-info"
                            >

                                <div
                                    class="problem-name"
                                >
                                    ${escapeHtml(
                                        problem.name
                                    )}
                                </div>

                                <div
                                    class="problem-reason"
                                >
                                    ${escapeHtml(
                                        problem.reason
                                    )}
                                    ${
                                        problem.quantity
                                            ? ` — ${problem.quantity}x`
                                            : ""
                                    }
                                </div>

                            </div>

                        </div>

                    `
                )
                .join("");

    } else {

        problemsPanel.classList.add(
            "hidden"
        );

        problemsList.innerHTML =
            "";

    }

    /*
    =======================================================
    CARTAS
    =======================================================
    */

    renderCards(
        analyzed
    );

    /*
    =======================================================
    COMANDANTE
    =======================================================
    */

    if (
        commanderData
    ) {

        commanderResultPanel.classList.remove(
            "hidden"
        );

        renderCommanderResult(
            commanderData
        );

    } else {

        commanderResultPanel.classList.add(
            "hidden"
        );

        commanderResult.innerHTML =
            "";

    }

}


/*
===========================================================
RENDER CARTAS
===========================================================
*/

function renderCards(
    cards
) {

    const order = {

        banned:
            0,

        unknown:
            1,

        commanderOnly:
            2,

        legal:
            3

    };

    const sorted =
        [...cards].sort(
            (
                a,
                b
            ) => {

                return (
                    (
                        order[
                            a.status
                        ] ??
                        99
                    ) -
                    (
                        order[
                            b.status
                        ] ??
                        99
                    )
                );

            }
        );

    cardsList.innerHTML =
        sorted
            .map(
                card => {

                    let status =
                        "LEGAL";

                    let statusClass =
                        "legal";

                    if (
                        card.status ===
                        "banned"
                    ) {

                        status =
                            "BANIDA";

                        statusClass =
                            "banned";

                    }

                    if (
                        card.status ===
                        "unknown"
                    ) {

                        status =
                            "NÃO ENCONTRADA";

                        statusClass =
                            "unknown";

                    }

                    if (
                        card.status ===
                        "commanderOnly"
                    ) {

                        status =
                            "COMMANDER";

                        statusClass =
                            "commander-banned";

                    }

                    const image =
                        getCardImage(
                            card.scryfall
                        );

                    const name =
                        card.scryfall?.name ||
                        card.inputName;

                    return `

                        <div
                            class="card-row"
                            data-image="${escapeHtml(
                                image || ""
                            )}"
                        >

                            <div
                                class="card-main"
                            >

                                <span
                                    class="card-quantity"
                                >
                                    ${card.quantity}x
                                </span>

                                <span
                                    class="card-name"
                                >
                                    ${escapeHtml(
                                        name
                                    )}
                                </span>

                            </div>

                            <span
                                class="card-status ${statusClass}"
                            >
                                ${status}
                            </span>

                        </div>

                    `;

                }
            )
            .join("");

    attachCardHover();

}


/*
===========================================================
RENDER COMANDANTE
===========================================================
*/

function renderCommanderResult(
    card
) {

    const image =
        getCardImage(
            card.scryfall
        );

    const name =
        card.scryfall?.name ||
        card.inputName;

    let status =
        "Comandante legal.";

    if (
        card.status ===
        "banned"
    ) {

        status =
            "Banido como comandante.";

    }

    if (
        card.status ===
        "unknown"
    ) {

        status =
            "Comandante não encontrado.";

    }

    commanderResult.innerHTML = `

        <div
            class="commander-card"
        >

            ${
                image
                    ? `
                        <img
                            src="${escapeHtml(
                                image
                            )}"
                            class="commander-card-image"
                            alt="${escapeHtml(
                                name
                            )}"
                        >
                    `
                    : ""
            }

            <div
                class="commander-card-info"
            >

                <h4>
                    ${escapeHtml(
                        name
                    )}
                </h4>

                <p>
                    ${escapeHtml(
                        status
                    )}
                </p>

                ${
                    card.reason
                        ? `
                            <p>
                                ${escapeHtml(
                                    card.reason
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

        </div>

    `;

}


/*
===========================================================
HOVER DAS CARTAS
===========================================================
*/

function attachCardHover() {

    document
        .querySelectorAll(
            ".card-row"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "mouseenter",
                    event => {

                        const image =
                            row.dataset.image;

                        if (!image) {

                            return;

                        }

                        tooltipImage.src =
                            image;

                        cardTooltip.classList.add(
                            "visible"
                        );

                        moveTooltip(
                            event
                        );

                    }
                );

                row.addEventListener(
                    "mousemove",
                    moveTooltip
                );

                row.addEventListener(
                    "mouseleave",
                    hideTooltip
                );

            }
        );

}


/*
===========================================================
MOVER TOOLTIP
===========================================================
*/

function moveTooltip(
    event
) {

    if (!cardTooltip) {

        return;

    }

    const width =
        240;

    const height =
        340;

    let x =
        event.clientX + 20;

    let y =
        event.clientY + 20;

    if (
        x + width >
        window.innerWidth
    ) {

        x =
            event.clientX -
            width -
            20;

    }

    if (
        y + height >
        window.innerHeight
    ) {

        y =
            event.clientY -
            height -
            20;

    }

    cardTooltip.style.left =
        `${Math.max(
            10,
            x
        )}px`;

    cardTooltip.style.top =
        `${Math.max(
            10,
            y
        )}px`;

}


/*
===========================================================
ESCONDER TOOLTIP
===========================================================
*/

function hideTooltip() {

    if (!cardTooltip) {

        return;

    }

    cardTooltip.classList.remove(
        "visible"
    );

    if (tooltipImage) {

        tooltipImage.src =
            "";

    }

}


/*
===========================================================
LOADING
===========================================================
*/

function showLoading() {

    loadingSection.classList.remove(
        "hidden"
    );

    progressBar.style.width =
        "0%";

}


function hideLoading() {

    loadingSection.classList.add(
        "hidden"
    );

}


function updateLoadingText(
    text
) {

    loadingText.textContent =
        text;

}


function updateProgress(
    done,
    total
) {

    if (!total) {

        return;

    }

    const percent =
        Math.min(
            100,
            Math.round(
                (
                    done /
                    total
                ) *
                100
            )
        );

    progressBar.style.width =
        `${percent}%`;

}


/*
===========================================================
CONTADOR DE LINHAS
===========================================================
*/

function updateLineCounter() {

    const lines =
        deckInput.value
            .split(
                /\r?\n/
            )
            .filter(
                line =>
                    line.trim()
            );

    lineCounter.textContent =
        `${lines.length} linhas`;

}


/*
===========================================================
BOTÃO EXEMPLO
===========================================================
*/

if (
    exampleButton
) {

    exampleButton.addEventListener(
        "click",
        () => {

            deckInput.value =
                EXAMPLE_DECK;

            updateLineCounter();

        }
    );

}


/*
===========================================================
BOTÃO LIMPAR
===========================================================
*/

if (
    clearButton
) {

    clearButton.addEventListener(
        "click",
        () => {

            deckInput.value =
                "";

            commanderInput.value =
                "";

            selectedCommanderCard =
                null;

            if (
                commanderPreview
            ) {

                commanderPreview.classList.add(
                    "hidden"
                );

            }

            hideCommanderDropdown();

            resultSection.classList.add(
                "hidden"
            );

            updateLineCounter();

            deckInput.focus();

        }
    );

}


/*
===========================================================
NOVO DECK
===========================================================
*/

if (
    newValidationButton
) {

    newValidationButton.addEventListener(
        "click",
        () => {

            resultSection.classList.add(
                "hidden"
            );

            window.scrollTo({

                top:
                    0,

                behavior:
                    "smooth"

            });

            deckInput.focus();

        }
    );

}


/*
===========================================================
EVENTOS
===========================================================
*/

if (
    deckInput
) {

    deckInput.addEventListener(
        "input",
        updateLineCounter
    );

    deckInput.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                validateDeck();

            }

        }
    );

}


if (
    validateButton
) {

    validateButton.addEventListener(
        "click",
        validateDeck
    );

}


/*
===========================================================
INICIALIZAÇÃO
===========================================================
*/

createCommanderDropdown();

updateLineCounter();

console.log(
    "Duel Commander Validator carregado corretamente."
);

console.log(
    "Comandante: seleção por autocomplete ativada."
);

console.log(
    "Contagem: comandante separado da lista principal."
);