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
- A GitHub Actions `check` workflow-nak tiszta runneren `npm.cmd ci` utan kell futtatnia a root `npm.cmd run check` parancsot; az action wrapper verziok Node 24 runtime-kompatibilis `actions/checkout@v7` es `actions/setup-node@v7`.

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
- Eredmeny: zold; unit teszt, typecheck, build, encoding check, inventory check es `git diff --check` lefutott. Vite build figyelmeztet: a Three.js miatt az elso bundle 500 kB folotti. A 2026-07-24 esti E-SPER hatter/zene szeletnel a lokalis es Android smoke teszt szerint a zene megszolalt; Apple Chrome/iPad WebKit alatt a YouTube hatter/embed megoldas nem adott jo appon beluli elmenyt, ezert Apple eszkozokon a HUD zene gomb le van tiltva. Stabil Apple zenehez sajat hostolt audiofajl kell. A matricak merete `0.68`-rol `0.81`-re nott a `0.94` panelmerethez kepest, igy a fekete racsperem kb. fele olyan vastag.
- Legutobbi CI javitas: a GitHub Actions `check` workflow Node 24-kompatibilis hivatalos action verziokra valtott, es a tiszta runnerhez bekerult a `npm.cmd ci` telepitesi lepes.
- Maradek kockazat: Chrome DevTools MCP profilzar miatt friss MCP-s screenshot nem keszult. A lokalis WebGL warning javitasa utan erdemes a Vite dev tabot teljesen frissiteni.

## Kovetkezo lepes

- Kovetkezo nagyobb szelet: magyar oktatasi mod kockajelolesekkel es lepesenkenti 3D kiemelessel, de a publikus UI-ban ezt egyelore nem kell kulon hirdetni.

## Operativ megjegyzesek

- Secret, token, szemelyes adat ne keruljon ide.
