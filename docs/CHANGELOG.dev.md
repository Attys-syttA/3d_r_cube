# 3d_r_cube Development Changelog

## 2026-07-24 - Baseline bootstrap

- Cel: uj `3d_r_cube` projektmappa es repo baseline letrehozasa.
- Modositott teruletek: repo policy, state, docs/task szerkezet, validation scripts, inventory, GitHub Actions baseline.
- Futtatott parancsok: `git init`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; encoding check, inventory check es `git diff --check` lefutott.
- Follow-up: 3D runtime es elso renderelt UI szelet megtervezese.

## 2026-07-24 - Elso jatszhato 3D logikai kocka

- Cel: a hibas orchestrator-terv javitasa es egy mukodo, elvezheto 3D logikai kocka jatek elkeszitese.
- Modositott teruletek: Vite/React/TypeScript stack, Three.js scene, kocka move engine, move-pad, keyboard, mouse-drag, scramble, undo, timer, sugo, README, STATE, task plan, inventory.
- Futtatott parancsok: `npm.cmd install`, `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold validacio; Chrome DevTools render QA desktop es mobil viewporton, konzolhiba nelkul.
- Follow-up: oktatasi mod megtervezese es megvalositasa kezdoknek.

## 2026-07-24 - Kezelopanel sugo es forgatasmod pontositas

- Cel: egyertelmuve tenni, hogy a forgatasmod UI gombok mit csinalnak.
- Modositott teruletek: `App.tsx`, `README.md`, changelog, inventory.
- Futtatott parancsok: `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a `↻`/`↺` iranyvalaszto es a kulon `2x` kapcsolo egyertelmubben jelzi a move-pad mukodeset.
- Follow-up: nincs.

## 2026-07-24 - Egeres forgatas 3D preview nyillal

- Cel: huzas kozben lathato legyen, melyik iranyba fog fordulni a kivalasztott reteg.
- Modositott teruletek: `CubeScene.tsx`, `README.md`, verzio, changelog, inventory.
- Futtatott parancsok: `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a 3D preview nyil csak huzas kozben jelenik meg, pointer release/cancel utan eltunik, es sticker-drag alatt nem mozgatja kozben a kamerat.
- Follow-up: kesobb a teljes reteg finomabb vizualis kiemelese is jo UX bovites lehet.

## 2026-07-24 - Kozepso szeletmozdulatok es drag javitas

- Cel: javitani, hogy egerrel a kozepso sor/oszlop ne kulso lapot forgasson, es a kozepso tengelyek UI-bol is kezelhetok legyenek.
- Modositott teruletek: move engine, Three.js drag mapping es preview nyil, move-pad, keyboard, README, verzio, tesztek.
- Futtatott parancsok: `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a move engine kezeli az `M/E/S` kozepso szeleteket, a move-pad es a keyboard is eleri oket, a drag mapping nem esik vissza kulso lapra kozepso sor/oszlop eseten.
- Follow-up: Chrome DevTools MCP profilzar miatt renderelt screenshot nem keszult; felhasznaloi probaval erdemes visszanezni az egeres iranyerzetet.

## 2026-07-24 - Lathato drag celpontok szukitese

- Cel: megakadalyozni, hogy ket lathato elem kozotti resen at hatso, monitoron nem lathato matrica legyen megragadhato.
- Modositott teruletek: `CubeScene.tsx`, README, verzio, inventory.
- Futtatott parancsok: `npm.cmd run test`, `npm.cmd run typecheck`, `node .cache\cdp-decision-scan.mjs`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a drag csak kamera fele nezo, lathato sticker/hit-plane talalatbol indul, a fekete kockatest pedig blokkolja a hatso matricakra atmeno raycastet.
- Follow-up: nincs.

## 2026-07-24 - E-SPER statikus aloldal deploy beallitas

