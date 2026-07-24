# Repository-local AGENTS.md for 3d_r_cube
Applies only to this repository.
Last reviewed: 2026-07-24

## 1. Scope

Ez a local `AGENTS.md` csak erre a repora ervenyes:

- `<CODEX_WORKS>\3d_r_cube`

Az elsodleges kozos szabalyokat a szulo `<CODEX_WORKS>\AGENTS.md` adja. Ez a fajl a `email-header-analyzer` es az `E-SPER` repo bevalt szabalyait egyseges, 3d_r_cube-re szabott parancslistava es helyi munkamodella alakitja.

## 2. Repository Role

Ezt a repot kezeld ugy, mint:

- 3D Rubik-kocka / cube-alapu webes kiserleti alkalmazas repoja
- statikus frontend es kesobbi renderelt UI/interaction munka forrashelye
- publicra elokeszitheto, csak szintetikus peldakat tartalmazo fejlesztoi repo

Mas repo csak referencia lehet. Ha az `email-header-analyzer` vagy az `E-SPER` viselkedesi, dokumentacios vagy workflow mintaja kell, elobb olvasd a forrasrepo aktualis fajljait, de ne modositsd oket kulon explicit keres nelkul.

## 3. Unified Command Model

A `3d_r_cube` egy gyokerbol vezerelt repo. Az E-SPER `dev_store/`-os szetvalasztasat itt nem kell hasznalni.

Kotelezo munkakonyvtar:

- minden Git, npm, script, inventory es dokumentacios parancs munkakonyvtara: `<CODEX_WORKS>\3d_r_cube`
- parancsinditas elott ellenorizd, hogy itt letezik a `package.json`
- PowerShellben ne hasznalj `&&` lancolast kezi parancskent; futtasd kulon a parancsokat vagy hasznald az npm scriptet

Egységes parancslista:

```powershell
git status --short --branch
npm.cmd run check:encoding
npm.cmd run check:inventory
npm.cmd run check
git diff --check
ggshield secret scan repo .
```

Inventory frissites uj, atnevezett vagy athelyezett fajl utan:

```powershell
npm.cmd run inventory:write
npm.cmd run check:inventory
```

Ha kesobb build/test/lint/typecheck kerul a repoba, ezek a gyoker `package.json` scriptjeibe keruljenek, es a `npm.cmd run check` fogja oket ossze.

## 4. Required Workflow Skills

- session- es repoinditas: `$windows-mcp-startup-hygiene`, majd `$workspace-repo-startup`
- tobb-repos referencia vagy shared worklog: `$workspace-cross-repo-coordination`
- UI-valtozas renderelt ellenorzese: `$rendered-frontend-qa`
- uj/mozgatott fajl vagy inventory erintettseg: `$workspace-package-inventory-sync`
- erdemi task zarasa: `$workspace-task-closeout`

## 5. Project Memory

Kotelezo projektmemoria:

- `STATE.md`
- `docs/CHANGELOG.dev.md`
- `docs/codex-tasks/plans/pending/active/`

Minden erdemi valtozas, sikertelen probalkozas, validacio vagy dontes utan tartsd oket szinkronban. Taskzaraskor appendelj rovid magyar changelog bejegyzest.

## 6. Documentation And Task Structure

Aktiv tervek:

- `docs/codex-tasks/plans/pending/active/`

Meg nem kezdett tervek:

- `docs/codex-tasks/plans/pending/not-started/`

Referenciaanyag:

- `docs/codex-tasks/plans/pending/reference/`

Lezart tervek:

- `docs/codex-tasks/plans/done/`

Aktiv terv elejen legyen statuszblokk:

- `Allapot`
- `Kapcsolodo jelenlegi helyzet`
- `Elkeszult reszek`
- `Nyitott reszek`

## 7. File Inventory And Packaging Discipline

Kotelezo teljes fajllista:

- `repo-file-inventory.json`

Kotelezo script:

- `scripts/check-inventory.mjs`

Uj fajl, atnevezes, athelyezes vagy szerepvaltas utan:

1. `npm.cmd run inventory:write`
2. `npm.cmd run check:inventory`
3. `npm.cmd run check`

Egy feladat addig nem kesz, amig az inventory-check ujra nem zold.

## 8. Security And Data Safety

Soha ne commitolj:

- `.env`
- token, secret, jelszo vagy shared secret
- valo felhasznaloi adat
- lokalis runtime state
- lokalis log, cache, build output vagy export
- gepfuggo privat utvonal vagy azonositok

Tracked pelda csak szintetikus lehet. Publicra kerules elott fusson:

```powershell
ggshield secret scan repo .
```

Ha a teljes scan technikai okbol nem fut vegig, rogzitsd a hibat a changelogban, es futtass celzott scan-t a szulo workspace szabalyai szerint.

## 9. UI And Runtime Rules

Renderelt frontend valtozasnal kell valodi browser QA. Ha a repo 3D jelenetet kap:

- hasznalj stabil, ismert 3D/runtime libraryt, peldaul Three.js-t
- a 3D scene legyen tenylegesen renderelt es interaktiv
- desktop es mobil viewporton is ellenorizd, hogy nem blank, nem rosszul keretezett, es a UI nem fed ossze ertelmetlenul

## 10. Encoding And Line Endings

Default:

- UTF-8
- LF source/docs fajlokhoz
- CRLF csak Windows shell fajloknal, ha indokolt

Kapcsolodo fajlok:

- `.editorconfig`
- `.gitattributes`
- `scripts/check-encoding.mjs`

## 11. Versioning Policy

Indulo verzio:

- `0.1.00000`

Formatum:

- `major.minor.patch5`

Bump csak valodi runtime, UI, build, package, workflow vagy security-script valtozasnal kell. Docs-only vagy plan-only valtozasnal nincs bump, hacsak kesobb helyi szabaly maskepp nem mondja.

## 12. Commit Policy

Commit uzenet prefixek:

- `feat:`
- `fix:`
- `docs:`
- `chore:`
- `test:`
- `refactor:`

Ne commitolj vagy pusholj explicit user keres nelkul.

## 13. Rollback Policy

Utolso stabil visszaallasi pont:

- az utolso zold `npm.cmd run check`
- az utolso zold inventory allapot
- az utolso stabil commit, ha mar van commit

Automatikusan nem szabad hozzanyulni:

- mas repo munkafajahoz
- lokalis runtime/output/cache allapothoz
- felhasznaloi adatot tartalmazo mappahoz

## 14. What Not To Do

- Ne gyengitsd a szulo `AGENTS.md` szabalyait.
- Ne masold be vakon az `email-header-analyzer` vagy `E-SPER` teljes szabalyzatot.
- Ne kezeld az `email-header-analyzer` repot fejlesztesi celkent.
- Ne hozz letre `dev_store/` splitet, amig erre nincs projektbeli ok.
- Ne hagyj uj fajlt inventory frissites nelkul.
