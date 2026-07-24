# 3d_r_cube State

## Pillanatnyi allapot

- Datum: 2026-07-24
- Repo: `3d_r_cube`
- Fazis: elso jatszhato verzio
- Altalanos allapot: Vite + React + TypeScript + Three.js alapu R-CUBE 3D logikai kocka jatek elkeszult, `/3d_r_cube/` aloldalas statikus deploy beallitassal, dev WebGL context takaritassal, publikus debug hook nelkul, perzisztens nappali/ejszakai modvalasztoval, E-SPER rootbol atvett hatterlatvannyal, HUD-rol kapcsolhato hatterzenevel, generic nevhasznalattal, egyszerusitett jeloles-sugoval es sajat move tooltippel

## Nyitott helyzetek

- Kesobbi oktatasi mod meg nincs megvalositva, csak elokeszitett UI/dokumentacios irany.
- GitHub remote beallitva: `origin/main`; commit es push csak kulon user keresre tortenjen.
- E-SPER statikus deploy cel: `https://e-sper.hu/3d_r_cube/`; a `dist/` tartalom toltheto fel.
- A tanulo mod oktatasi funkcio tovabbra is jovobeli fejlesztes, de a jatekfeluletrol lekerult a kulon "kovetkezik" bejelentes.
- A GitHub Actions `check` workflow-nak tiszta runneren `npm.cmd ci` utan kell futtatnia a root `npm.cmd run check` parancsot; az action wrapper verziok Node 24 runtime-kompatibilis `actions/checkout@v7` es `actions/setup-node@v7`, az inventory pedig nem merhet lokalis/CI runtime `test-results/` fajlokat.
- Touch/telefon nezetben a betus move-pad es irany/2x gombok rejtve vannak; a kocka erintes-huzas a fo forgatasi mod.
- A hang, hatterzene, forgatasi irany, 2x es move gombok mind sajat, egermutato fele pozicionalt tooltipet hasznalnak, nativ `title` buborek nelkul.
- A sajat tooltip felul es oldalt viewport-biztos: ha nincs hely az egermutato felett, ala fordul, es vizszintesen bent marad a kepernyon.
- A hatterzene Apple/WebKit tiltasa kikerult; a YouTube lejatszas az E-SPER root oldal mintajahoz kozelit: rejtett `YT.Player`, `setVolume(25)`, majd kozvetlen `playVideo()` / `pauseVideo()` a HUD gombbol.
- A kocka effekt hanghoz tartos `AudioContext` tartozik; az elso pointer vagy billentyu interakcio kozvetlenul feloldja, nema prime hanggal is megmozgatja, hogy Chrome iOS alatt ne a kesleltetett forgatasanimacio probalja eloszor letrehozni.
- A hatterzene gomb haromallapotu logikat hasznal: kikapcsolt, inditas alatt, tenylegesen jatszik. Inditas alatt az ujabb koppintas nem kapcsolja ki, hanem ujra probalja a YouTube `playVideo()` hivast, amig a player `PLAYING` allapotot nem jelez.
- A hatterzene inditas mobilon idozitett ujraprobalkozasokat kapott; ha a YouTube state event elmarad, `getPlayerState()` poll is ellenorzi a tenyleges `PLAYING` allapotot. Ha kb. 32 masodpercig nincs indulas, a gomb visszaesik kikapcsolt allapotba, hogy Chrome-ban ne ragadjon be.

## Legutobbi fontos dontesek

- Döntés: a repo gyokerbol vezerelt Node/script modellt kap.
  - Mi szuletett? Nincs E-SPER-szeru `dev_store/` split.
  - Miert? A projekt indulofazisban kicsi, igy a gyoker parancslista egyszerubb es ellenorizhetobb.
  - Kovetkezmeny: minden `npm.cmd` es inventory parancs a repo gyokerebol fut.
- Döntés: az elso jatek Vite + React + TypeScript + Three.js stacken keszul.
  - Mi szuletett? Belso kocka move engine, renderelt 3D scene, move-pad, keyboard, mouse-drag, scramble, undo, timer es sugo.
  - Miert? A Vite/React gyors statikus webapp alapot ad, a Three.js stabil 3D render/picking es kamera kontrollt.
  - Kovetkezmeny: nincs backend, nincs adatbazis, statikus hosting kesobb egyszeru.

## Legutobbi validacio

- Futtatott parancsok:
  - `git init`
  - `npm.cmd run inventory:write`
  - `npm.cmd run test`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run check`
- Eredmeny: zold; unit teszt, typecheck, build, encoding check, inventory check es `git diff --check` lefutott. Vite build figyelmeztet: a Three.js miatt az elso bundle 500 kB folotti. A 2026-07-24 esti E-SPER hatter/zene szeletnel a lokalis es Android smoke teszt szerint a zene megszolalt; iPad root-oldali forrasvizsgalat utan az Apple-specifikus kockaoldali tiltast eltavolitottuk, es a kocka YouTube player logikajat kozelitettuk a mukodo root HTML-hez. A matricak merete `0.68`-rol `0.81`-re nott a `0.94` panelmerethez kepest, igy a fekete racsperem kb. fele olyan vastag.
- Legutobbi CI javitas: a GitHub Actions `check` workflow Node 24-kompatibilis hivatalos action verziokra valtott, a tiszta runnerhez bekerult a `npm.cmd ci` telepitesi lepes, es az inventory kizárja a Vitest runtime `test-results/` mappat.
- Legutobbi UI javitas: touch/coarse pointer eszkozokon a betus vezerlo gombok nem renderelodnek, es a sugo rovidebb erintos hasznalati lepessorra valt.
- Tooltip javitas: az ikon es modvalaszto gombok is az egyseges lebego tooltip komponensre valtottak, a gyari browser buborekok helyett.
- Tooltip pozicio javitas: a felso HUD gomboknal a tooltip nem csuszik a bongeszokeret ala, hanem az egermutato alatt jelenik meg.
- Zene javitas: a korabbi Apple/WebKit gombtiltas kikerult, az `unMute`, `playsinline`, `enablejsapi` es `origin` extra player opciok eltavolitva, a player kontener ujra 0x0 rejtett root-mintara valtott.
- Chrome iOS hang javitas: a kockahang `AudioContext` mar user gesture alatt oldodik fel, nem a 260 ms-os move timeout utan; a feloldas nema oscillator prime-ot is indit.
- Chrome iOS zene javitas: a gomb allapota mar nem keveri ossze a kert inditast es a tenyleges lejatszast; `PLAYING` YouTube state nelkul a gomb inditas alatt marad, es az ujabb koppintas ujraprobal, nem kikapcsol.
- Mobil zene beragadas javitas: a `PLAYING` event mellett kesleltetett `getPlayerState()` poll is fut, es az inditasi retry sorozat 32 masodperc utan biztonsagosan visszaallitja a gombot `off` allapotba.
- Chrome iOS kockahang stabilizalas: a nema prime oscillator csak sikeres `AudioContext.resume()` utan indul, es a konkret kockamozdulat inditasakor is tortenik audio unlock probalkozas.
- Maradek kockazat: Chrome DevTools MCP profilzar miatt friss MCP-s screenshot nem keszult. A lokalis WebGL warning javitasa utan erdemes a Vite dev tabot teljesen frissiteni.

## Kovetkezo lepes

- Kovetkezo nagyobb szelet: magyar oktatasi mod kockajelolesekkel es lepesenkenti 3D kiemelessel, de a publikus UI-ban ezt egyelore nem kell kulon hirdetni.

## Operativ megjegyzesek

- Secret, token, szemelyes adat ne keruljon ide.
