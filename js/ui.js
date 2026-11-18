"use strict";

/*
===========================================================
DUEL COMMANDER - INTERFACE

Painel de cartas (lista/grade, filtro), visualizador,
tooltip, tema claro/escuro, transições e efeitos de rolagem.

Carrega depois de app.js: usa os elementos e utilitários
definidos lá (cardsList, cardTooltip, escapeHtml,
getCardImage...). app.js só chama as funções daqui em
tempo de execução (renderResult, validateDeck).
===========================================================
*/


/*
===========================================================
ÍCONES (SVG, mesmo traço em todo o site)
===========================================================
*/

const ICONS = {

    check:
        '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path pathLength="1" d="m5.5 12.5 4.2 4.2 8.8-9.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    cross:
        '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path pathLength="1" d="M7 7l10 10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path pathLength="1" d="M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',

    alert:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 7v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.4" fill="currentColor"/></svg>'

};


/*
===========================================================
ESTADO DA VISUALIZAÇÃO
===========================================================
*/

const cardsEmpty =
    document.getElementById("cardsEmpty");

const filterAllCount =
    document.getElementById("filterAllCount");

const filterProblemCount =
    document.getElementById("filterProblemCount");

const viewButtons =
    document.querySelectorAll("[data-view]");

const filterButtons =
    document.querySelectorAll("[data-filter]");

const cardViewer =
    document.getElementById("cardViewer");

const cardViewerImage =
    document.getElementById("cardViewerImage");

const cardViewerStatus =
    document.getElementById("cardViewerStatus");

const cardViewerName =
    document.getElementById("cardViewerName");

const cardViewerReason =
    document.getElementById("cardViewerReason");

let renderedCards =
    [];

let renderedCommander =
    null;

let cardFilter =
    "all";

let cardView =
    (() => {

        /* acessar localStorage pode lançar em modo privado */

        try {

            return readStoredView(
                localStorage
            );

        } catch (error) {

            return "list";

        }

    })();


/*
===========================================================
RENDER CARTAS
===========================================================
*/

function renderCards(
    cards
) {

    renderedCards =
        [...cards];

    const problemTotal =
        renderedCards.filter(
            isProblemCard
        ).length;

    if (filterAllCount) {

        filterAllCount.textContent =
            renderedCards.length;

    }

    if (filterProblemCount) {

        filterProblemCount.textContent =
            problemTotal;

    }

    filterButtons.forEach(
        button => {

            if (
                button.dataset.filter ===
                "problems"
            ) {

                button.disabled =
                    problemTotal === 0;

            }

        }
    );

    if (
        problemTotal === 0 &&
        cardFilter === "problems"
    ) {

        cardFilter =
            "all";

    }

    syncCardControls();

    paintCards();

}


function paintCards() {

    hideTooltip();

    const groups =
        buildCardGroups(
            renderedCards,
            cardFilter
        );

    cardsList.classList.toggle(
        "is-list",
        cardView === "list"
    );

    cardsList.classList.toggle(
        "is-grid",
        cardView === "grid"
    );

    cardsList.innerHTML =
        groups
            .map(
                group => `
                    <section class="card-group">
                        <h4 class="card-group-title">
                            ${escapeHtml(
                                group.label
                            )}
                            <span>${group.copies}</span>
                        </h4>
                        <div class="card-group-items">
                            ${group.items
                                .map(
                                    cardTemplate
                                )
                                .join("")}
                        </div>
                    </section>
                `
            )
            .join("");

    if (cardsEmpty) {

        cardsEmpty.textContent =
            cardFilter === "problems"
                ? "Nenhuma carta com problema. Tudo certo por aqui."
                : "Nenhuma carta foi analisada.";

        cardsEmpty.classList.toggle(
            "hidden",
            groups.length > 0
        );

    }

    /*
    Imagens que já vieram do cache não precisam
    do efeito de carregamento.
    */

    cardsList
        .querySelectorAll(
            "img.is-loading"
        )
        .forEach(
            img => {

                if (
                    img.complete &&
                    img.naturalWidth
                ) {

                    img.classList.remove(
                        "is-loading"
                    );

                }

            }
        );

}