- Cel: a jatek biztonsagos statikus feltoltesenek elokeszitese a `https://e-sper.hu/3d_r_cube/` alutvonalra.
- Modositott teruletek: Vite base path, `public/.htaccess`, README deploy leiras, STATE, verzio, inventory.
- Futtatott parancsok: `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a `dist/index.html` `/3d_r_cube/` alapu asset URL-eket hasznal, a `dist/.htaccess` bekerul a feltoltendo csomagba, a deploy fajllista csak `.htaccess`, `index.html`, `favicon.svg` es ket asset.
- Follow-up: feltoltes utan Rackhost oldali smoke teszt: aloldal betolt, `assets/` nem listaz, `.htaccess` nem olvashato.

## 2026-07-24 - Publikus tengely-jelmagyarazat eltavolitasa

- Cel: eltavolitani a fejlesztoi `+x/-x/+y/-y/+z/-z` szin/tengely jelmagyarazatot a jatekfeluletrol.
- Modositott teruletek: `CubeScene.tsx`, `main.css`, verzio, inventory.
- Futtatott parancsok: `npm.cmd run test`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: zold; a publikus UI-bol eltunt a tengely/szin debug jelmagyarazat, a deploy build uj asset hash-ekkel frissult.
- Follow-up: nincs.

## 2026-07-24 - Lokalis WebGL context takaritas

- Cel: megszuntetni, hogy Vite/React dev modban a kocka minden allapotvaltasnal uj WebGL renderert epitve context warningot okozhasson.
- Modositott teruletek: `CubeScene.tsx`, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a Three.js scene egyszer inicializalodik, a render loop refbol olvassa az aktualis kockat, a regi geometriak/materialok es unmountkor a WebGL context explicit felszabadulnak.
- Follow-up: a lokalis dev tabon erdemes `Ctrl+F5` frissitest nyomni; Chrome DevTools MCP profilzar miatt friss screenshot nem keszult.

## 2026-07-24 - Publikus debug hook eltavolitasa

- Cel: eltavolitani a deploy bundle-bol a drag teszteleshez hasznalt `window.__cubeDebugDrag` / `__cubeDragDebug` belso debug nyomokat.
- Modositott teruletek: `CubeScene.tsx`, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `rg "__cubeDebugDrag|__cubeDragDebug|setDragDebug" src dist`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a pointeres forgatas valtozatlan marad, de a publikus bundle nem tartalmaz fejlesztoi window debug hookot.
- Follow-up: nincs.

## 2026-07-24 - Ejszakai modvalaszto

- Cel: nappali/ejszakai megjelenesi mod valaszthato legyen a kezelopanelrol.
- Modositott teruletek: `App.tsx`, `CubeScene.tsx`, `main.css`, README, STATE, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a HUD kap egy ketgombos megjelenesi mod valasztot, a Three.js hatterszin es a kezelopanel szinei a valasztott modhoz igazodnak.
- Follow-up: az E-SPER root hatter/zene kulon kovetkezo szelet legyen, mert a root oldal YouTube playeres dinamikaja es a kocka pointer/audio kezelese szetvalasztast igenyel. Chrome DevTools MCP profilzar miatt friss screenshot nem keszult.

## 2026-07-24 - R-CUBE nevhasznalat tisztitas

- Cel: a publikus jatek es aktiv dokumentacio sajat `R-CUBE` nevet hasznaljon, es ne epitsen harmadik fel markanevere.
- Modositott teruletek: `App.tsx`, README, STATE, changelog, tervfajl, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, brandnev-maradvany keresese `src`, doksik es `dist` alatt, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a UI cim `R-CUBE`, a szovegek generic 3D logikai kocka/kockajeloles megnevezest hasznalnak.
- Follow-up: nincs.

## 2026-07-24 - Jeloles sugo es move tooltip

- Cel: a `U D L R F B M E S` gombokrol es billentyukrol deruljon ki, melyik oldalhoz vagy kozepso szelethez tartoznak.
- Modositott teruletek: `App.tsx`, README, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a sugo kulon jeloles lapot kap, a move-pad gombok pedig tooltipben es aria-labelben is leirjak a mozgato reteg jelentest.
- Follow-up: nincs.

## 2026-07-24 - Jeloles szoveg egyszerusites

- Cel: a sugo es tooltip ne magyarazza tul a kulso retegeket; az oldalaknal rovid oldalnev, a kozepso mozgasoknal X/Y/Z tengely szoveg jelenjen meg.
- Modositott teruletek: `App.tsx`, README, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: az oldalgombok rovid oldalnevvel, az `M/E/S` gombok kozepso X/Y/Z tengely szoveggel jelennek meg.
- Follow-up: nincs.

## 2026-07-24 - Tema perzisztencia es sajat tooltip

- Cel: az ejszakai/nappali mod frissites utan is megmaradjon, es a move tooltip ne az egermutato alatt jelenjen meg.
- Modositott teruletek: `App.tsx`, `main.css`, README, STATE, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`.
- Eredmeny: a tema `localStorage`-ban tarolodik `day/night` ertekkel, a move gombok nativ `title` helyett sajat, egermutato fele pozicionalt tooltipet hasznalnak.
- Follow-up: nincs.

