"use strict";

/*
===========================================================
DUEL COMMANDER - MODELO DE VISUALIZAÇÃO DAS CARTAS

Lógica pura (sem DOM): status, agrupamento por tipo,
filtro e preferência de visualização. Testada em
tests/deck-view.test.html.
===========================================================
*/


/*
===========================================================
STATUS DAS CARTAS
===========================================================
*/

const CARD_STATUS_META = {

    banned: {
        label: "Banida",
        className: "banned",
        order: 0
    },

    unknown: {
        label: "Não encontrada",
        className: "unknown",
        order: 1
    },

    commanderOnly: {
        label: "Só no deck",
        className: "commander-banned",
        order: 2
    },

    legal: {
        label: "Legal",
        className: "legal",
        order: 3
    }

};

function getStatusMeta(
    status
) {

    return (
        CARD_STATUS_META[status] ||
        CARD_STATUS_META.unknown
    );

}

function isProblemCard(
    card
) {

    return (
        card.status === "banned" ||
        card.status === "unknown"
    );

}


/*
===========================================================
AGRUPAMENTO POR TIPO

Usa a type_line da primeira face (cartas de duas faces
entram pelo tipo da frente). Terreno vem antes de
artefato para que terrenos-artefato fiquem em Terrenos;
"Land Creature" (Dryad Arbor) fica em Criaturas.
===========================================================
*/

const CARD_GROUPS = [

    { id: "creature", label: "Criaturas" },
    { id: "planeswalker", label: "Planeswalkers" },
    { id: "battle", label: "Batalhas" },
    { id: "instant", label: "Mágicas instantâneas" },
    { id: "sorcery", label: "Feitiços" },
    { id: "artifact", label: "Artefatos" },
    { id: "enchantment", label: "Encantamentos" },
    { id: "land", label: "Terrenos" },
    { id: "other", label: "Outras" },
    { id: "unknown", label: "Não encontradas" }

];

function getCardGroup(
    card
) {

    const scryfall =
        card.scryfall;

    if (!scryfall) {

        return "unknown";

    }

    const typeLine =
        (
            scryfall.type_line ||
            scryfall.card_faces?.[0]?.type_line ||
            ""
        )
            .split("//")[0]
            .toLowerCase();

    if (
        typeLine.includes("land") &&
        !typeLine.includes("creature")
    ) {

        return "land";

    }

    const checks = [
        "creature",
        "planeswalker",
        "battle",
        "instant",
        "sorcery",
        "artifact",
        "enchantment",
        "land"
    ];

    return (
        checks.find(
            type =>
                typeLine.includes(
                    type
                )
        ) ||
        "other"
    );

}


/*
===========================================================
GRUPOS PARA RENDERIZAR

Retorna os grupos na ordem de CARD_GROUPS, sem grupos
vazios. Cada item guarda o índice da carta na lista
original (usado pelo clique para achar a carta).
===========================================================
*/

function buildCardGroups(
    cards,
    filter
) {

    const entries =
        cards
            .map(
                (
                    card,
                    index
                ) => ({
                    card,
                    index
                })
            )
            .filter(
                ({ card }) =>
                    filter !== "problems" ||
                    isProblemCard(
                        card
                    )
            );

    return CARD_GROUPS
        .map(
            group => {

                const items =
                    entries
                        .filter(
                            ({ card }) =>
                                getCardGroup(
                                    card
                                ) === group.id
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                getStatusMeta(
                                    a.card.status
                                ).order -
                                getStatusMeta(
                                    b.card.status
                                ).order
                        );

                const copies =
                    items.reduce(
                        (
                            sum,
                            { card }
                        ) =>
                            sum +
                            (
                                Number(
                                    card.quantity
                                ) ||
                                1
                            ),
                        0
                    );

                return {
                    id: group.id,
                    label: group.label,
                    copies,
                    items
                };

            }
        )
        .filter(
            group =>
                group.items.length
        );

}


/*
===========================================================
PREFERÊNCIA DE VISUALIZAÇÃO
===========================================================
*/

const VIEW_STORAGE_KEY =
    "dc_card_view";

function readStoredView(
    storage
) {

    try {

        return storage.getItem(
            VIEW_STORAGE_KEY
        ) === "grid"
            ? "grid"
            : "list";

    } catch (error) {

        return "list";

    }

}


/*
===========================================================
RESUMO DOS PROBLEMAS (linha do veredito)

Conta cartas banidas e não encontradas entre as cartas
analisadas; o resto da lista de problemas (estrutura,
comandante, cópias) entra como "outro problema".
Ex.: "3 cartas banidas, 1 não encontrada e 1 outro problema."
===========================================================
*/

function describeProblems(
    analyzed,
    problems
) {

    if (!problems.length) {

        return "Nenhum problema encontrado.";

    }

    const count =
        status =>
            analyzed.filter(
                card =>
                    card.status === status
            ).length;

    const banned =
        count("banned");

    const unknown =
        count("unknown");

    const other =
        Math.max(
            0,
            problems.length - banned - unknown
        );

    const plural =
        (
            amount,
            singular,
            pluralForm
        ) =>
            `${amount} ${amount === 1 ? singular : pluralForm}`;

    const parts = [];

    if (banned) {

        parts.push(
            plural(
                banned,
                "carta banida",
                "cartas banidas"
            )
        );

    }

    if (unknown) {

        parts.push(
            plural(
                unknown,
                "não encontrada",
                "não encontradas"
            )
        );

    }

    if (other) {

        parts.push(
            plural(
                other,
                "outro problema",
                "outros problemas"
            )
        );

    }

    const sentence =
        parts.length > 1
            ? `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`
            : parts[0];

    return `${sentence}.`;

}
