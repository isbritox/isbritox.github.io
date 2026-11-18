/*
    Cartas de exemplo para os testes de interface.
    image_uris: null => nenhuma imagem é baixada (teste sem rede).
*/

const sf = (name, type_line) => ({ name, type_line, image_uris: null });

window.fixtureCards = [
    { status: "legal", quantity: 1, inputName: "Brainstorm", reason: "", scryfall: sf("Brainstorm", "Instant") },
    { status: "banned", quantity: 2, inputName: "Mana Crypt", reason: "Esta carta é banida no Duel Commander.", scryfall: sf("Mana Crypt", "Artifact") },
    { status: "commanderOnly", quantity: 1, inputName: "Edgar Markov", reason: "Banida como comandante.", scryfall: sf("Edgar Markov", "Legendary Creature — Vampire Knight") },
    { status: "legal", quantity: 1, inputName: "Seat of the Synod", reason: "", scryfall: sf("Seat of the Synod", "Artifact Land") },
    { status: "unknown", quantity: 1, inputName: "Cartaquenaoexiste", reason: "Não foi possível localizar esta carta no Scryfall.", scryfall: null },
    { status: "legal", quantity: 1, inputName: "Forest", reason: "", scryfall: sf("Forest", "Basic Land — Forest") }
];

window.fixtureProblems = [
    { name: "Mana Crypt", reason: "Esta carta é banida no Duel Commander.", quantity: 2 },
    { name: "Cartaquenaoexiste", reason: "Não foi possível localizar esta carta no Scryfall.", quantity: 1 }
];