function cardTemplate({
    card,
    index
}) {

    const meta =
        getStatusMeta(
            card.status
        );

    const image =
        getCardImage(
            card.scryfall
        );

    const name =
        card.scryfall?.name ||
        card.inputName;

    const quantity =
        Number(
            card.quantity
        ) ||
        1;

    return `
        <button
            type="button"
            class="deck-card is-${meta.className}"
            data-index="${index}"
            data-image="${escapeHtml(
                image || ""
            )}"
            aria-label="${escapeHtml(
                `${quantity}x ${name}: ${meta.label}`
            )}"
        >
            <span class="deck-card-art">
                ${
                    image
                        ? `<img
                                src="${escapeHtml(
                                    image
                                )}"
                                alt=""
                                class="is-loading"
                                loading="lazy"
                                decoding="async"
                            >`
                        : `<span class="deck-card-placeholder">${escapeHtml(
                                name
                            )}</span>`
                }
                ${
                    quantity > 1
                        ? `<span class="deck-card-qty-badge">${quantity}x</span>`
                        : ""
                }
            </span>

            <span class="deck-card-meta">
                <span class="card-quantity">${quantity}x</span>
                <span class="card-name">${escapeHtml(
                    name
                )}</span>
                <span class="card-status ${meta.className}">${meta.label}</span>
            </span>
        </button>
    `;

}


/*
===========================================================
CONTROLES: LISTA / GRADE E FILTRO
===========================================================
*/

function syncCardControls() {

    viewButtons.forEach(
        button => {

            const active =
                button.dataset.view ===
                cardView;

            button.classList.toggle(
                "is-active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        }
    );

    filterButtons.forEach(
        button => {

            const active =
                button.dataset.filter ===
                cardFilter;

            button.classList.toggle(
                "is-active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                String(active)
            );

        }
    );

    positionThumbs();

}


/*
Indicador deslizante dos segmented controls.
Só assume o papel do fundo ativo depois de medido,
para o botão ativo nunca ficar sem destaque.
*/

function positionThumbs() {

    document
        .querySelectorAll(
            ".segmented"
        )
        .forEach(
            group => {

                const active =
                    group.querySelector(
                        ".segmented-option.is-active"
                    );

                if (
                    !active ||
                    !active.offsetWidth
                ) {

                    return;

                }

                let thumb =
                    group.querySelector(
                        ".segmented-thumb"
                    );

                if (!thumb) {

                    thumb =
                        document.createElement(
                            "span"
                        );

                    thumb.className =
                        "segmented-thumb";

                    thumb.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    group.prepend(
                        thumb
                    );

                }

                group.style.setProperty(
                    "--thumb-x",
                    `${active.offsetLeft}px`
                );

                group.style.setProperty(
                    "--thumb-w",
                    `${active.offsetWidth}px`
                );

                group.classList.add(
                    "has-thumb"
                );

                if (
                    !group.classList.contains(
                        "is-ready"
                    )
                ) {

                    requestAnimationFrame(
                        () =>
                            group.classList.add(
                                "is-ready"
                            )
                    );

                }

            }
        );

}

if (
    "ResizeObserver" in window
) {

    const thumbObserver =
        new ResizeObserver(
            positionThumbs
        );

    document
        .querySelectorAll(
            ".segmented"
        )
        .forEach(
            group =>
                thumbObserver.observe(
                    group
                )
        );

}


/*
Troca de lista/grade e de filtro com View Transition:
a lista atual se dissolve na nova; o toolbar fica vivo
para o indicador deslizar por cima.
*/

function repaintCardsWithTransition() {

    if (
        !document.startViewTransition
    ) {

        paintCards();

        return;

    }

    const root =
        document.documentElement;

    /*
    Um toque rápido (ou teclado) pode iniciar outra
    transição antes da anterior acabar: só a mais
    recente remove a classe.
    */

    const token =
        ++viewTransitionToken;

    root.classList.add(
        "vt-view"
    );

    const transition =
        document.startViewTransition(
            paintCards
        );

    transition.finished.finally(
        () => {

            if (
                token ===
                viewTransitionToken
            ) {

                root.classList.remove(
                    "vt-view"
                );

            }

        }
    );

}

let viewTransitionToken =
    0;

viewButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    cardView ===
                    button.dataset.view
                ) {

                    return;

                }

                cardView =
                    button.dataset.view;

                try {

                    localStorage.setItem(
                        VIEW_STORAGE_KEY,
                        cardView
                    );

                } catch (error) {

                    /* armazenamento indisponível: segue sem salvar */

                }

                syncCardControls();

                repaintCardsWithTransition();

            }
        );

    }
);

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    button.disabled ||
                    cardFilter ===
                    button.dataset.filter
                ) {

                    return;

                }

                cardFilter =
                    button.dataset.filter;

                syncCardControls();

                repaintCardsWithTransition();

            }
        );

    }
);

