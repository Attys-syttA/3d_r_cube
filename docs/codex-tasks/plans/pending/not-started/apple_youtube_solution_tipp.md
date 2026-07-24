## Diagnózis

A hiba nagy valószínűséggel **nem a GitHub Actions buildben**, hanem a jelenlegi zenelejátszási architektúrában van. A megadott Actions job sikeresen lefutott; a repository jelenlegi tesztjei viszont a kockalogikát ellenőrzik, valódi iOS böngészős médialejátszást nem. ([GitHub][1])

A jelenlegi megoldás:

* betölti a YouTube IFrame API-t;
* létrehoz egy szinte teljesen elrejtett, cross-origin YouTube iframe-et;
* a saját zene gombjából meghívja az iframe `unMute()` és `playVideo()` metódusait;
* a `playMusic()` már attól sikeresnek tekinti az indítást, hogy a player objektum létezik, nem attól, hogy ténylegesen elindult a zene. ([GitHub][2])

Apple eszközön az audible media indítását közvetlen felhasználói gesztushoz köti a WebKit. A biztos minta az, amikor a kattintási eseménykezelő közvetlenül egy `<audio>` vagy `<video>` elem `play()` metódusát hívja. Az aszinkron callbackből vagy közvetett iframe-vezérlésből érkező indítást blokkolhatja. A `playsinline=1` csak a videó inline megjelenését szabályozza, nem engedélyezi automatikusan a hangos lejátszást. ([WebKit][3])

A YouTube API külön `onAutoplayBlocked` eseményt is biztosít arra az esetre, amikor a böngésző blokkolja a `playVideo()` hívást. A mostani kódban nincs ilyen eseménykezelés, ahogy `onStateChange` és érdemi `onError` megfigyelés sincs. Emiatt az alkalmazás jelenleg nem tudja megkülönböztetni a sikeres indítást a WebKit által blokkolt indítástól. ([Google for Developers][4])

A repository dokumentációja is ugyanerre a következtetésre jut: az egységes Apple-támogatáshoz saját hostolt audiofájlt javasol. ([GitHub][5])

## Miért nem jó a YouTube alkalmazás megnyitása?

Ez másik alkalmazásba vagy külső oldalra viszi át a felhasználót. Az operációs rendszer ilyenkor felfüggesztheti vagy később újratöltheti a böngészőlapot, így a WebGL/React játék memóriában tárolt állapota elveszhet.

Ezzel a módszerrel nem lehet megbízhatóan azt az élményt adni, mint asztali gépen:

* a játék maradjon látható;
* a zene maradjon háttérben;
* ne legyen navigáció;
* ne ürüljön ki vagy töltődjön újra az oldal.

A YouTube app indítása ezért nem javítás, hanem az eredeti követelménytől eltérő működés.

# Javasolt végleges megoldás

## Saját, jogtisztán használható audiofájl és natív `<audio>` elem

A háttérzenét egy saját domainről kiszolgált MP3 vagy AAC/M4A fájlként kell lejátszani.

A React alkalmazásban legyen egyetlen, tartósan felcsatolt audioelem:

```html
<audio
  preload="metadata"
  loop
  src="/3d_r_cube/assets/audio/background.mp3">
</audio>
```

A zene gomb eseménykezelőjében közvetlenül kell meghívni:

```ts
const startMusic = async () => {
  const audio = audioRef.current;
  if (!audio) return;

  try {
    await audio.play();
    setMusicState("playing");
  } catch (error) {
    setMusicState("blocked");
  }
};
```

A lényeg nem maga a néhány sor, hanem a végrehajtási sorrend:

1. Az `<audio>` elem már a kattintás előtt létezzen.
2. A `src` már előre legyen beállítva.
3. A click/touch handler közvetlenül hívja az `audio.play()` metódust.
4. A hívás előtt ne legyen hálózati kérés, `setTimeout`, dinamikus import vagy más `await`.
5. A UI csak a `play()` Promise sikeres teljesülése után jelezze, hogy szól a zene.
6. Elutasításkor a gomb maradjon aktív, és jelenjen meg érthető állapotjelzés.

Ez ugyanazon az oldalon marad, és a WebKit által támogatott felhasználói gesztusos lejátszási mintát használja. ([WebKit][3])

