# Codex végrehajtási feladat – Apple-kompatibilis háttérzene a 3D Rubik-kocka webalkalmazásban

## Szerep és munkamód

Önálló senior frontend fejlesztőként dolgozz a feladaton.

A munkát folytasd önállóan a teljes elkészülésig vagy addig, amíg valódi, a repositoryból biztonságosan fel nem deríthető információ hiányzik.

Ne találj ki követelményeket, licenceket, fájlokat, API-kat vagy böngészőképességeket.

Ne végezz kapcsolódó refaktorálást, dizájncserét vagy funkcióbővítést.

Ne állj meg pusztán azért, mert a jelenlegi megoldás hibás vagy technikailag kényelmetlen.

## Repository

Repository:

```text
https://github.com/Attys-syttA/3d_r_cube
```

Kapcsolódó GitHub Actions futás:

```text
https://github.com/Attys-syttA/3d_r_cube/actions/runs/30124585532/job/89584952232
```

A munka megkezdésekor:

1. Klónozd vagy nyisd meg a repositoryt.
2. Ellenőrizd az aktuális branchet és working tree állapotot.
3. Jegyezd fel a kiinduló commit hashét.
4. Olvasd el a README-t és a projektben lévő fejlesztői dokumentációt.
5. Vizsgáld meg a `package.json` fájlt, a buildet, a teszteket és a telepítési konfigurációt.
6. Keresd meg a teljes jelenlegi háttérzene-megvalósítást.
7. Különösen vizsgáld meg az alábbi vagy ezekkel egyenértékű részeket:

   * `src/ui/AmbientBackdrop.tsx`
   * `src/ui/App.tsx`
   * YouTube IFrame API betöltése
   * `playMusic()`
   * `playVideo()`
   * `unMute()`
   * Apple vagy WebKit user-agent felismerés
   * zene gomb letiltása
   * a zenelejátszás állapotát tároló state
   * GitHub Pages vagy más statikus telepítés base path kezelése

Ha a fájlstruktúra azóta megváltozott, a minimum szükséges adaptációval keresd meg az ezeknek megfelelő kódot.

---

# Pontos cél

Cseréld le a jelenlegi, rejtett YouTube iframe-re épülő háttérzene-lejátszást olyan natív webes audiolejátszásra, amely explicit felhasználói interakció után működik:

* iPhone Safari alatt;
* iPhone Chrome alatt;
* iPad Safari alatt;
* iPad Chrome alatt;
* Android Chrome alatt;
* asztali Chrome alatt.

A háttérzene elindítása közben:

* az oldal nem navigálhat el;
* a YouTube alkalmazás nem nyílhat meg;
* új böngészőfül vagy popup nem nyílhat;
* a játék React/WebGL állapota nem veszhet el;
* a kocka aktuális állapota nem inicializálódhat újra;
* a felhasználónak nem kell elhagynia a játékot.

A megoldás alapja egy saját oldalról vagy előre jóváhagyott URL-ről kiszolgált audioforrás és egy natív `HTMLAudioElement` legyen.

---

# Kötelező architekturális döntés

A YouTube IFrame API nem maradhat a háttérzene elsődleges lejátszási mechanizmusa.

A végleges zenelejátszás:

```text
felhasználói kattintás vagy érintés
    → közvetlen HTMLAudioElement.play()
    → Promise eredménye alapján frissített UI
```

A `play()` hívásnak közvetlenül a felhasználói eseménykezelés végrehajtási láncában kell megtörténnie.

A `play()` előtt ugyanabban az eseménykezelőben tilos:

* hálózati kérésre várni;
* `setTimeout`-ot használni;
* dinamikus importra várni;
* YouTube iframe-et inicializálni;
* más aszinkron műveletet `await`-elni;
* olyan state-frissítési láncot használni, amely után egy későbbi effect indítja el a zenét.

A `play()` Promise eredményét kötelező kezelni.

---

# Engedélyezett változtatások

Módosíthatod kizárólag a háttérzenéhez közvetlenül kapcsolódó részeket:

