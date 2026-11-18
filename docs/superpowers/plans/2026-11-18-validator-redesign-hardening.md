# Validator Redesign Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Apple-style redesign (list/grid by type, light/dark, glass, transitions) under automated tests, move the new UI code out of the 5,864-line `js/app.js` into focused files without changing behavior, apply the finish-review fixes the user approved, document the design system, and commit it all on a feature branch.

**Architecture:** Static site, no build step. Pure view logic (status labels, type grouping, filtering) moves to `js/deck-view.js`, which has no DOM access and is tested in isolation. DOM-bound UI (cards panel, viewer, theme, scroll effects) moves to `js/ui.js`. `js/app.js` keeps parsing, Scryfall and validation. Tests are plain HTML pages run in headless Chrome by `tests/run.sh`; they print `TEST PASS` / `TEST FAIL` lines to the console.

**Tech Stack:** HTML, CSS, vanilla JS (classic `<script>` tags, global functions), headless Chrome for tests, Git Bash.

**Spec:** `PRODUCT.md` (product truth) and `.impeccable/surfaces/index-html.md` (direction contract). The behavior being preserved is the current working tree of `index.html`, `css/style.css` and `js/app.js`.

## Global Constraints

- No build step, no npm dependencies, no frameworks. The site must keep working when `index.html` is opened from GitHub Pages.
- Script order in `index.html`: `js/banlist.js`, then `js/deck-view.js`, then `js/app.js`, then `js/ui.js`. Everything stays a classic script (no `type="module"`), because `app.js` calls UI functions as globals.
- Every element ID that exists today in `index.html` stays, with the same meaning.
- localStorage keys stay as they are: `dc_theme`, `dc_card_view`, `duel_commander_scryfall_cache_v4`, `duel_commander_autocomplete_cache_v3`. Every read and write stays inside `try/catch`.
- UI copy stays Brazilian Portuguese and keeps the current labels exactly: `Legal`, `Banida`, `Não encontrada`, `Só no deck`; groups `Criaturas`, `Planeswalkers`, `Batalhas`, `Mágicas instantâneas`, `Feitiços`, `Artefatos`, `Encantamentos`, `Terrenos`, `Outras`, `Não encontradas`.
- Banlist logic in `js/banlist.js` and parsing/validation in `js/app.js` (lines 1 to about 3750) do not change.
- Chrome binary for tests: `/c/Program Files/Google/Chrome/Application/chrome.exe`. Tests always pass their own `--user-data-dir`, so they never attach to the user's open Chrome.
- Commits end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **Double-faced cards with no top-level `type_line`** (only `card_faces[0].type_line`, e.g. `"Instant // Land"`) should be grouped by the front face, in `Mágicas instantâneas`. Pinned in Task 1.
2. **`"Land Creature — Forest Dryad"` (Dryad Arbor)** should go to `Criaturas`, and **`"Artifact Land"`** to `Terrenos`, not `Artefatos`. Pinned in Task 1.
3. **Validating a clean deck after the "Problemas" filter was active on an invalid one** should disable the filter and show all cards, not an empty panel. Pinned in Task 2.
4. **Private mode, or blocked storage, where `localStorage` throws** should fall back to list view and the system theme without errors. Pinned in Tasks 1 and 2.
5. **A card not found on Scryfall (`scryfall: null`)** should appear under `Não encontradas`, show its name as a placeholder in the grid, and open the viewer with no image. Pinned in Tasks 1 and 2.

---

### Task 1: Test runner and pure view model

**Files:**
- Create: `tests/run.sh`, `tests/harness.js`, `tests/deck-view.test.html`, `js/deck-view.js`
- Modify: `js/app.js` (remove `CARD_STATUS_META`, `getStatusMeta`, `isProblemCard`, `CARD_GROUPS`, `getCardGroup` at about lines 3781-3910), `index.html` (add the `js/deck-view.js` script tag)

