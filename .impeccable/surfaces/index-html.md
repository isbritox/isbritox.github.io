---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Validator (index.html)

Scope: the single-page deck validator. Visitor mode: Operate.

Audience/job: players before an event and organizers checking submitted lists; paste a list, get a verdict, find the offending cards, inspect the deck in list or grid (grid grouped by card type). Constraints: keep every existing function (autocomplete, preview, Ctrl+Enter, example, clear, cache, banlist logic), static GitHub Pages, pt-BR.

## Direction contract

THESIS: The verdict is the headline. Refuses the dark "gamer dashboard" with purple gradients, numbered panels and glowing cards; the page reads like an apple.com product page that happens to be a working tool.

OWN-WORLD: White / #f5f5f7 tiles in light, black / #1c1c1e in dark; one action blue (#0071e3), system semantic green/red/orange only for card state. SF Pro (Inter fallback), tight negative tracking, 980px pill buttons, iOS segmented controls, frosted 52px global nav, hairline separators; frosted glass tiles with hairline rims over one static soft blue light (owner request 2: "efeitos de vidro"). No purple, no colored glows.

STORY: Visitor pastes the list, presses one blue pill, sees a huge verdict sentence, then the commander, the problems, and the whole deck as images grouped by type.

FIRST VIEWPORT: Frosted nav (brand left; banlist date + theme toggle right). Centered two-tone headline "Valide seu deck. Em segundos." ~80px, lead paragraph, then the composer tile (commander | decklist) starting above the fold; the blue pill sits under the composer.

FORM: Apple product-page grammar applied to a tool, position 1 (pinned). seed: none (pinned) "quero algo no estilo o site da Apple, onde poderá mudar para o modo claro ou escuro"

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