* React komponensek;
* zenelejátszó hook vagy service;
* zenevezérlő UI;
* kapcsolódó típusok;
* kapcsolódó stílusok;
* audio asset elérési útjának kezelése;
* Vite base path kompatibilitás;
* környezeti konfiguráció;
* kapcsolódó unit és integration tesztek;
* browser E2E tesztek;
* fejlesztői dokumentáció;
* tesztjelentés vagy worklog.

Új, kis felelősségű komponens vagy hook létrehozható, például:

```text
BackgroundAudio
useBackgroundMusic
backgroundMusicConfig
```

Csak akkor hozz létre új absztrakciót, ha az egyszerűsíti a felelősségek szétválasztását.

---

# Tiltott változtatások

Tilos:

* YouTube alkalmazást megnyitni;
* YouTube URL-re navigálni;
* új ablakot vagy fület nyitni;
* YouTube-videóból hangot letölteni vagy kinyerni;
* nem igazolt licencű zenefájlt hozzáadni;
* autoplay-korlátozást megkerülő trükköt alkalmazni;
* néma autoplay után automatikus hangosításra építeni;
* user-agent alapján Apple eszközön letiltani a funkciót;
* Safarihoz és Chrome-hoz két külön, indokolatlan implementációt készíteni;
* a kocka motorját vagy solverét módosítani;
* a 3D renderert lecserélni;
* a játék UI-ját újratervezni;
* authenticationt, backendet vagy adatbázist hozzáadni;
* service workert vagy PWA-funkciót átépíteni, ha az nem feltétlenül szükséges;
* kapcsolódás nélküli dependency-frissítést végezni;
* tömeges formázást vagy fájlátrendezést végezni;
* a teszteket kikapcsolni vagy gyengíteni;
* valódi felhasználói adatot használni.

---

# Audioforrás-kezelés

## Első lépés

Ellenőrizd, van-e a repositoryban:

* saját vagy megfelelően licencelt audiofájl;
* dokumentált, jogszerűen használható közvetlen audio URL;
* zeneassethez tartozó licencinformáció.

Ne feltételezd, hogy a jelenlegi YouTube-videó hangja újrahostolható.

## Ha van jóváhagyott audioforrás

Használd azt.

Statikus asset esetén GitHub Pages-kompatibilis útvonalat használj, például a projekt tényleges base path megoldásával:

```ts
`${import.meta.env.BASE_URL}assets/audio/background.mp3`
```

Ne hardcode-old hibásan a domain gyökerét, ha az alkalmazás `/3d_r_cube/` alatt fut.

## Ha nincs jóváhagyott produkciós audioforrás

Ne tölts le és ne generálj termékbe kerülő zenét.

Ehelyett:

1. Valósítsd meg teljesen a natív audiolejátszó infrastruktúrát.
2. Tedd konfigurálhatóvá az audio URL-t egy egyértelmű környezeti vagy projektkonfigurációs értékkel.
3. Dokumentáld pontosan, hová kell elhelyezni a jóváhagyott fájlt.
4. Tesztekhez használj saját generálású, rövid, szintetikus teszthangot.
5. A szintetikus teszthang kizárólag teszt-fixture legyen.
6. Ne add ki úgy a funkciót, mintha produkciós zeneforrás nélkül teljes lenne.
7. A végső jelentésben jelöld ezt külső tartalmi blockernek, ne technikai blockernek.

---

# Kötelező implementációs felépítés

## 1. Jelenlegi megoldás feltérképezése

Dokumentáld röviden:

* hogyan töltődik be a YouTube API;
* mikor jön létre a player;
* hogyan történik a lejátszás indítása;
* hogyan jelzi a UI a lejátszási állapotot;
* hol történik Apple-specifikus tiltás;
* mely komponens felel egyszerre vizuális háttérért és zenelejátszásért;
* mi történik komponens újrarendereléskor és unmountkor.

A megállapításokat ne csak feltételezd: hivatkozz konkrét fájlokra és függvényekre a munkanaplóban.

## 2. Apple-specifikus tiltás eltávolítása

Távolítsd el a zene funkciójából az olyan logikát, amely:

* Apple user-agentet keres;
* iOS vagy WebKit esetén letiltja a gombot;
* Apple eszközön más, külső lejátszási utat ajánl;
* a platformot próbálja felismerni a tényleges képesség tesztelése helyett.