**Interfaces:**
- Produces (globals in `js/deck-view.js`):
  - `CARD_STATUS_META`: same object as today, keyed by `banned | unknown | commanderOnly | legal`, each `{ label, className, order }`.
  - `getStatusMeta(status: string) -> { label, className, order }`, falling back to `unknown`.
  - `isProblemCard(card) -> boolean`, true for `banned` and `unknown`.
  - `CARD_GROUPS`: the ordered array of `{ id, label }` from today.
  - `getCardGroup(card) -> string` (one of the `CARD_GROUPS` ids).
  - `buildCardGroups(cards: Card[], filter: "all" | "problems") -> Array<{ id, label, copies: number, items: Array<{ card, index }> }>`. `index` is the card's position in `cards`. Items within a group are sorted by `getStatusMeta(status).order`. Empty groups are omitted. `copies` is the sum of `Number(card.quantity) || 1`.
  - `readStoredView(storage) -> "list" | "grid"`: returns `"grid"` only when `storage.getItem("dc_card_view") === "grid"`, and `"list"` when it throws.
- Produces (test infra):
  - `tests/harness.js` globals: `test(name: string, fn: () => void)`, `assertEqual(actual, expected, message?)` (compared with `JSON.stringify`), `done()`. Each test logs `TEST PASS <name>` or `TEST FAIL <name>: <message>`; `done()` logs `TESTS DONE passed=<n> failed=<n>`.
  - `sh tests/run.sh <test-page.html>` runs headless Chrome with `--virtual-time-budget=5000 --enable-logging=stderr --allow-file-access-from-files` and a temporary `--user-data-dir`. It prints the `TEST`/`TESTS DONE` lines and exits 1 if any line is `TEST FAIL` or if no `TESTS DONE` line appears.

- [ ] **Step 1: Create the feature branch and normalize line endings first**

The committed files are CRLF, the working tree is now LF or mixed, and `core.autocrlf=true` with no `.gitattributes`. Without this step the redesign diff reads as a full rewrite and blame breaks.

Run:
```bash
git checkout -b feat/apple-redesign
printf '* text=auto eol=lf\n' > .gitattributes
git stash push -- css/style.css index.html js/app.js
git add --renormalize . && git add .gitattributes
git commit -m "chore: normalize line endings to LF"
git stash pop
```
Expected: `git diff --stat HEAD~1 HEAD` touches only line endings and `.gitattributes`, and `git diff --stat` afterwards is about 3,500 insertions and 1,500 deletions, not 10,000.

- [ ] **Step 2: Write `tests/harness.js`, `tests/run.sh`, and the failing tests in `tests/deck-view.test.html`**

The page loads `../tests/harness.js` and `../js/deck-view.js`, then runs:

```js
const card = (status, type_line, extra = {}) =>
    ({ status, quantity: 1, inputName: "X", scryfall: type_line === null ? null : { name: "X", type_line }, ...extra });

test("status labels", () => {
    assertEqual(getStatusMeta("banned").label, "Banida");
    assertEqual(getStatusMeta("commanderOnly").label, "Só no deck");
    assertEqual(getStatusMeta("whatever").label, "Não encontrada");
});
test("problem cards are banned and unknown only", () => {
    assertEqual(["banned", "unknown", "commanderOnly", "legal"].map(s => isProblemCard({ status: s })), [true, true, false, false]);
});
test("dfc without top-level type_line groups by front face", () => {
    assertEqual(getCardGroup({ scryfall: { card_faces: [{ type_line: "Instant" }, { type_line: "Land" }] } }), "instant");
    assertEqual(getCardGroup(card("legal", "Instant // Land")), "instant");
});
test("dryad arbor is a creature, artifact land is a land", () => {
    assertEqual(getCardGroup(card("legal", "Land Creature — Forest Dryad")), "creature");
    assertEqual(getCardGroup(card("legal", "Artifact Land")), "land");
    assertEqual(getCardGroup(card("legal", "Artifact Creature — Golem")), "creature");
});
test("not found card goes to unknown group", () => {
    assertEqual(getCardGroup(card("unknown", null)), "unknown");
});
test("buildCardGroups orders groups, sorts by status, counts copies, keeps index", () => {
    const cards = [
        card("legal", "Island"), card("legal", "Basic Land — Island", { quantity: 3 }),
        card("banned", "Artifact"), card("legal", "Artifact"), card("unknown", null)
    ];
    const groups = buildCardGroups(cards, "all");
    assertEqual(groups.map(g => g.id), ["artifact", "land", "unknown"]);
    assertEqual(groups[0].items.map(i => i.index), [2, 3]);
    assertEqual(groups[1].copies, 4);
});
test("problems filter keeps only banned and unknown", () => {
    const cards = [card("legal", "Instant"), card("banned", "Instant"), card("commanderOnly", "Creature")];
    assertEqual(buildCardGroups(cards, "problems").map(g => g.items.map(i => i.index)), [[1]]);
});
test("non-numeric quantity counts as one copy", () => {
    assertEqual(buildCardGroups([card("legal", "Sorcery", { quantity: "?" })], "all")[0].copies, 1);
});
test("stored view: grid, default list, and throwing storage", () => {
    assertEqual(readStoredView({ getItem: () => "grid" }), "grid");
    assertEqual(readStoredView({ getItem: () => null }), "list");
    assertEqual(readStoredView({ getItem: () => { throw new Error("blocked"); } }), "list");
});
done();
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `sh tests/run.sh tests/deck-view.test.html`
Expected: exit 1, with `TEST FAIL` lines mentioning `getStatusMeta is not defined` (or no `TESTS DONE` line, because `js/deck-view.js` does not exist yet).

- [ ] **Step 4: Create `js/deck-view.js`**

Move `CARD_STATUS_META`, `getStatusMeta`, `isProblemCard`, `CARD_GROUPS` and `getCardGroup` out of `js/app.js` without changes, and add `buildCardGroups` and `readStoredView` with the signatures above. `buildCardGroups` takes the grouping/sorting/copy-count logic now inside `paintCards()` in `js/app.js`. In `js/app.js`:
- `paintCards()` calls `buildCardGroups(renderedCards, cardFilter)`.
- The `cardView` initializer calls `readStoredView(localStorage)`, wrapped in `try`, because accessing `localStorage` itself can throw.

Add `<script src="js/deck-view.js"></script>` between `banlist.js` and `app.js`.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `sh tests/run.sh tests/deck-view.test.html`
Expected: `TESTS DONE passed=9 failed=0`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add tests/ js/deck-view.js js/app.js index.html
git commit -m "test: add headless test runner and extract card view model"
```

