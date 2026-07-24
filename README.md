# 3d_r_cube

Interaktiv, bongeszoben futo 3D logikai kocka jatek a `codex_works` workspace alatt.

## Inditas

Fejlesztoi szerver:

```powershell
npm.cmd install
npm.cmd run dev
```

Alapertelmezett helyi URL:

- `http://127.0.0.1:5174`

Teljes ellenorzes:

```powershell
npm.cmd run check
```

## E-SPER aloldalas deploy

A production build a `https://e-sper.hu/3d_r_cube/` alutvonalra keszul.

Feltolteshez:

```powershell
npm.cmd run build
```

Csak a `dist/` tartalmat toltsd fel az `e-sper.hu` tarhely `3d_r_cube` mappajaba.

A `public/.htaccess` automatikusan bekerul a `dist/.htaccess` fajlba. Celja:

- konyvtarlista tiltasa;
- dotfile-ok tiltasa;
- veletlenul feltoltott scriptfajlok futtatasanak/eleresenek tiltasa;
- alap security headerek beallitasa, ha a tarhely Apache moduljai engedik.

Feltoltes utan ellenorizendo URL-ek:

- `https://e-sper.hu/3d_r_cube/` betolt;
- `https://e-sper.hu/3d_r_cube/assets/` nem listaz konyvtarat;
- `https://e-sper.hu/3d_r_cube/.htaccess` nem olvashato.

## Jatek

- `Keveres`: szabalyos kockamozdulatokbol uj jatekot indit.
- `Visszavonas`: az utolso jatekosmozdulat inverse parjat futtatja.
- `Ujrakezdes`: visszaallitja az aktualis keveres kezdoallapotat.
- `Alaphelyzet`: teljesen kirakott kockara allit.
- Move-pad: `U`, `D`, `L`, `R`, `F`, `B`, plusz kozepso szeletek: `M`, `E`, `S`.
  - `U`: felso oldal;
  - `D`: also oldal;
  - `L`: bal oldal;
  - `R`: jobb oldal;
  - `F`: elso oldal;
  - `B`: hatso oldal;
  - `M`: kozepso X tengely;
  - `E`: kozepso Y tengely;
  - `S`: kozepso Z tengely.
- Forgatasmod: elobb valassz iranyt, utana nyomj egy oldalgombot:
  - `↻`: alapiranyu negyedfordulat;
  - `↺`: ellenkezo iranyu negyedfordulat, kockajelolessel `'`;
  - `2x`: kulon kapcsolo a 180 fokos forgatashoz.
- Billentyuk: `U D L R F B M E S`, `Shift + betu` inverse, `2` majd betu dupla forgatas.
- Eger: lathato szines matricarol vagy annak kozvetlen kereterol indulo huzas kulso vagy kozepso reteget forgat; huzas kozben 3D nyil mutatja a varhato iranyt. Ures ter huzasa a kamerat mozgatja.
- Megjelenes: a kezelopanel `Nappal` / `Ejszaka` kapcsoloja a jatek es a HUD szinmodjat valtja. A valasztas `localStorage`-ban marad meg, nem sutiben.
- Hatterzene: a kezelopanel zene gombja kapcsolja az E-SPER root oldalbol atvett YouTube hatterzenet. A lejatszas az E-SPER root oldal mukodo mintajahoz igazodik: YouTube IFrame API, rejtett player, `playVideo()` / `pauseVideo()` kapcsolas.
- Tooltip: a move gombok sajat tooltipet hasznalnak, amely az egermutato felett jelenik meg.

## E-SPER hatter

A `https://e-sper.hu/` root oldal latvanya kulon React hatterkomponensben fut a kocka mogott. Az atvett kep lokalis statikus asset:

- `public/assets/esperindex.png`

A hatter `pointer-events: none`, ezert nem zavarja a kocka egeres forgatasat. A YouTube zene a root oldal forrasa alapjan rejtett `YT.Player` peldannyal indul a HUD gombrol. Nincs Apple-specifikus gombtiltas, kulso appra vagy uj lapra nem navigal. Apple eszkozokon a tenyleges hallhatosagot eles iPad/iPhone smoke teszttel kell ellenorizni.

## Technologia

- Vite
- React
- TypeScript
- Three.js
- Vitest

A kocka belso allapotmodellje fuggetlen a 3D renderelestol. A tesztek a move engine alap tulajdonsagait ellenorzik.

## Kesobbi tanulo mod

A kovetkezo nagyobb fejlesztes celja egy magyar, kezdoknek szolo oktatasi mod:

- kockajelolesek magyarazata;
- feher kereszt;
- elso reteg;
- masodik reteg;
- sarga kereszt;
- sarga sarkok;
- 3D-ben kiemelt aktualis move.

Hasznos jovobeli referencia:

- kezdoknek szolo, generic 3x3-style jelolesi es megoldasi anyagok;
- MIT licencu, generic kocka-szimulacios vagy oktatasi projektek tanulo/solver otletekhez.

## Repo modell

- a forras es validacio a repo gyokerebol fut;
- a lokalis szabalyokat az `AGENTS.md` tartalmazza;
- a pillanatnyi allapotot a `STATE.md` tartalmazza;
- a fejlesztoi tortenet a `docs/CHANGELOG.dev.md` fajlba kerul;
- uj fajl utan futtasd: `npm.cmd run inventory:write`, majd `npm.cmd run check`.