A gomb minden támogatott böngészőben legyen használható.

Ne user-agentből következtesd, hogy működik-e a lejátszás. A `play()` eredménye legyen a forrásigazság.

## 3. Tartós natív audioelem

Hozz létre egyetlen tartós `HTMLAudioElement` példányt.

Elfogadható megoldások:

* Reactben renderelt `<audio ref={...}>`;
* kontrolláltan létrehozott `new Audio()` példány, ha életciklusa egyértelműen kezelt.

A preferált megoldás egy React-életciklusban jól követhető `<audio>` elem.

Követelmények:

* ne jöjjön létre minden kattintáskor új audioelem;
* ne jöjjön létre minden renderkor új audioelem;
* legyen `loop`;
* legyen egyértelmű `preload` stratégia;
* legyen konfigurálható hangerő;
* legyen kezelve az `error`;
* legyen kezelve a `playing`;
* legyen kezelve a `pause`;
* legyen kezelve az `ended`, még akkor is, ha loop aktív;
* unmountkor távolítsd el a hozzáadott listenereket;
* ne maradjon több példány párhuzamosan lejátszásban.

## 4. Közvetlen felhasználói indítás

A zene gomb `click` vagy megfelelő pointer eseménykezelőjében:

1. Szerezd meg a már létező audioelemet.
2. Közvetlenül hívd meg az `audio.play()` metódust.
3. Kezeld a visszaadott Promise-t.
4. Csak sikeres teljesülés után állítsd `playing` állapotba.
5. Elutasításkor ne mutass hamis sikerállapotot.

Ne egy későbbi `useEffect` indítsa el a hangot.

## 5. Állapotgép

Legalább az alábbi állapotokat különböztesd meg:

```text
idle
loading
playing
paused
blocked
error
```

Nem kötelező formális state machine könyvtárat hozzáadni.

A UI viselkedése:

* `idle`: zene indítható;
* `loading`: ne lehessen kontrollálatlanul többször indítani;
* `playing`: pause érhető el;
* `paused`: resume érhető el;
* `blocked`: maradjon újrapróbálható;
* `error`: jelenjen meg rövid, nem technikai hibaüzenet és maradjon újrapróbálható.

A UI nem állíthatja `playing` állapotba magát kizárólag azért, mert meghívták a `play()` függvényt.

## 6. Pause és resume

A meglévő zene gombból vagy minimálisan módosított vezérlésből biztosíts:

* play;
* pause;
* resume.

A pause ne nullázza szükségtelenül az aktuális lejátszási pozíciót.

A felhasználó újabb interakciójából történő resume ismét közvetlen `play()` hívás legyen.

## 7. Láthatóság és háttérbe kerülés

Vizsgáld meg a `visibilitychange`, `pagehide` és `pageshow` viselkedést.

Ne próbáld meg garantálni, hogy iOS-en lezárt képernyő vagy háttérbe tett böngésző mellett is folyamatosan szóljon a zene.

Kötelező viszont:

* az alkalmazás ne omoljon össze;
* visszatéréskor a UI ne állítson valótlan lejátszási állapotot;
* ha a böngésző megszakította a lejátszást, a felhasználó újra el tudja indítani;
* a kocka állapota ne nullázódjon a zene vezérlésének hatására.

## 8. AmbientBackdrop felelősségének tisztítása

Ha az `AmbientBackdrop` jelenleg egyszerre felel:

* vizuális háttérért;
* YouTube API-ért;
* zenelejátszásért;

akkor a zenelejátszást emeld ki belőle.

Az `AmbientBackdrop` maradjon vizuális komponens.

Ne végezz ezen túlmenő vizuális refaktorálást.

## 9. YouTube-kód eltávolítása

Távolítsd el a háttérzene funkcióhoz tartozó:

* YouTube script loader kódot;
* globális `onYouTubeIframeAPIReady` kezelést;
* player példányt;
* rejtett iframe konténert;
* `playVideo()` és `unMute()` hívásokat;
* YouTube-specifikus pollingot;
* YouTube-specifikus state-et;
* már nem használt típusokat;
* már nem használt CSS-t;
* már nem használt dokumentációt.