---

### Task 2: Integration smoke test that pins the current UI

**Files:**
- Create: `tests/fixtures.js`, `tests/ui.test.html`

**Interfaces:**
- Consumes: `tests/harness.js` and `tests/run.sh` from Task 1; the globals `renderCards(cards)` and `renderResult(data)` in `js/app.js`.
- Produces: `tests/ui.test.html`, the regression gate for Task 3. It loads `../index.html` in a 1280x900 iframe and drives it through `iframe.contentWindow`, with no network. Before driving anything it sets `contentWindow.document.startViewTransition = undefined`, because headless virtual time never runs View Transition callbacks. It also defines a `fixtureCards` global in `tests/fixtures.js`: 6 cards covering `legal` Instant, `banned` Artifact (quantity 2), `commanderOnly` Creature, `legal` "Artifact Land", `unknown` with `scryfall: null` and `inputName: "Cartaquenaoexiste"`, and `legal` Basic Land. All have `scryfall.image_uris` set to `null` so no image is requested.

- [ ] **Step 1: Write the tests in `tests/ui.test.html`**

Each test starts with `win.renderResult({ structure: { total: 7 }, analyzed: fixtureCards, problems: [{ name: "Sol Ring", reason: "Banida", quantity: 2 }, { name: "Cartaquenaoexiste", reason: "Não encontrada", quantity: 1 }], commanderData: null, legalCount: 4, problemCount: 2 })` and then unhides `#resultSection`. Assertions:
- `page loads without errors`: no `error` event fired in the iframe.
- `cards are grouped by type`: the `.card-group-title` texts (take the first text node, trimmed, because the element also contains the copies `<span>`) equal `["Criaturas", "Mágicas instantâneas", "Artefatos", "Terrenos", "Não encontradas"]`, which is `CARD_GROUPS` order for this fixture.
- `view toggle switches list and grid`: clicking `[data-view="grid"]` gives `#cardsList` the `is-grid` class, and `[data-view="list"]` brings back `is-list`. `aria-pressed` follows.
- `problems filter shows only problems, then resets on clean deck`: after clicking `[data-filter="problems"]` there are 2 `.deck-card` elements. Calling `renderCards(fixtureCards.filter(c => c.status === "legal"))` makes `[data-filter="problems"]` `disabled`, gives `[data-filter="all"]` `aria-pressed="true"`, and leaves `.deck-card` count above 0.
- `unknown card shows placeholder and viewer opens without image`: in grid, the `.deck-card-placeholder` text is `Cartaquenaoexiste`; clicking that card opens `#cardViewer` (`open === true`) and `#cardViewerImage` has no `src` attribute; dispatching `cancel` on the dialog closes it.
- `theme toggle flips data-theme and persists`: clicking `#themeToggle` flips `documentElement.dataset.theme` and `localStorage.getItem("dc_theme")` equals the new value.
- `segmented thumb is measured once results are visible`: after unhiding `#resultSection`, call `win.positionThumbs()`. The production call lives in `validateDeck`, not `renderResult`, and the ResizeObserver doesn't fire under virtual time. Then `.segmented.has-thumb` count is 2 and `--thumb-w` is not empty.
- `toggles do not touch a live region`: `#resultSection` has no `aria-live`, and the only live region inside it is `#resultStatus` (`role="status"`). This way screen readers don't re-read the card list on each filter or view click.
- `verdict icon strokes are drawable`: every `path` in `#resultStatusIcon svg` has `pathLength="1"`, and the cross has 2 paths.

