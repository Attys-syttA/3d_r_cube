import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, History, Moon, Music, Music2, RotateCcw, Shuffle, Sun, Volume2, VolumeX } from "lucide-react";
import {
  applyMove,
  applyMoves,
  createSolvedCube,
  formatMove,
  generateScramble,
  invertMove,
  isSolved,
  MOVE_FACES,
  MOVE_SLICES,
  MOVE_SYMBOLS,
  parseMove,
  type CubeState,
  type Move,
  type MoveSymbol,
  type MoveSuffix
} from "../engine/cube";
import { CubeScene } from "./CubeScene";
import { AmbientBackdrop, type AmbientBackdropHandle } from "./AmbientBackdrop";

type TurnDirection = "normal" | "inverse";
type VisualTheme = "day" | "night";

const THEME_STORAGE_KEY = "r-cube-theme";
const APPLE_WEBKIT_PATTERN = /iPad|iPhone|iPod|Macintosh/;

const MOVE_HELP: Record<MoveSymbol, { label: string; details: string }> = {
  U: { label: "U - felso oldal", details: "felso oldal" },
  D: { label: "D - also oldal", details: "also oldal" },
  L: { label: "L - bal oldal", details: "bal oldal" },
  R: { label: "R - jobb oldal", details: "jobb oldal" },
  F: { label: "F - elso oldal", details: "elso oldal" },
  B: { label: "B - hatso oldal", details: "hatso oldal" },
  M: { label: "M - X tengely kozepe", details: "kozepso X tengely" },
  E: { label: "E - Y tengely kozepe", details: "kozepso Y tengely" },
  S: { label: "S - Z tengely kozepe", details: "kozepso Z tengely" }
};

const MOVE_HELP_TEXT = MOVE_SYMBOLS.map((symbol) => `${MOVE_HELP[symbol].label}: ${MOVE_HELP[symbol].details}.`).join(" ");

const HELP_STEPS = [
  "Huzd korbe az ures teret a kamera forgatasahoz, vagy hasznald az egergorgot kozeliteshez.",
  "Kattints egy szines matricara, majd huzd oldalra vagy fel-le egy kulso vagy kozepso reteg elforgatasahoz.",
  "A kezelopanelen elobb valassz iranyt: ↻ = alapirany, ↺ = ellenkezo irany. A 2x kulon kapcsolo: ha aktiv, a kovetkezo oldalgomb 180 fokot fordul.",
  `Jelolesek: ${MOVE_HELP_TEXT}`,
  "Billentyuk: U D L R F B M E S. Shift + betu az ellenkezo irany, a 2 billentyu dupla forgatast kapcsol.",
  "A Keveres gomb szabalyos lepesekbol indit uj jatekot. A keveres nem szamit bele a mozdulatszamba."
];

function moveTitle(symbol: MoveSymbol): string {
  const help = MOVE_HELP[symbol];
  return `${help.label}: ${help.details}`;
}

function getInitialTheme(): VisualTheme {
  if (typeof window === "undefined") return "day";
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "night" ? "night" : "day";
  } catch {
    return "day";
  }
}

function isAppleWebKitDevice(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorInfo = window.navigator;
  const hasTouch = navigatorInfo.maxTouchPoints > 1;
  return APPLE_WEBKIT_PATTERN.test(navigatorInfo.userAgent) && hasTouch;
}