## Ne legyen Apple-specifikus tiltás

Jelenleg az `App.tsx` user-agent alapján Apple eszközt keres, majd letiltja a zene gombot:

* `APPLE_WEBKIT_PATTERN`
* `isAppleWebKitDevice()`
* `usesAppleMusicPanel`
* `disabled={usesAppleMusicPanel}`

Ezt a teljes ágat érdemes eltávolítani. ([GitHub][6])

Ne platformot próbáljon felismerni az alkalmazás, hanem a tényleges művelet eredményét:

```text
idle → loading → playing
                 ↘ blocked
                 ↘ error
```

Így ugyanaz a kód működik:

* Windows Chrome-ban;
* Android Chrome-ban;
* iPhone Chrome-ban;
* iPhone Safariban;
* iPad Chrome-ban;
* iPad Safariban.

Az iOS Chrome és Safari szempontjából sem érdemes két külön implementációt építeni. A cél egy WebKit-kompatibilis médiaindítási folyamat legyen.

# Javasolt komponensfelosztás

## `BackgroundAudio.tsx`

Felelőssége:

* az egyetlen `<audio>` elem életben tartása;
* `play`, `pause`, `setVolume`;
* lejátszási állapot;
* `ended`, `error`, `waiting`, `playing` események;
* loop kezelés.

## `useBackgroundMusic.ts`

Kívülről használható API:

```text
state
isPlaying
play(): Promise<boolean>
pause(): void
toggle(): Promise<void>
setVolume(value): void
error
```

## `App.tsx`

Csak:

* megjeleníti a gombot;
* meghívja a `toggle()` műveletet;
* megjeleníti az állapotot.

Az `AmbientBackdrop` ezután kizárólag a vizuális háttérért feleljen. A zene ne legyen a grafikai komponensbe beágyazva.

# Audiofájl kiszolgálása

Vite alatt a fájl például ide kerülhet:

```text
public/assets/audio/background.mp3
```

A forrás:

```ts
const musicUrl =
  `${import.meta.env.BASE_URL}assets/audio/background.mp3`;
```

Ez fontos, mert a projekt nem feltétlenül domain rooton, hanem `/3d_r_cube/` útvonal alatt fut.

A szerver ellenőrzendő tulajdonságai:

* `Content-Type: audio/mpeg`;
* byte-range kérések támogatása;
* HTTPS;
* ne legyen hibás cross-origin átirányítás;
* a fájl URL-je közvetlenül is elérhető legyen.

## Jogi korlát

YouTube-videóból nem szabad egyszerűen hangfájlt kinyerni és saját szerveren közzétenni, hacsak nincs hozzá megfelelő engedély.

A saját hostolás akkor megfelelő, ha:

* saját zene;
* megvásárolt vagy megfelelően licencelt zene;
* royalty-free forrás;
* a szerző kifejezetten engedélyezte a webes újraközlést.

Ez technikailag alacsony kockázatú, de a licencelés miatt közepes üzleti kockázatú feltételezés.

# Átmeneti YouTube-diagnosztika

Amennyiben előbb bizonyítani szeretnétek, hogy valóban a YouTube/WebKit kapcsolat okozza a hibát, ideiglenesen érdemes:

1. megszüntetni az Apple-gomb tiltását;
2. kezelni az `onAutoplayBlocked` eseményt;
3. kezelni az `onStateChange` eseményt;
4. csak `YT.PlayerState.PLAYING` esetén állítani a UI-t „playing” állapotra;
5. naplózni az `onError` kódot;
6. naplózni, hogy a player a kattintáskor már `ready` volt-e;
7. ellenőrizni az iframe `allow="autoplay; encrypted-media"` attribútumát.

Ez segít a diagnózisban, de **nem javaslom végleges megoldásnak**. A YouTube dokumentáció szerint a player minimum 200×200 képpontos viewportot vár, miközben a jelenlegi iframe gyakorlatilag láthatatlanra és nagyon kicsire van transzformálva, valamint `pointer-events: none` miatt közvetlenül nem kattintható. ([Google for Developers][7])

Ha a követelmény szó szerint ez:

> Láthatatlan YouTube iframe-ből induljon el hangosan a zene egy saját gombbal minden iOS böngészőben.