- [ ] **Step 2: Run against the current code and confirm it passes**

Run: `sh tests/run.sh tests/ui.test.html`
Expected: `TESTS DONE passed=9 failed=0`. This test pins existing behavior, so it must pass before Task 3. Any failure is a real bug: fix it in `js/app.js` in this task and say so in the commit message.

- [ ] **Step 3: Commit**

```bash
git add tests/fixtures.js tests/ui.test.html js/app.js
git commit -m "test: pin cards panel, viewer and theme behavior with a smoke test"
```

---

### Task 3: Move the UI layer out of app.js

**Files:**
- Create: `js/ui.js`
- Modify: `js/app.js` (remove the blocks from the `ÍCONES` header at about line 3757 through the end of `DATA DA BANLIST NO TOPO`, but keep `LOADING` and everything after it), `index.html` (add `<script src="js/ui.js"></script>` after `app.js`)

**Interfaces:**
- Consumes: Task 1 globals; from `js/app.js`, the element constants (`cardsList`, `cardTooltip`, `tooltipImage`, `commanderResult`), `escapeHtml` and `getCardImage`.
- Produces: the same globals as today, now defined in `js/ui.js`: `ICONS`, `renderCards`, `paintCards`, `renderCommanderResult`, `positionThumbs`, `syncCardControls`, `openCardViewer`, `closeCardViewer`, `hideTooltip`, `moveTooltip`, `attachCardHover`, `applyTheme`. `js/app.js` calls `renderCards`, `renderCommanderResult`, `positionThumbs`, `hideTooltip` and `ICONS` only at runtime (inside `renderResult` and `validateDeck`), so loading `ui.js` afterwards is safe.

- [ ] **Step 1: Move the code**

Cut the block listed above into `js/ui.js`, unchanged. Inside `js/ui.js`, top-level statements that query the DOM or add listeners (`syncCardControls()`, `attachCardHover()`, the theme setup, the scroll IIFE, the banlist date IIFE) keep their current order. `js/app.js` still ends with its init calls (`createCommanderDropdown()`, `updateLineCounter()`). Move the three `console.log` lines at the end of `app.js` to the end of `js/ui.js`, so the "carregado corretamente" message is printed only after everything has loaded.

- [ ] **Step 2: Run both test pages**

Run: `sh tests/run.sh tests/deck-view.test.html && sh tests/run.sh tests/ui.test.html`
Expected: `TESTS DONE passed=9 failed=0`, then `TESTS DONE passed=9 failed=0`.

- [ ] **Step 2b: Consolidate the CSS patch layers**

`css/style.css` has blocks that were appended as patches:
- a second `@media (max-width: 900px)` and a second `@media (max-width: 640px)` block near the end;
- `.commander-autocomplete` background set in three places;
- dark overrides that restate the glass value already set by the tokens (`:root[data-theme="dark"] .stats-strip, .tile`, `.problems-list`, `.cards-list.is-list .card-group-items`, `.globalfooter`).

Merge each media query into its original block, keep a single `.commander-autocomplete` background (the two theme-specific values), and delete overrides whose value equals the token's. Re-run both test pages; expected `failed=0` on both. Do this before Task 5, so DESIGN.md documents the consolidated file.

- [ ] **Step 3: Check the file sizes**

Run: `wc -l js/app.js js/ui.js js/deck-view.js`
Expected: `js/app.js` under 4,000 lines; together the three files hold roughly the original 5,864 lines.