syncCardControls();


/*
===========================================================
RENDER COMANDANTE
===========================================================
*/

function renderCommanderResult(
    card
) {

    renderedCommander =
        card;

    const image =
        getCardImage(
            card.scryfall
        );

    const name =
        card.scryfall?.name ||
        card.inputName;

    let status =
        "Comandante legal.";

    let stateClass =
        "legal";

    if (
        card.status ===
        "banned"
    ) {

        status =
            "Banido como comandante.";

        stateClass =
            "banned";

    }

    if (
        card.status ===
        "unknown"
    ) {

        status =
            "Comandante não encontrado.";

        stateClass =
            "unknown";

    }

    const reason =
        card.reason &&
        card.reason !== status
            ? card.reason
            : "";

    commanderResult.innerHTML = `

        <div class="commander-card">

            ${
                image
                    ? `
                        <button
                            type="button"
                            class="commander-card-zoom"
                            data-commander-zoom
                            aria-label="Ampliar ${escapeHtml(
                                name
                            )}"
                        >
                            <img
                                src="${escapeHtml(
                                    image
                                )}"
                                class="commander-card-image"
                                alt="${escapeHtml(
                                    name
                                )}"
                            >
                        </button>
                    `
                    : ""
            }

            <div class="commander-card-info">

                <h4>${escapeHtml(
                    name
                )}</h4>

                <p class="commander-state ${stateClass}">${escapeHtml(
                    status
                )}</p>

                ${
                    reason
                        ? `<p>${escapeHtml(
                                reason
                            )}</p>`
                        : ""
                }

            </div>

        </div>

    `;

}

if (commanderResult) {

    commanderResult.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "[data-commander-zoom]"
                ) &&
                renderedCommander
            ) {

                openCardViewer(
                    renderedCommander,
                    commanderResult.querySelector(
                        ".commander-card-image"
                    )
                );

            }

        }
    );

}


/*
===========================================================
HOVER DAS CARTAS (só na lista, só com mouse)

Delegado no container: funciona após cada novo render
sem precisar religar eventos.
===========================================================
*/

const canHover =
    window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