Csak akkor hagyj meg YouTube-kódot, ha a repository más, igazolhatóan különálló funkciója használja. Ebben az esetben ne töröld globálisan, csak válaszd le a háttérzenéről.

## 10. Hozzáférhetőség

A zenevezérlő:

* legyen billentyűzettel használható;
* kapjon helyes `aria-label` értéket;
* jelezze a play/pause állapotot;
* ne csak színnel közölje az állapotot;
* blokkolás vagy hiba esetén adjon rövid, érthető visszajelzést.

Ne változtasd meg indokolatlanul a jelenlegi UI megjelenését.

---

# Biztonsági és adatvédelmi követelmények

A háttérzene működéséhez:

* ne tölts be harmadik féltől követőkódot;
* ne küldj felhasználói adatot YouTube vagy más videóplatform felé;
* ne használj dinamikusan felhasználó által megadható tetszőleges URL-t;
* konfigurált külső audio URL esetén csak előre meghatározott URL legyen használható;
* ne használj `dangerouslySetInnerHTML`-t;
* ne adj hozzá szükségtelen új dependency-t;
* ne tegyél tokent vagy secretet a frontendbe;
* ne naplózz érzékeny adatot.

Külső audiohost használata esetén ellenőrizd:

* HTTPS;
* megfelelő MIME type;
* stabil közvetlen média URL;
* nincs HTML-oldalra történő átirányítás;
* nincs szükség cookie-ra vagy autentikációra.

---

# Kötelező szintetikus tesztcsomag

Hozz létre vagy egészíts ki szintetikus teszteket.

Valódi YouTube-videót, személyes adatot vagy jogvédett hanganyagot ne használj.

## Teszt-fixture

Ha audiofájl szükséges a böngészős teszthez, hozz létre rövid, saját generálású teszthangot.

A fixture mellett legyen README vagy manifest, amely tartalmazza:

* a fixture célját;
* a létrehozás módját;
* a hosszát;
* a formátumát;
* az elvárt használatát;
* azt, hogy nem produkciós zene;
* az elvárt teszteredményeket.

## Unit tesztek

Legalább az alábbi eseteket fedd le:

1. A `play()` sikeresen teljesül.

   * Elvárt állapot: `playing`.

2. A `play()` `NotAllowedError` hibával elutasul.

   * Elvárt állapot: `blocked`.
   * A gomb újrapróbálható marad.

3. A `play()` általános hibával elutasul.

   * Elvárt állapot: `error`.

4. Pause után resume működik.

5. Gyors dupla kattintás nem indít párhuzamos, inkonzisztens műveleteket.

6. Újrarenderelés nem hoz létre második audioelemet.

7. Unmount eltávolítja az eseménykezelőket.

8. Apple user-agent mellett sincs letiltva a gomb.

9. A UI csak valódi siker után jelez `playing` állapotot.

10. Hiányzó audioforrás kontrollált hibát ad.

11. A base path helyesen képződik GitHub Pages alatt.

12. A kocka állapota nem változik zene play/pause hatására.

## Integration tesztek

Legalább ellenőrizd:

* a zenevezérlő és az audioelem együttműködését;
* a komponens életciklusát;
* route vagy nézetváltás után nem indul második zene;
* a meglévő játékfunkciók nem regresszálnak;
* a zene gomb nem nyit URL-t;
* nincs `window.open`;
* nincs YouTube app vagy deep link.

## Browser E2E

Ha a projekt tesztstruktúrájához illeszthető, használj Playwrightot vagy a már meglévő browser testing eszközt.

Ne adj hozzá nehéz E2E stacket csak egyetlen teszt kedvéért, ha a repositoryban már van megfelelő alternatíva.

Legalább Chromium és WebKit projektben teszteld:

* az oldal betöltődik;
* a zene gomb aktív;
* kattintás meghívja a natív audiolejátszási útvonalat;
* nincs navigáció;
* az URL változatlan;
* nem nyílik új oldal;
* a játék UI megmarad;
* blokkolt `play()` esetén helyes fallback jelenik meg.