## 2026-07-24 - E-SPER hatter es HUD zene kapcsolo

- Cel: az E-SPER root oldal kepes/animalt hattere jelenjen meg a kocka mogott, a zene pedig a kezelopanelrol legyen kapcsolhato.
- Modositott teruletek: `AmbientBackdrop.tsx`, `App.tsx`, `CubeScene.tsx`, `main.css`, `public/.htaccess`, `public/assets/esperindex.png`, README, STATE, verzio, inventory.
- Futtatott parancsok: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run inventory:write`, `npm.cmd run check`, `git diff --check`.
- Eredmeny: a kocka canvas atlatszo hatterrel renderel, az E-SPER kep/particle hatter `pointer-events: none` retegen fut mogotte, a YouTube hatterzene csak bekapcsolt HUD gombnal toltodik iframe-ben. A tanulo mod bejelento panel es a sugo jovobeli tanulo mod mondata lekerult a UI-bol.
- Follow-up: feltoltes utan aloldalas smoke teszt; a helyi zene mukodeset felhasznaloi proba mar igazolta.

## 2026-07-24 - Eles zene iframe meret es CSP pontositas

- Cel: javitani, hogy a HUD zene kapcsolo ne csak lokalis proban, hanem az eles `/3d_r_cube/` aloldalon is megbizhatoan inditsa a YouTube embedet.
- Modositott teruletek: `main.css`, `public/.htaccess`, README, STATE, verzio, inventory.
- Eredmeny: a rejtett YouTube iframe technikai merete 200x200 lett az 1x1 helyett, a CSP `frame-src` engedelye pedig a `youtube-nocookie.com` mellett a `youtube.com` embed hostot is engedi. A mappamelyseg nem ok, mert a zene URL abszolut HTTPS URL.
- Follow-up: uj `dist/` feltoltes utan eles zene smoke teszt.

## 2026-07-24 - YouTube API-s zenevezerles eles paritas

- Cel: a kocka zenevezerlese kozelebb keruljon az E-SPER root oldalon mar mukodo YouTube iframe API-s mintahoz.
- Modositott teruletek: `AmbientBackdrop.tsx`, `public/.htaccess`, README, STATE, verzio, inventory.
- Eredmeny: az iframe autoplay-only megoldas helyett a komponens a `https://www.youtube.com/iframe_api` scriptet tolti be, `YT.Player` peldanyt hoz letre, es a HUD gombnyomas utan `playVideo()` / `pauseVideo()` hivassal vezerel. A CSP `script-src` szuken engedi a YouTube API scriptet.
- Follow-up: uj `dist/` feltoltes utan eles zene smoke teszt.

## 2026-07-24 - Mobil Chrome/iOS zeneinditas javitas