function attachCardHover() {

    if (!cardsList) {

        return;

    }

    cardsList.addEventListener(
        "mouseover",
        event => {

            if (
                cardView !== "list" ||
                !canHover.matches
            ) {

                return;

            }

            const row =
                event.target.closest(
                    ".deck-card"
                );

            if (
                !row ||
                row.contains(
                    event.relatedTarget
                )
            ) {

                return;

            }

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

    cardsList.addEventListener(
        "mousemove",
        event => {

            if (
                cardTooltip.classList.contains(
                    "visible"
                )
            ) {

                moveTooltip(
                    event
                );

            }

        }
    );

    cardsList.addEventListener(
        "mouseout",
        event => {

            const row =
                event.target.closest(
                    ".deck-card"
                );

            if (
                row &&
                !row.contains(
                    event.relatedTarget
                )
            ) {

                hideTooltip();

            }

        }
    );

    cardsList.addEventListener(
        "click",
        event => {

            const row =
                event.target.closest(
                    ".deck-card"
                );

            if (!row) {

                return;

            }

            const card =
                renderedCards[
                    Number(
                        row.dataset.index
                    )
                ];

            if (card) {

                /*
                Na grade, a imagem clicada é a origem
                da animação até o visualizador.
                */

                openCardViewer(
                    card,
                    cardView === "grid"
                        ? row.querySelector(
                            ".deck-card-art img"
                        )
                        : null
                );

            }

        }
    );

    /*
    Efeito de carregamento das imagens da grade.
    load/error não borbulham, por isso a captura.
    */

    const revealImage =
        event => {

            if (
                event.target.tagName ===
                "IMG"
            ) {

                event.target.classList.remove(
                    "is-loading"
                );

            }

        };

    cardsList.addEventListener(
        "load",
        revealImage,
        true
    );

    cardsList.addEventListener(
        "error",
        revealImage,
        true
    );

}

attachCardHover();


/*
===========================================================
MOVIMENTO: PREFERÊNCIA E VIEW TRANSITIONS
===========================================================
*/

const prefersReducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

function canMorph() {

    return (
        typeof document.startViewTransition ===
            "function" &&
        !prefersReducedMotion.matches
    );

}

let viewerSource =
    null;


/*
===========================================================
VISUALIZADOR DA CARTA
===========================================================
*/

function openCardViewer(
    card,
    sourceImage
) {

    if (
        !cardViewer ||
        typeof cardViewer.showModal !==
            "function"
    ) {

        return;

    }

    hideTooltip();

    const meta =
        getStatusMeta(
            card.status
        );

    const image =
        getCardImage(
            card.scryfall
        );

    const name =
        card.scryfall?.name ||
        card.inputName;

    if (image) {

        cardViewerImage.src =
            image;

    } else {

        cardViewerImage.removeAttribute(
            "src"
        );

    }

    cardViewerImage.alt =
        name;

    cardViewerStatus.className =
        `card-status ${meta.className}`;

    cardViewerStatus.textContent =
        meta.label;

    cardViewerName.textContent =
        name;

    cardViewerReason.textContent =
        card.reason || "";

    const morph =
        Boolean(
            image &&
            sourceImage &&
            sourceImage.offsetWidth &&
            canMorph()
        );

    viewerSource =
        morph
            ? sourceImage
            : null;

    if (!morph) {

        cardViewer.showModal();

        return;

    }

    /*
    A carta "voa" da grade até o visualizador:
    o mesmo nome de transição passa da imagem de
    origem para a imagem do diálogo.
    */

    sourceImage.style.viewTransitionName =
        "card-zoom";

    cardViewer.classList.add(
        "is-morphing"
    );

    const transition =
        document.startViewTransition(
            () => {

                sourceImage.style.viewTransitionName =
                    "";

                cardViewerImage.style.viewTransitionName =
                    "card-zoom";

                cardViewer.showModal();

            }
        );

    transition.finished.finally(
        () => {

            cardViewerImage.style.viewTransitionName =
                "";

            cardViewer.classList.remove(
                "is-morphing"
            );

        }
    );

}


function closeCardViewer() {

    if (
        !cardViewer ||
        !cardViewer.open
    ) {

        return;

    }

    const source =
        viewerSource;

    viewerSource =
        null;

    if (
        !source ||
        !source.isConnected ||
        !canMorph()
    ) {

        cardViewer.close();

        return;

    }

    /*
    Volta para o lugar de onde veio.
    */

    cardViewerImage.style.viewTransitionName =
        "card-zoom";

    const transition =
        document.startViewTransition(
            () => {

                cardViewerImage.style.viewTransitionName =
                    "";

                source.style.viewTransitionName =
                    "card-zoom";

                cardViewer.close();

            }
        );

    transition.finished.finally(
        () => {

            source.style.viewTransitionName =
                "";

        }
    );

}

if (cardViewer) {

    /*
    O backdrop só fecha se o gesto começou nele:
    evita fechar com duplo clique na lista ou com uma
    seleção de texto que termina fora do conteúdo.
    */

    let pressStartedOnBackdrop =
        false;

    cardViewer.addEventListener(
        "pointerdown",
        event => {

            pressStartedOnBackdrop =
                event.target === cardViewer;

        }
    );

    cardViewer.addEventListener(
        "click",
        event => {

            const onBackdrop =
                event.target === cardViewer &&
                pressStartedOnBackdrop;

            pressStartedOnBackdrop =
                false;

            if (
                onBackdrop ||
                event.target.closest(
                    "[data-close-viewer]"
                )
            ) {

                closeCardViewer();

            }

        }
    );

    /*
    Esc também volta com a animação. Quando o navegador
    não deixa cancelar (regras de close watcher), o
    diálogo fecha sozinho: só limpamos a origem.
    */

    cardViewer.addEventListener(
        "cancel",
        event => {

            if (!event.cancelable) {

                viewerSource =
                    null;

                return;

            }

            event.preventDefault();

            closeCardViewer();

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

        tooltipImage.removeAttribute(
            "src"
        );

    }

}


/*
===========================================================
TEMA CLARO / ESCURO

O tema inicial é aplicado por um script no <head>
(sem flash). Aqui ficam o botão e a sincronia com
o sistema quando o visitante não escolheu nada.
===========================================================
*/

const THEME_STORAGE_KEY =
    "dc_theme";

const themeToggle =
    document.getElementById("themeToggle");

const systemDark =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

function applyTheme(
    theme
) {

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    document
        .querySelectorAll(
            'meta[name="theme-color"]'
        )
        .forEach(
            meta => {

                meta.setAttribute(
                    "content",
                    theme === "dark"
                        ? "#000000"
                        : "#ffffff"
                );

            }
        );

    if (themeToggle) {

        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Alternar para o modo claro"
                : "Alternar para o modo escuro"
        );

    }

}

function getStoredTheme() {

    try {

        const value =
            localStorage.getItem(
                THEME_STORAGE_KEY
            );

        return value === "light" || value === "dark"
            ? value
            : null;

    } catch (error) {

        return null;

    }

}

applyTheme(
    getStoredTheme() ||
    (
        systemDark.matches
            ? "dark"
            : "light"
    )
);

if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        () => {

            const root =
                document.documentElement;

            const next =
                root.getAttribute(
                    "data-theme"
                ) === "dark"
                    ? "light"
                    : "dark";

            const commit =
                () => {

                    applyTheme(
                        next
                    );

                    try {

                        localStorage.setItem(
                            THEME_STORAGE_KEY,
                            next
                        );

                    } catch (error) {

                        /* sem armazenamento: vale só nesta visita */

                    }

                };

            if (!canMorph()) {

                /*
                Sem View Transitions (ou com movimento
                reduzido): as cores fazem crossfade via CSS.
                */

                commit();

                return;

            }

            /*
            A nova aparência se expande em círculo
            a partir do botão, até cobrir a tela.
            */

            const rect =
                themeToggle.getBoundingClientRect();

            const x =
                rect.left + rect.width / 2;

            const y =
                rect.top + rect.height / 2;

            const radius =
                Math.hypot(
                    Math.max(
                        x,
                        window.innerWidth - x
                    ),
                    Math.max(
                        y,
                        window.innerHeight - y
                    )
                );

            root.classList.add(
                "theme-transition"
            );

            const transition =
                document.startViewTransition(
                    commit
                );

            transition.ready.then(
                () => {

                    root.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${radius}px at ${x}px ${y}px)`
                            ]
                        },
                        {
                            duration: 650,
                            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                            pseudoElement: "::view-transition-new(root)"
                        }
                    );

                }
            ).catch(
                () => {

                    /* transição pulada (ex.: aba oculta): o tema já foi aplicado */

                }
            );

            transition.finished.finally(
                () =>
                    root.classList.remove(
                        "theme-transition"
                    )
            );

        }
    );

}


/*
===========================================================
BARRA DE NAVEGAÇÃO E TOOLBAR AO ROLAR
===========================================================
*/

(() => {

    const nav =
        document.querySelector(
            ".globalnav"
        );

    const toolbar =
        document.querySelector(
            ".cards-toolbar"
        );

    let queued =
        false;

    const update =
        () => {

            queued =
                false;

            if (nav) {

                nav.classList.toggle(
                    "is-scrolled",
                    window.scrollY > 4
                );

            }

            if (toolbar) {

                const style =
                    getComputedStyle(
                        toolbar
                    );

                /*
                O limite vem do próprio CSS (top do sticky),
                não de um número repetido aqui.
                */

                const stuck =
                    toolbar.offsetParent !== null &&
                    style.position === "sticky" &&
                    toolbar.getBoundingClientRect().top <=
                        (parseFloat(style.top) || 0) + 1;

                toolbar.classList.toggle(
                    "is-stuck",
                    stuck
                );

            }

        };

    window.addEventListener(
        "scroll",
        () => {

            if (!queued) {

                queued =
                    true;

                requestAnimationFrame(
                    update
                );

            }

        },
        {
            passive: true
        }
    );

    update();

})();


systemDark.addEventListener(
    "change",
    event => {

        if (!getStoredTheme()) {

            applyTheme(
                event.matches
                    ? "dark"
                    : "light"
            );

        }

    }
);


/*
===========================================================
DATA DA BANLIST NO TOPO
===========================================================
*/

(() => {

    const target =
        document.getElementById(
            "banlistDate"
        );

    if (
        target &&
        typeof DUEL_COMMANDER_BANLIST !==
            "undefined" &&
        DUEL_COMMANDER_BANLIST.updatedAt
    ) {

        target.textContent =
            DUEL_COMMANDER_BANLIST.updatedAt;

    }

})();


console.log(
    "Duel Commander Validator carregado corretamente."
);

console.log(
    "Comandante: seleção por autocomplete ativada."
);

console.log(
    "Contagem: comandante separado da lista principal."
);