# isbritox.github.io

Validador de decks de Duel Commander (Magic: The Gathering): cole a decklist, veja o veredito e as cartas em lista ou em grade, com tema claro e escuro.

## Desenvolvimento

Site estático, sem build: abra `index.html` no navegador ou publique pelo GitHub Pages.

Os testes rodam no Chrome headless (precisa do Google Chrome instalado):

```sh
sh tests/run.sh tests/deck-view.test.html
sh tests/run.sh tests/ui.test.html
```

Para outro caminho do Chrome, defina `CHROME=/caminho/para/chrome`.

Arquivos principais:

- `js/banlist.js`: banlist oficial do Duel Commander
- `js/deck-view.js`: lógica pura de visualização (status, agrupamento por tipo, filtro)
- `js/app.js`: leitura da decklist, Scryfall e validação
- `js/ui.js`: interface (lista/grade, visualizador, tema, transições)
- `DESIGN.md`: sistema de design