- [ ] **Step 4: Commit**

```bash
git add js/ui.js js/app.js index.html
git commit -m "refactor: move cards view, viewer, theme and motion into js/ui.js"
```

---

### Task 4: Finish-review fixes (user-approved)

Already done before this plan started, after the code review of 2026-11-18. Do not redo these:
- the verdict icon got `pathLength`, and the cross was split into 2 paths;
- the ambient layer is static, with no drift animation;
- `aria-live` was moved to `#resultStatus`;
- the listbox/option roles were removed from the autocomplete;
- the theme `ready` promise got a `.catch`, and color transitions are off during the reveal;
- view transitions use a latest-only token;
- Esc handles a non-cancelable `cancel`;
- the backdrop closes only when the press started on it;
- the empty-state copy depends on the filter;
- the sticky threshold is read from CSS;
- the incomplete no-JS dark fallback was deleted.

Note for `describeProblems`: a banned commander produces its own commander problem, which lands in `outro problema`. That is intended, because the commander line in the problems panel names it.

These come from the impeccable finish review (disposition `fix`), with decisions the user made on 2026-11-18. Effects: "more restrained". Stats strip: "keep the strip, fix the count". Two findings are deliberately left alone: the line counter mismatch was caused by the capture harness setting `textarea.value` without an `input` event, and the "frame inside the viewer" is the card's own printed black border in the Scryfall image. The tests below still pin the line counter.

**Files:**
- Modify: `css/style.css` (ambient tokens and `.ambient span` rules, dark glow rules on `.result-status-icon` and grid `.deck-card` states, `.result-status-title` sizes, light `--glass`), `index.html` (`.ambient` keeps one `<span>`; filter button label), `js/deck-view.js` (new `describeProblems`), `js/app.js` (`renderResult`: problem count and verdict lines), `tests/deck-view.test.html`, `tests/ui.test.html`

**Interfaces:**
- Consumes: `isProblemCard` and `getStatusMeta` from Task 1; `renderResult` in `js/app.js`.
- Produces: `describeProblems(analyzed: Card[], problems: Problem[]) -> string` in `js/deck-view.js`. It counts:
  - `banned` = analyzed cards with status `banned`;
  - `unknown` = analyzed cards with status `unknown`;
  - `other` = `max(0, problems.length - banned - unknown)`.

  It writes each non-zero count with Portuguese singular/plural (`1 carta banida` / `N cartas banidas`, `1 não encontrada` / `N não encontradas`, `1 outro problema` / `N outros problemas`), joined with `", "` and `" e "` before the last item, ending in `"."`. With `problems.length === 0` it returns `"Nenhum problema encontrado."`

- [ ] **Step 1: Write the failing tests**

In `tests/deck-view.test.html`:

```js
const st = s => ({ status: s });
test("describeProblems: mixed", () => {
    assertEqual(describeProblems([st("banned"), st("banned"), st("banned"), st("unknown"), st("legal")], new Array(5).fill({})),
        "3 cartas banidas, 1 não encontrada e 1 outro problema.");
});
test("describeProblems: single kind, singular", () => {
    assertEqual(describeProblems([st("banned"), st("legal")], [{}]), "1 carta banida.");
});
test("describeProblems: none", () => {
    assertEqual(describeProblems([st("legal")], []), "Nenhum problema encontrado.");
});
```

In `tests/ui.test.html` (fixture problems have 2 entries):
- `problem stat matches the problem list`: `#problemCards` text equals the number of `.problem-item` elements (`"2"`).
- `filter label names its unit`: `[data-filter="problems"]` text starts with `"Com problema"`.
- `verdict has one specific line`: `#resultStatusTitle` text equals `describeProblems(fixtureCards, problems)`, and `#resultStatusDescription` is empty.
- `example button updates the line counter`: after clicking `#exampleButton`, `#lineCounter` text equals `"10 linhas"`.
- `dark theme has no colored glow on banned cards`: with `data-theme="dark"` and grid view, the computed `box-shadow` of `.deck-card.is-banned .deck-card-art` contains no `rgba(255, 69, 58, 0.4)`.
- `ambient has a single light`: `.ambient span` count is 1.

- [ ] **Step 2: Run the tests and confirm the new ones fail**