function useGameTimer(isRunning: boolean, resetKey: number): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  return seconds;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function App() {
  const [cube, setCube] = useState<CubeState>(() => createSolvedCube());
  const ambientBackdropRef = useRef<AmbientBackdropHandle | null>(null);
  const cubeRef = useRef(cube);
  const [history, setHistory] = useState<Move[]>([]);
  const [scrambleStart, setScrambleStart] = useState<CubeState>(() => createSolvedCube());
  const [gameStarted, setGameStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [isMusicPlaying, setMusicPlaying] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [lastMove, setLastMove] = useState<string>("Alaphelyzet");
  const [turnDirection, setTurnDirection] = useState<TurnDirection>("normal");
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(() => getInitialTheme());
  const [moveTooltip, setMoveTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isDoubleTurn, setDoubleTurn] = useState(false);
  const [helpIndex, setHelpIndex] = useState(0);
  const [isHelpOpen, setHelpOpen] = useState(true);

  const seconds = useGameTimer(gameStarted && !completed, timerResetKey);
  const solved = useMemo(() => isSolved(cube), [cube]);
  const usesAppleMusicPanel = useMemo(() => isAppleWebKitDevice(), []);

  useEffect(() => {
    cubeRef.current = cube;
    if (gameStarted && isSolved(cube)) {
      setCompleted(true);
      setLastMove("Kirakva");
    }
  }, [cube, gameStarted]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, visualTheme);
    } catch {
      // If browser storage is disabled, the theme still works for the current session.
    }
  }, [visualTheme]);

  const showMoveTooltip = useCallback((symbol: MoveSymbol, clientX: number, clientY: number) => {
    setMoveTooltip({ text: moveTitle(symbol), x: clientX, y: clientY });
  }, []);

  const showFocusedMoveTooltip = useCallback((symbol: MoveSymbol, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    setMoveTooltip({ text: moveTitle(symbol), x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const playTick = useCallback(() => {
    if (isMuted || typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 220;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.05);
  }, [isMuted]);

  const performMove = useCallback(
    (move: Move, options: { record?: boolean; startGame?: boolean } = {}) => {
      if (pendingMove) return;
      setPendingMove(move);
      setLastMove(formatMove(move));
      window.setTimeout(() => {
        setCube((current) => {
          const next = applyMove(current, move);
          cubeRef.current = next;
          return next;
        });
        if (options.record !== false) {
          setHistory((moves) => [...moves, move]);
        }
        if (options.startGame) {
          setGameStarted(true);
        }
        setPendingMove(null);
        playTick();
      }, 260);
    },
    [pendingMove, playTick]
  );

  const resetSolved = useCallback(() => {
    const solvedCube = createSolvedCube();
    setCube(solvedCube);
    setScrambleStart(solvedCube);
    setHistory([]);
    setCompleted(false);
    setGameStarted(false);
    setTimerResetKey((key) => key + 1);
    setLastMove("Alaphelyzet");
  }, []);

  const scramble = useCallback(() => {
    const moves = generateScramble(24);
    const start = applyMoves(createSolvedCube(), moves);
    setCube(start);
    setScrambleStart(start);
    setHistory([]);
    setCompleted(false);
    setGameStarted(true);
    setTimerResetKey((key) => key + 1);
    setLastMove(`Keveres ${moves.length} lepessel`);
  }, []);

  const restartScramble = useCallback(() => {
    setCube(scrambleStart);
    setHistory([]);
    setCompleted(false);
    setGameStarted(true);
    setTimerResetKey((key) => key + 1);
    setLastMove("Ujrakezdve");
  }, [scrambleStart]);

  const undo = useCallback(() => {
    if (history.length === 0 || pendingMove) return;
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((moves) => moves.slice(0, -1));
    performMove(invertMove(previous), { record: false });
  }, [history, pendingMove, performMove]);

  const runNotation = useCallback(
    (face: MoveSymbol) => {
      const suffix: MoveSuffix = isDoubleTurn ? "2" : turnDirection === "inverse" ? "'" : "";
      performMove(parseMove(`${face}${suffix}`), { startGame: true });
    },
    [isDoubleTurn, performMove, turnDirection]
  );

  const toggleMusic = useCallback(() => {
    if (usesAppleMusicPanel) {
      ambientBackdropRef.current?.pauseMusic();
      setMusicPlaying(false);
      return;
    }

    if (isMusicPlaying) {
      ambientBackdropRef.current?.pauseMusic();
      setMusicPlaying(false);
      return;
    }

    const started = ambientBackdropRef.current?.playMusic() ?? false;
    setMusicPlaying(started);
  }, [isMusicPlaying, usesAppleMusicPanel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toUpperCase();
      if (key === "2") {
        setDoubleTurn((value) => !value);
        return;
      }
      if (!MOVE_SYMBOLS.includes(key as MoveSymbol)) return;
      event.preventDefault();
      const suffix: MoveSuffix = isDoubleTurn ? "2" : event.shiftKey ? "'" : turnDirection === "inverse" ? "'" : "";
      performMove({ face: key as MoveSymbol, suffix }, { startGame: true });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDoubleTurn, performMove, turnDirection]);

  return (
    <main className="app-shell" data-theme={visualTheme}>
      <section className="play-space" aria-label="3D R-CUBE jatekter">
        <AmbientBackdrop ref={ambientBackdropRef} isMusicPlaying={isMusicPlaying} />
        <CubeScene cube={cube} pendingMove={pendingMove} theme={visualTheme} onMove={performMove} />
      </section>

      <aside className="hud-panel" aria-label="Jatek vezerlopult">
        <header className="hud-header">
          <div>
            <p className="eyebrow">3D R Cube</p>
            <h1>R-CUBE</h1>
          </div>
          <div className="header-actions" aria-label="Hang vezerlesek">
            <button
              className="icon-button"
              type="button"
              aria-label={isMuted ? "Effekt hang bekapcsolasa" : "Effekt hang kikapcsolasa"}
              title={isMuted ? "Effekt hang bekapcsolasa" : "Effekt hang kikapcsolasa"}
              onClick={() => setMuted((value) => !value)}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              className={isMusicPlaying ? "icon-button selected" : "icon-button"}
              type="button"
              aria-label={
                usesAppleMusicPanel
                  ? "Hatterzene Apple eszkozon jelenleg nem tamogatott"
                  : isMusicPlaying
                    ? "Hatterzene kikapcsolasa"
                    : "Hatterzene bekapcsolasa"
              }
              aria-pressed={isMusicPlaying}
              disabled={usesAppleMusicPanel}
              title={
                usesAppleMusicPanel
                  ? "Apple eszkozon a YouTube hatterzene nem megbizhato. Saját audiofajllal lesz javithato."
                  : isMusicPlaying
                    ? "Hatterzene kikapcsolasa"
                    : "Hatterzene bekapcsolasa."
              }
              onClick={toggleMusic}
            >
              {isMusicPlaying ? <Music2 size={20} /> : <Music size={20} />}
            </button>
          </div>
        </header>

        <div className="stats-grid" aria-live="polite">
          <div>
            <span>Ido</span>
            <strong>{formatTime(seconds)}</strong>
          </div>
          <div>
            <span>Mozdulat</span>
            <strong>{history.length}</strong>
          </div>
          <div>
            <span>Allapot</span>
            <strong>{completed ? "Kirakva" : gameStarted ? "Jatekban" : solved ? "Gyakorlas" : "Allitgatva"}</strong>
          </div>
          <div>
            <span>Utolso</span>
            <strong className="last-move">{lastMove}</strong>
          </div>
        </div>

        <section className="theme-panel" aria-label="Megjelenesi mod">
          <div className="section-title">
            <Moon size={18} />
            <h2>Megjelenes</h2>
          </div>
          <div className="theme-toggle" role="group" aria-label="Nappali vagy ejszakai mod">
            <button
              className={visualTheme === "day" ? "selected" : ""}
              type="button"
              aria-pressed={visualTheme === "day"}
              onClick={() => setVisualTheme("day")}
            >
              <Sun size={18} /> Nappal
            </button>
            <button
              className={visualTheme === "night" ? "selected" : ""}
              type="button"
              aria-pressed={visualTheme === "night"}
              onClick={() => setVisualTheme("night")}
            >
              <Moon size={18} /> Ejszaka
            </button>
          </div>
        </section>

        {completed ? (
          <div className="success-banner" role="status">
            Kiraktad! Ido: {formatTime(seconds)}, mozdulat: {history.length}.
          </div>
        ) : null}

        <div className="primary-actions">
          <button type="button" onClick={scramble}>
            <Shuffle size={18} /> Keveres
          </button>
          <button type="button" onClick={undo} disabled={history.length === 0 || Boolean(pendingMove)}>
            <History size={18} /> Visszavonas
          </button>
          <button type="button" onClick={restartScramble}>
            <RotateCcw size={18} /> Ujrakezdes
          </button>
          <button type="button" onClick={resetSolved}>
            <RotateCcw size={18} /> Alaphelyzet
          </button>
        </div>

        <section className="move-pad" aria-label="Kocka mozdulatok">
          <div className="suffix-toggle" role="group" aria-label="Forgatas mod">
            <button
              className={turnDirection === "normal" ? "selected" : ""}
              type="button"
              aria-label="Alapiranyu 90 fokos forgatas"
              title="Alapiranyu 90 fokos forgatas"
              onClick={() => setTurnDirection("normal")}
            >
              ↻
            </button>
            <button
              className={turnDirection === "inverse" ? "selected" : ""}
              type="button"
              aria-label="Ellenkezo iranyu 90 fokos forgatas"
              title="Ellenkezo iranyu 90 fokos forgatas"
              onClick={() => setTurnDirection("inverse")}
            >
              ↺
            </button>
            <button
              className={isDoubleTurn ? "selected secondary-selected" : ""}
              type="button"
              aria-pressed={isDoubleTurn}
              aria-label="Dupla, 180 fokos forgatas kapcsolasa"
              title="Dupla, 180 fokos forgatas kapcsolasa"
              onClick={() => setDoubleTurn((value) => !value)}
            >
              2x
            </button>
          </div>
          <div className="move-grid">
            {MOVE_FACES.map((face) => (
              <button
                key={face}
                type="button"
                aria-label={moveTitle(face)}
                onFocus={(event) => showFocusedMoveTooltip(face, event.currentTarget)}
                onBlur={() => setMoveTooltip(null)}
                onPointerEnter={(event) => showMoveTooltip(face, event.clientX, event.clientY)}
                onPointerMove={(event) => showMoveTooltip(face, event.clientX, event.clientY)}
                onPointerLeave={() => setMoveTooltip(null)}
                onClick={() => runNotation(face)}
              >
                {face}
              </button>
            ))}
            {MOVE_SLICES.map((slice) => (
              <button
                key={slice}
                className="slice-move"
                type="button"
                aria-label={moveTitle(slice)}
                onFocus={(event) => showFocusedMoveTooltip(slice, event.currentTarget)}
                onBlur={() => setMoveTooltip(null)}
                onPointerEnter={(event) => showMoveTooltip(slice, event.clientX, event.clientY)}
                onPointerMove={(event) => showMoveTooltip(slice, event.clientX, event.clientY)}
                onPointerLeave={() => setMoveTooltip(null)}
                onClick={() => runNotation(slice)}
              >
                {slice}
              </button>
            ))}
          </div>
        </section>

        {moveTooltip ? (
          <div className="floating-tooltip" role="tooltip" style={{ left: moveTooltip.x, top: moveTooltip.y }}>
            {moveTooltip.text}
          </div>
        ) : null}

        <section className="help-card" aria-label="Sugo">
          <div className="section-title">
            <HelpCircle size={18} />
            <h2>Sugo</h2>
          </div>
          {isHelpOpen ? (
            <>
              <p>{HELP_STEPS[helpIndex]}</p>
              <div className="help-actions">
                <button type="button" onClick={() => setHelpIndex((index) => Math.max(0, index - 1))}>
                  Elozo
                </button>
                <button
                  type="button"
                  onClick={() => setHelpIndex((index) => Math.min(HELP_STEPS.length - 1, index + 1))}
                >
                  Kovetkezo
                </button>
                <button type="button" onClick={() => setHelpOpen(false)}>
                  Bezar
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setHelpOpen(true)}>
              <HelpCircle size={18} /> Sugo megnyitasa
            </button>
          )}
        </section>
      </aside>
    </main>
  );
}
