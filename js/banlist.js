/*
    ============================================
    DUEL COMMANDER BANLIST
    ============================================

    Fonte:
    https://www.duelcommander.org/banlist/

    Última verificação:
    27/07/2026
*/

const DUEL_COMMANDER_BANLIST = {

    updatedAt: "27/07/2026",


    /*
        BANIDAS COMO COMMANDER

        Podem existir no deck,
        mas não podem ser o comandante.
    */

    bannedAsCommander: [

        "Ajani, Nacatl Pariah // Ajani, Nacatl Avenger",
        "Arahbo, Roar of the World",
        "Derevi, Empyrial Tactician",
        "Dihada, Binder of Wills",
        "Edgar Markov",
        "Edric, Spymaster of Trest",
        "Eris, Roar of the Storm",
        "Ezio Auditore da Firenze",
        "Geist of Saint Traft",
        "Hogaak, Arisen Necropolis",
        "Inalla, Archmage Ritualist",
        "Krark, the Thumbless",
        "Lumra, bellow of the woods",
        "Minsc & Boo, Timeless Heroes",
        "Old Stickfingers",
        "Oloro, Ageless Ascetic",
        "Omnath, Locus of Creation",
        "Prime Speaker Vannifar",
        "Raffine, Scheming Seer",
        "Rograkh, Son of Rohgahh",
        "Shorikai, Genesis Engine",
        "Spider-Man 2099",
        "Tamiyo, Inquisitive Student",
        "The Fantasticar",
        "Urza, Lord High Artificer",
        "Vial Smasher the Fierce",
        "Yuriko, the Tiger's Shadow"

    ],


    /*
        BANIDAS NO DECK

        Não podem aparecer no deck.
    */

    bannedInDeck: [

        "Ancestral Recall",
        "Ancient Tomb",
        "Back to Basics",
        "Balance",
        "Bazaar of Baghdad",
        "Black Lotus",
        "Blood Moon",
        "Capture of Jingzhou",
        "Cavern of Souls",
        "Channel",
        "Chrome Mox",
        "Comet, Stellar Pup",
        "Dark Ritual",
        "Deadly Rollick",
        "Deflecting Swat",
        "Dig Through Time",
        "Emrakul, the Aeons Torn",
        "Entomb",
        "Fastbond",
        "Field of the Dead",
        "Fierce Guardianship",
        "Flawless Maneuver",
        "Food Chain",
        "Force of Will",
        "Gaea's Cradle",
        "Genesis Storm",
        "Gifts Ungiven",
        "Grim Monolith",
        "Hermit Druid",
        "Humility",
        "Imperial Seal",
        "Invert Polarity",
        "Jeweled Lotus",
        "Karakas",
        "Library of Alexandria",
        "Lion's Eye Diamond",
        "Lotus Petal",
        "Maddening Hex",
        "Mana Crypt",
        "Mana Drain",
        "Mana Vault",
        "Mishra's Workshop",
        "Mox Amber",
        "Mox Diamond",
        "Mox Emerald",
        "Mox Jet",
        "Mox Opal",
        "Mox Pearl",
        "Mox Ruby",
        "Mox Sapphire",
        "Mystical Tutor",
        "Nadu, Winged Wisdom",
        "Natural Order",
        "Oath of Druids",
        "Price of Progress",
        "Protean Hulk",
        "Ragavan, Nimble Pilferer",
        "Rain of Filth",
        "Reanimate",
        "Scapeshift",
        "Sensei's Divining Top",
        "Serra's Sanctum",
        "Sol Ring",
        "Strip Mine",
        "Temporal Manipulation",
        "Thassa's Oracle",
        "The One Ring",
        "The Tabernacle at Pendrell Vale",
        "Time Vault",
        "Time Walk",
        "Time Warp",
        "Timetwister",
        "Tinker",
        "Tolarian Academy",
        "Treasure Cruise",
        "Underworld Breach",
        "Uro, Titan of Nature's Wrath",
        "Vampiric Tutor",
        "Wasteland",
        "White Plume Adventurer"

    ],


    /*
        BANIDA COMO COMPANION
    */

    bannedAsCompanion: [

        "Lutri, the Spellchaser"

    ],


    /*
        BANIDAS POR CONTEÚDO OFENSIVO
    */

    offensiveContent: [

        "Cleanse",
        "Crusade",
        "Imprison",
        "Invoke Prejudice",
        "Jihad",
        "Pradesh Gypsies",
        "Stone-Throwing Devils"

    ],


    /*
        BANIDAS ESTRUTURALMENTE

        Algumas dessas categorias não são
        simples nomes de cartas.
    */

    structuralCards: [

        "Chaos Orb",
        "Falling Star",
        "Contract from Below",
        "Shahrazad"

    ],


    /*
        Conspiracy
    */

    structuralSets: [

        "conspiracy"

    ]

};


/*
    ============================================
    NORMALIZAÇÃO
    ============================================
*/

function normalizeCardName(name) {

    if (!name) {
        return "";
    }

    return name

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .replace(/[’']/g, "'")

        .replace(/\s+/g, " ")

        .trim()

        .toLowerCase();

}


/*
    ============================================
    MAPA DE BANLIST
    ============================================
*/

const BANLIST_LOOKUP = new Map();


DUEL_COMMANDER_BANLIST.bannedAsCommander.forEach(
    card => {

        BANLIST_LOOKUP.set(
            normalizeCardName(card),
            "bannedAsCommander"
        );

    }
);


DUEL_COMMANDER_BANLIST.bannedInDeck.forEach(
    card => {

        BANLIST_LOOKUP.set(
            normalizeCardName(card),
            "bannedInDeck"
        );

    }
);


DUEL_COMMANDER_BANLIST.bannedAsCompanion.forEach(
    card => {

        BANLIST_LOOKUP.set(
            normalizeCardName(card),
            "bannedAsCompanion"
        );

    }
);


DUEL_COMMANDER_BANLIST.offensiveContent.forEach(
    card => {

        BANLIST_LOOKUP.set(
            normalizeCardName(card),
            "bannedInDeck"
        );

    }
);


DUEL_COMMANDER_BANLIST.structuralCards.forEach(
    card => {

        BANLIST_LOOKUP.set(
            normalizeCardName(card),
            "structural"
        );

    }
);


/*
    ============================================
    FUNÇÃO DE CONSULTA
    ============================================
*/

function getBanlistStatus(cardName, isCommander = false) {

    const normalized =
        normalizeCardName(cardName);

    const status =
        BANLIST_LOOKUP.get(normalized);

    if (!status) {

        return {
            status: "legal"
        };

    }


    if (
        status === "bannedAsCommander" &&
        isCommander
    ) {

        return {
            status: "banned",
            reason: "Banida como comandante."
        };

    }


    if (
        status === "bannedAsCommander" &&
        !isCommander
    ) {

        return {
            status: "legal",
            commanderOnly: true,
            reason:
                "Esta carta é banida como comandante, mas pode ser utilizada no deck."
        };

    }


    if (status === "bannedInDeck") {

        return {
            status: "banned",
            reason:
                "Esta carta é banida no Duel Commander."
        };

    }


    if (status === "bannedAsCompanion") {

        return {
            status: "legal",
            companionOnly: true,
            reason:
                "Esta carta é banida somente como companion."
        };

    }


    if (status === "structural") {

        return {
            status: "banned",
            reason:
                "Esta carta é proibida pelas regras estruturais do formato."
        };

    }


    return {
        status: "legal"
    };

}