Run: `sh tests/run.sh tests/deck-view.test.html; sh tests/run.sh tests/ui.test.html`
Expected: `TEST FAIL` on the 3 `describeProblems` tests and on the ui tests above, except `example button updates the line counter`, which already passes.

- [ ] **Step 3: Implement**

- **Ambient light.** Remove `--ambient-b`, `--ambient-c`, their `.ambient span:nth-child(2)` / `(3)` rules, and two of the three `<span>`s in `index.html`.
  - Light: `--ambient-a: rgba(0, 113, 227, 0.08)`, `--ambient-base: #f5f5f7`, `--glass: rgba(255, 255, 255, 0.72)`.
  - Dark: `--ambient-a: rgba(10, 132, 255, 0.16)`, `--ambient-base: #000000`.
- **Glows.** Delete the two dark `.result-status-icon` box-shadow rules. Dark grid states become:
  - `.is-banned`: `0 0 0 2px var(--red), var(--shadow-card)`;
  - `.is-commander-banned`: `0 0 0 2px var(--orange), var(--shadow-card)`;
  - `.is-banned:hover`: `0 0 0 2px var(--red), 0 18px 50px rgba(0, 0, 0, 0.7)`.
- **Verdict.** `.result-status-title` uses `80px` on desktop, `56px` at `max-width: 900px` and `40px` at `max-width: 640px`. In `renderResult`:
  - `resultStatusTitle.textContent = describeProblems(analyzed, problems)`;
  - `resultStatusDescription.textContent = ""`.

  Add `.result-status-description:empty { display: none; }`.
- **Counts.** `problemCards.textContent = problems.length`. In `index.html`, the filter button text becomes `Com problema <span id="filterProblemCount" class="segmented-count"></span>`.

- [ ] **Step 4: Run both test pages**

Run: `sh tests/run.sh tests/deck-view.test.html && sh tests/run.sh tests/ui.test.html`
Expected: both `failed=0`.

- [ ] **Step 5: Look at the result in both themes**

Run the headless capture from the session's scratch harness, or open `index.html` in Chrome and validate the "Usar exemplo" list with `1 Black Lotus` added.
Expected:
- the light ground reads neutral `#f5f5f7` with white frosted tiles;
- the dark ground reads black, with a faint blue light behind the glass;
- banned cards show a red ring and no red bloom;
- the verdict is as large as the hero headline.

- [ ] **Step 6: Commit**

```bash
git add css/style.css index.html js/deck-view.js js/app.js tests/
git commit -m "fix: apply finish-review fixes (restrained ambient, consistent problem counts, verdict summary)"
```

---

### Task 5: DESIGN.md and branch wrap-up

**Files:**
- Create: `DESIGN.md`, `.impeccable/design.json` (with the impeccable `document` flow)
- Modify: `README.md` (one "Desenvolvimento" section with the test command)

**Interfaces:**
- Consumes: the finished CSS tokens in `css/style.css`, the direction contract in `.impeccable/surfaces/index-html.md`, and `PRODUCT.md`.

- [ ] **Step 1: Generate the design system**

Run `/impeccable document` on `index.html`. It should record:
- the light and dark tokens: `--bg`, `--glass*`, `--ambient-*`, `--accent`, the semantic green/red/orange, and the text levels including `--text-display-muted`;
- the components: glass tile, pill button, segmented control with thumb, card status badge, grid card, viewer dialog;
- the motion rules: theme circular reveal at 650 ms, `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`, View Transition names `deck-cards`, `cards-toolbar` and `card-zoom`, and the reduced-motion behavior.

Expected: `DESIGN.md` and `.impeccable/design.json` exist and name those tokens.

- [ ] **Step 2: Add the test command to `README.md`**

One section titled `## Desenvolvimento` saying that tests run with `sh tests/run.sh tests/deck-view.test.html` and `sh tests/run.sh tests/ui.test.html`, and that they need Chrome installed.

- [ ] **Step 3: Run the full test suite one last time**

Run: `sh tests/run.sh tests/deck-view.test.html && sh tests/run.sh tests/ui.test.html`
Expected: both `failed=0`.

- [ ] **Step 4: Commit the design work and docs**

```bash
git add DESIGN.md .impeccable/ PRODUCT.md README.md css/style.css index.html docs/
git commit -m "docs: record Apple-style design system, product context and test instructions"
```

Expected: `git status --short` is empty, and `git log --oneline main..` shows 5 commits.