Fontos: automatizált E2E teszt nem tudja megbízhatóan igazolni, hogy fizikai Apple eszközön ténylegesen hallható a hang. Ezt külön manuális tesztként dokumentáld.

---

# Manuális eszközteszt

Készíts tesztelési checklistet az alábbi mátrixhoz:

| Platform | Böngésző |
| -------- | -------- |
| iPhone   | Safari   |
| iPhone   | Chrome   |
| iPad     | Safari   |
| iPad     | Chrome   |
| Android  | Chrome   |
| Desktop  | Chrome   |

Minden kombináción ellenőrizendő:

1. Az oldal betöltődik.
2. A zene gomb nincs letiltva.
3. Első explicit érintésre vagy kattintásra elindul a zene.
4. Nem nyílik meg a YouTube alkalmazás.
5. Nem történik navigáció.
6. Nem nyílik új böngészőfül.
7. A játékállapot nem nullázódik.
8. A kocka tovább forgatható.
9. Pause működik.
10. Resume működik.
11. Háttérbe küldés és visszatérés után a UI konzisztens.
12. Hiba esetén újrapróbálható.
13. Androidon nincs regresszió.
14. Desktop Chrome alatt nincs regresszió.

A Codex nem állíthatja, hogy a fizikai iOS teszt sikeres, ha azt ténylegesen nem futtatta le. Ilyenkor készítse elő a checklistet és jelölje „human verification required” állapotúnak.

---

# Kötelező parancsok és ellenőrzések

A repository tényleges scriptjeihez igazodva futtasd:

1. Dependency install.
2. Linter.
3. Type checking.
4. Unit tesztek.
5. Integration tesztek.
6. Browser E2E tesztek, ha vannak vagy hozzáadásra kerültek.
7. Production build.
8. A generált statikus build helyi kiszolgálása.
9. A GitHub Pages base path ellenőrzése.
10. Maradék YouTube háttérzene-hivatkozások keresése.
11. Maradék Apple-specifikus tiltások keresése.

Használj repositoryhoz illeszkedő parancsokat. Ne találj ki nem létező npm scripteket.

A végén végezz célzott keresést legalább ezekre:

```text
youtube
YT.Player
playVideo
unMute
onYouTubeIframeAPIReady
APPLE
WebKit
window.open
location.href
youtu.be
youtube.com
```

A találatokat egyenként értékeld. Ne törölj olyan kódot, amely más, különálló funkcióhoz szükséges.

---

# Megfigyelt eredmények mentése

Mentsd el a teszteredményeket a repository meglévő dokumentációs vagy task/worklog struktúrájába.

Ha nincs ilyen struktúra, hozz létre egy célzott dokumentumot, például:

```text
docs/testing/background-audio-apple-validation.md
```

Ne ments eredményeket:

* build mappába;
* cache mappába;
* `node_modules` alá;
* ideiglenes runtime könyvtárba.

A dokumentumban legyen:

* kiinduló commit;
* módosított terület;
* futtatott parancsok;
* parancsonként pass/fail;
* browser E2E eredmények;
* nem futtatott fizikai eszköztesztek;
* fennmaradó korlátok;
* audioforrás licence vagy hiányának jelzése.

---

# Rollback pont

Mielőtt módosítasz:

1. Jegyezd fel a kiinduló commit hashét.
2. Ellenőrizd, hogy a working tree tiszta-e.
3. Ha nem tiszta, ne írj felül felhasználói változtatást.
4. Készíts külön branchet, ha a munkakörnyezet ezt lehetővé teszi.

Rollback esetén kizárólag a saját módosításaidat vond vissza.

Ne használj destruktív resetet olyan working tree-n, amely felhasználói módosításokat tartalmaz.

---

# Elfogadási kritériumok

A feladat csak akkor tekinthető késznek, ha az összes alábbi teljesül:

* [ ] A háttérzene nem YouTube iframe-en keresztül indul.
* [ ] A YouTube alkalmazás nem nyílik meg.
* [ ] A zene gomb Apple eszközökön nincs letiltva.
* [ ] Nincs user-agent alapú Apple fallback.
* [ ] Egyetlen tartós natív audioelem kezeli a zenét.
* [ ] A `play()` közvetlen felhasználói interakcióból fut.
* [ ] A `play()` előtt nincs megszakító aszinkron várakozás.
* [ ] A `play()` Promise kezelve van.
* [ ] A UI csak sikeres indítás után mutat lejátszást.
* [ ] `NotAllowedError` esetén kontrollált `blocked` állapot jelenik meg.
* [ ] Az újrapróbálás működik.
* [ ] Pause működik.
* [ ] Resume működik.
* [ ] A zene loopol.
* [ ] Nem jön létre több párhuzamos audioelem.
* [ ] Az oldal nem navigál el.
* [ ] Nem nyílik új fül vagy popup.
* [ ] A kocka állapota play/pause közben megmarad.
* [ ] A GitHub Pages base path helyesen működik.
* [ ] Nincs nem licencelt zene hozzáadva.
* [ ] A kapcsolódó unit tesztek sikeresek.
* [ ] A kapcsolódó integration tesztek sikeresek.
* [ ] A WebKit browser tesztek sikeresek, amennyiben automatizálhatók.
* [ ] A teljes meglévő tesztcsomag sikeres.
* [ ] A production build sikeres.
* [ ] A teszteredmények dokumentálva vannak.
* [ ] A fizikai Apple eszközteszt státusza őszintén dokumentált.

---

# Valódi blokkoló feltételek

Csak akkor kérj további információt, ha az alábbiak egyike fennáll, és a repositoryból nem állapítható meg:

1. Nincs jogszerűen használható produkciós audioforrás.
2. A kívánt zenefájl licencstátusza ismeretlen.
3. A deployment környezet nem szolgál ki audiofájlt vagy nem ismert.
4. A repository állapota ütköző, nem commitolt felhasználói módosításokat tartalmaz.
5. A jelenlegi architektúra a dokumentálttól lényegesen eltér, és a minimális adaptáció nem biztonságos.

Ilyenkor is fejezd be mindazt, ami a hiányzó információ nélkül biztonságosan elkészíthető.

Ne állj meg pusztán azért, mert fizikai iPhone nem áll rendelkezésre.

---

# Végső jelentés kötelező sorrendje

A munka végén pontosan ebben a sorrendben adj jelentést:

## 1. Eredmény

Egyértelműen írd le:

* elkészült;
* részben készült el;
* vagy blokkolt.

## 2. Gyökérok

Röviden írd le a korábbi YouTube iframe-es megoldás és az Apple böngészőkorlátozás kapcsolatát.

Csak a repositoryban ténylegesen talált kódra és az elvégzett tesztekre hivatkozz.

## 3. Módosított fájlok

Fájlonként:

* fájlnév;
* módosítás célja;
* lényegi változás.

## 4. Implementált működés

Írd le:

* audioelem életciklusa;
* play/pause/resume;
* állapotkezelés;
* hibakezelés;
* base path kezelés;
* YouTube-kód eltávolítása.

## 5. Tesztek

Parancsonként:

* pontos parancs;
* eredmény;
* tesztszám, ha elérhető;
* hiba esetén rövid ok.

## 6. Szintetikus tesztcsomag

Írd le:

* fixture;
* esetek;
* elvárt eredmények;
* tényleges eredmények.

## 7. Browser és eszközvalidáció

Különítsd el:

* automatizált Chromium;
* automatizált WebKit;
* tényleges fizikai iOS;
* nem futtatott manuális ellenőrzések.

Ne állíts fizikai eszköztesztet bizonyíték nélkül.

## 8. Fennmaradó korlátok

Például:

* iOS háttérben felfüggesztheti a böngészőt;
* produkciós audioasset még szükséges;
* manuális hallhatósági teszt szükséges.

## 9. Rollback

Add meg:

* kiinduló commit;
* branch vagy commit;
* a saját változtatások visszavonásának biztonságos módja.

## 10. Elfogadási kritériumok

A fenti checklistet töltsd ki valós eredményekkel.

## 11. Következő szükséges emberi lépés

Legfeljebb egy konkrét következő lépést adj meg, például:

```text
Futtasd le a mellékelt eszközteszt-checklistet egy valódi iPhone-on Safari és Chrome alatt.
```