- Cel: Apple telefonon Chrome alatt is jobb esellyel induljon a hatterzene.
- Modositott teruletek: `AmbientBackdrop.tsx`, `App.tsx`, README, STATE, verzio, inventory.
- Eredmeny: a YouTube player az app indulasakor elokeszul, a HUD zene gomb pedig refen keresztul kozvetlenul a koppintas esemenyben hivja a `playVideo()` / `pauseVideo()` muveletet. Ha a player meg nem kesz, a gomb nem mutat hamis bekapcsolt allapotot.
- Follow-up: iPhone Chrome eles smoke teszt; szukseg eseten masodik koppintas UX jelzes finomitasa.

## 2026-07-24 - Apple tablet zene kompatibilitasi probakor

- Cel: iPad/Apple WebKit alatt is jobb esellyel induljon a YouTube hatterzene.
- Modositott teruletek: `AmbientBackdrop.tsx`, `main.css`, README, STATE, verzio, inventory.
- Eredmeny: a player `playsinline`, `enablejsapi`, `origin`, `unMute` es explicit volume beallitasokat kapott; a technikai YouTube kontener nem teljesen offscreen/opacity-null, hanem minimalisan viewporton beluli, hogy az Apple mediapolicy ne rejtett mediakent kezelje.
- Follow-up: iPad Chrome eles smoke teszt. Ha tovabbra sem indul, stabil megoldaskent lathato YouTube player indito vagy sajat hostolt audio kell.

## 2026-07-24 - Apple WebKit zene fallback

- Cel: Androidon mukodo hatterzene megtartasa mellett Apple eszkozokon se legyen nema, felrevezeto zene gomb.
- Modositott teruletek: `AmbientBackdrop.tsx`, `App.tsx`, README, STATE, verzio, inventory.
- Eredmeny: Apple WebKit/touch eszkoz detektalasa eseten a HUD zene gomb kulso YouTube lapon nyitja meg a zenet, a rejtett hatter-player eroltetese nelkul. Desktopon es Androidon marad az iframe API-s hatterzene.
- Follow-up: iPhone/iPad Chrome smoke teszt; kesobb sajat hostolt audiofajl adhatna teljesen egyseges hatterzene-elmenyt.

## 2026-07-24 - Apple zene fallback appon belul

- Cel: megszuntetni, hogy Apple eszkozon a zene gomb YouTube appra vagy ures kulso lapra vigye a felhasznalot.
- Modositott teruletek: `AmbientBackdrop.tsx`, `App.tsx`, `main.css`, README, STATE, verzio, inventory.
- Eredmeny: Apple WebKit/touch eszkozon a HUD zene gomb appon beluli, lathato YouTube iframe panelt nyit, kulso navigacio nelkul. Androidon es desktopon marad a hatter-playeres mukodes.
- Follow-up: iPhone/iPad Chrome smoke teszt; ha a lathato embed sem eleg jo UX, sajat hostolt audiofajl a kovetkezo stabil opcio.

## 2026-07-24 - Apple YouTube zene letiltas

- Cel: eltavolitani a hasznalhatatlan Apple YouTube fallbackeket, mert kulso app/ures lap vagy appon beluli "megnyitas YouTube-on" panel rossz UX.
- Modositott teruletek: `App.tsx`, `main.css`, README, STATE, verzio, inventory.
- Eredmeny: Apple WebKit/touch eszkozon a HUD zene gomb le van tiltva es tooltipben jelzi a korlatot. Androidon es desktopon marad az iframe API-s hatterzene.
- Follow-up: ha Apple eszkozokon is kell zene, a kovetkezo stabil megoldas sajat hostolt audiofajl, nem YouTube hatterplayer.

## 2026-07-24 - Matrica meret finomitas

- Cel: a kocka matricai nagyobbak legyenek, de a fekete rácsperem tovabbra is lathato maradjon.
- Modositott teruletek: `CubeScene.tsx`, STATE, verzio, inventory.
- Eredmeny: a lathato `STICKER_SIZE` `0.68`-rol `0.81`-re nott a `0.94` panelmeret mellett. Ez kb. 19% matrica-noveles, es a panelenkenti fekete perem oldalankent kb. `0.13`-rol `0.065`-re, vagyis felere csokken.
- Follow-up: eles vizualis smoke teszt desktopon es telefonon.