arra nincs stabil, cross-browser garancia.

# Tesztelési terv

## Automatizált tesztek

Szintetikus `HTMLMediaElement` mockkal legalább ezek legyenek:

* `play()` sikeresen teljesül → `playing`;
* `play()` `NotAllowedError` hibával elutasul → `blocked`;
* hálózati hiba → `error`;
* pause után újraindítható;
* gyors dupla kattintás nem indít párhuzamos műveleteket;
* komponens újrarenderelése nem hoz létre második audioelemet;
* az Apple user-agent nem tiltja le a gombot.

A repository jelenleg nem tartalmaz valódi browser E2E médiatesztet, ezért Playwright WebKit teszt hozzáadása hasznos lenne. Ez a Promise- és UI-viselkedést tudja ellenőrizni; azt, hogy fizikailag hallható-e a hang, eszközön manuálisan kell validálni. ([GitHub][8])

## Eszköztesztek

Minimum tesztmátrix:

* iPhone + Safari;
* iPhone + Chrome;
* iPad + Safari;
* iPad + Chrome;
* Android + Chrome;
* Windows/macOS + Chrome.

Ellenőrizendő:

* első érintésre elindul;
* pause/resume működik;
* nem nyílik új alkalmazás;
* nem változik az URL;
* a kocka állapota megmarad;
* forgatás után is szól;
* háttérbe küldés és visszatérés után konzisztens a gomb állapota;
* blokkoláskor nem jelez hamisan lejátszást.

A böngésző előtérben történő lejátszás reális és megoldható. A lezárt képernyőn vagy hosszabb ideig háttérbe tett böngészőben történő folyamatos zenelejátszást viszont az iOS felfüggesztési szabályai befolyásolhatják; ezt ne tegyétek MVP elfogadási kritériummá.

# Elfogadási kritérium

A javítás akkor tekinthető késznek, ha:

* nincs Apple-specifikusan letiltott zene gomb;
* iPhone Chrome-ban és Safariban egy explicit érintés elindítja a zenét;
* az oldal nem navigál el;
* a YouTube alkalmazás nem indul el;
* a játékállapot változatlan marad;
* a UI csak tényleges siker után mutat lejátszást;
* hiba esetén újrapróbálható;
* Androidon és PC-n nincs regresszió;
* a manuális eszközteszt eredménye repositoryban dokumentált.

**A jó végleges irány tehát:** a YouTube iframe teljes kivétele a háttérzene útvonalából, és egy saját domainről kiszolgált, megfelelően licencelt hangfájl közvetlen `<audio>` lejátszása. Ez oldja meg egyszerre az iPhone Chrome és Safari problémáját anélkül, hogy a felhasználó elhagyná a játékot.

[1]: https://github.com/Attys-syttA/3d_r_cube/actions/runs/30124585532/job/89584952232 "ci: ignore runtime test results in inventory · Attys-syttA/3d_r_cube@8859142 · GitHub"
[2]: https://github.com/Attys-syttA/3d_r_cube/blob/main/src/ui/AmbientBackdrop.tsx "3d_r_cube/src/ui/AmbientBackdrop.tsx at main · Attys-syttA/3d_r_cube · GitHub"
[3]: https://webkit.org/blog/6784/new-video-policies-for-ios/ "  New <video> Policies for iOS | WebKit"
[4]: https://developers.google.com/youtube/iframe_api_reference "YouTube Player API Reference for iframe Embeds  |  YouTube IFrame Player API  |  Google for Developers"
[5]: https://github.com/Attys-syttA/3d_r_cube "GitHub - Attys-syttA/3d_r_cube: A 3D Rubik's Cube puzzle that can be played on a web interface · GitHub"
[6]: https://github.com/Attys-syttA/3d_r_cube/blob/main/src/ui/App.tsx "3d_r_cube/src/ui/App.tsx at main · Attys-syttA/3d_r_cube · GitHub"
[7]: https://developers.google.com/youtube/iframe_api_reference?utm_source=chatgpt.com "YouTube Player API Reference for iframe Embeds"
[8]: https://github.com/Attys-syttA/3d_r_cube/blob/main/package.json "3d_r_cube/package.json at main · Attys-syttA/3d_r_cube · GitHub"
