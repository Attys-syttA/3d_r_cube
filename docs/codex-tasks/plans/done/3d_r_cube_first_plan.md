# 3d_r_cube first playable plan

## Allapot

- Statusz: elso jatszhato verzio elkeszult; kovetkezo feladat az oktatasi mod.

## Kapcsolodo jelenlegi helyzet

- A repo gyokerbol vezerelt Vite + React + TypeScript + Three.js alkalmazas lesz.
- Backend, adatbazis, fiok, online ranglista es tobbjatekos funkcio nem kell.
- A kockalogika legyen fuggetlen a 3D renderelestol.
- Kesobbi irany: oktatasi mod kezdoknek, lepesenkenti magyar magyarazattal.

## Elkeszult reszek

- Repo bootstrap: local `AGENTS.md`, `STATE.md`, changelog, inventory es check script.
- GitHub `origin/main` beallitva, a GitHubon letrejott MIT `LICENSE` lokalisan jelen van.
- LF sortores es inventory szabaly ervenyes.

## Nyitott reszek

- Kesobbi oktatasi mod reszletes terve.

## Cel

Legyen egy modern bongeszoben futo, interaktiv 3D logikai kocka jatek, amely:

- valodi 3x3x3 kockaallapot-modellt hasznal;
- Three.js-szel renderel teljes 3D kockat;
- billentyuzettel, gombokkal es egeres huzassal is forgathato;
- tud keverni, visszavonni, ujrakezdeni es alaphelyzetbe allni;
- meri az idot es a jatekos mozdulatait;
- felismeri a kirakott allapotot;
- nem esik szet kisebb kepernyon;
- tartalmaz rovid sugot es elokesziti a kesobbi tanulo modot.

## Vegrehajtasi fázisok

### 1. Stack es validacio

- Vite + React + TypeScript alkalmazas.
- Three.js a 3D rendereleshez.
- Vitest a kockalogikai tesztekhez.
- `npm.cmd run check` fogja ossze: encoding, unit teszt, typecheck, build, inventory, `git diff --check`.

### 2. Kockalogika

- `CubeState` tartalmazza a cubie poziciot es a matricak normalvektorat/szinet.
- Támogatott mozdulatok: `U`, `D`, `L`, `R`, `F`, `B`, inverse es `2`.
- Keveres csak szabalyos mozdulatokbol allhat.
- Undo inverse mozdulatokkal tortenjen.
- Kirakott allapot felismerese a belso logikai allapotbol jojjon.

Kotelezo tesztek:

- negy azonos 90 fokos mozdulat visszaadja az eredetit;
- move + inverse visszaadja az eredetit;
- `R2` ket `R`-rel egyezik;
- scramble visszafordithato;
- ervenytelen notation hibazik.

### 3. Renderelt jatekfelulet

- A 3D scene legyen a fo elmeny, ne marketing oldal.
- Desktopon a kocka legyen nagy, a vezerlopult oldalt legyen.
- Mobilon a vezerlopult a jatekter ala rendezodjon.
- A UI ne hasznaljon felesleges dekoraciot; a kocka mozgasa legyen a latvany.
- Gombok: Keveres, Visszavonas, Ujrakezdes, Alaphelyzet, Hang, Sugo.
- Move-pad: `U D L R F B`, valamint `90`, inverse es `2` mod.

### 4. Interakcio

- Billentyuk: `U`, `D`, `L`, `R`, `F`, `B`.
- `Shift + betu`: inverse.
- `2`, majd betu: dupla forgatas.
- Egeres huzas: szines matricarol indulva kulso reteget forgat.
- Kamera: OrbitControls; ures ter vagy teljes scene huzasa kameramozgasra hasznalhato.
- Párhuzamos move animacio ne induljon.

### 5. Oktatasi mod kesobbi bovites

Az elso verzio csak elokesziti a helyet. A kovetkezo fejlesztesben:

- jelolesek magyar magyarazata;
- kezdoknek szolo lepesek;
- feher kereszt;
- elso reteg;
- masodik reteg;
- sarga kereszt;
- sarga sarkok;
- gyakorlomod, amely egy-egy move-ot kiemel a 3D kockan.

Forrasellenorzeshez hasznalhato kesobbi kiindulopontok:

- official 3x3-style solution guide;
- Ruwix vagy mas kezdoknek szolo notation guide;
- csak oktatasi hivatkozaskent, nem kodba masolt tartalomkent.

## Befejezesi feltetelek

- `npm.cmd run test` zold.
- `npm.cmd run typecheck` zold.
- `npm.cmd run build` zold.
- `npm.cmd run check` zold.
- `npm.cmd run inventory:write`, majd `npm.cmd run check:inventory` zold uj fajlok utan.
- Renderelt browser QA desktop es mobil viewporton megtortent.
- Konzolban nincs normal hasznalat kozbeni error.
- README, `STATE.md`, `docs/CHANGELOG.dev.md` friss.

## Nem cel az elso verziohoz

- regisztracio;
- online ranglista;
- tobbjatekos mod;
- AI-alapu automatikus kirakas;
- tobbfele kockameret;
- backend;
- fizetes vagy reklam.
