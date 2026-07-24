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
type TooltipPlacement = "above" | "below";
type MusicState = "off" | "starting" | "playing";

const THEME_STORAGE_KEY = "r-cube-theme";
const TOUCH_POINTER_QUERY = "(hover: none) and (pointer: coarse)";
const TOOLTIP_MAX_WIDTH = 280;
const TOOLTIP_EDGE_GAP = 12;
const TOOLTIP_POINTER_GAP = 18;

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

const DESKTOP_HELP_STEPS = [
  "Huzd korbe az ures teret a kamera forgatasahoz, vagy hasznald az egergorgot kozeliteshez.",
  "Kattints egy szines matricara, majd huzd oldalra vagy fel-le egy kulso vagy kozepso reteg elforgatasahoz.",
  "A kezelopanelen elobb valassz iranyt: ↻ = alapirany, ↺ = ellenkezo irany. A 2x kulon kapcsolo: ha aktiv, a kovetkezo oldalgomb 180 fokot fordul.",
  `Jelolesek: ${MOVE_HELP_TEXT}`,
  "Billentyuk: U D L R F B M E S. Shift + betu az ellenkezo irany, a 2 billentyu dupla forgatast kapcsol.",
  "A Keveres gomb szabalyos lepesekbol indit uj jatekot. A keveres nem szamit bele a mozdulatszamba."
];

const TOUCH_HELP_STEPS = [
  "Huzd korbe az ures teret a kamera forgatasahoz.",
  "Erints meg egy szines matricat, majd huzd oldalra vagy fel-le egy kulso vagy kozepso reteg elforgatasahoz.",
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

function getInitialTouchControlsHidden(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(TOUCH_POINTER_QUERY).matches;
}

function useTouchControlsHidden(): boolean {
  const [isHidden, setHidden] = useState(() => getInitialTouchControlsHidden());

  useEffect(() => {
    const mediaQuery = window.matchMedia(TOUCH_POINTER_QUERY);
    const onChange = () => setHidden(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isHidden;
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

function playEffectTone(context: AudioContext, gainValue: number, durationSeconds: number) {
  if (context.state === "closed") return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 220;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + durationSeconds);
}

export function App() {
  const [cube, setCube] = useState<CubeState>(() => createSolvedCube());
  const ambientBackdropRef = useRef<AmbientBackdropHandle | null>(null);
  const effectAudioContextRef = useRef<AudioContext | null>(null);
  const cubeRef = useRef(cube);
  const [history, setHistory] = useState<Move[]>([]);
  const [scrambleStart, setScrambleStart] = useState<CubeState>(() => createSolvedCube());
  const [gameStarted, setGameStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [musicState, setMusicState] = useState<MusicState>("off");
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [lastMove, setLastMove] = useState<string>("Alaphelyzet");
  const [turnDirection, setTurnDirection] = useState<TurnDirection>("normal");
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(() => getInitialTheme());
  const [floatingTooltip, setFloatingTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    placement: TooltipPlacement;
  } | null>(null);
  const [isDoubleTurn, setDoubleTurn] = useState(false);
  const [helpIndex, setHelpIndex] = useState(0);
  const [isHelpOpen, setHelpOpen] = useState(true);

  const seconds = useGameTimer(gameStarted && !completed, timerResetKey);
  const solved = useMemo(() => isSolved(cube), [cube]);
  const hideMoveControls = useTouchControlsHidden();
  const helpSteps = hideMoveControls ? TOUCH_HELP_STEPS : DESKTOP_HELP_STEPS;
  const isMusicRequested = musicState !== "off";
  const isMusicPlaying = musicState === "playing";
  const musicTooltip =
    musicState === "off"
      ? "Hatterzene bekapcsolasa"
      : musicState === "starting"
        ? "Hatterzene inditasa ujraprobalasa"
        : "Hatterzene kikapcsolasa";

  useEffect(() => {
    return () => {
      const context = effectAudioContextRef.current;
      effectAudioContextRef.current = null;
      if (context && context.state !== "closed") {
        void context.close();
      }
    };
  }, []);

  useEffect(() => {
    setFloatingTooltip(null);
    setHelpIndex((index) => Math.min(index, helpSteps.length - 1));
  }, [helpSteps.length]);

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

  const showTooltip = useCallback((text: string, clientX: number, clientY: number) => {
    const minX = TOOLTIP_EDGE_GAP + TOOLTIP_MAX_WIDTH / 2;
    const maxX = Math.max(minX, window.innerWidth - TOOLTIP_EDGE_GAP - TOOLTIP_MAX_WIDTH / 2);
    const x = Math.min(Math.max(clientX, minX), maxX);
    const placement: TooltipPlacement = clientY < 84 ? "below" : "above";
    const y = placement === "above" ? clientY - TOOLTIP_POINTER_GAP : clientY + TOOLTIP_POINTER_GAP;
    setFloatingTooltip({ text, x, y, placement });
  }, []);

  const showFocusedTooltip = useCallback((text: string, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    const minX = TOOLTIP_EDGE_GAP + TOOLTIP_MAX_WIDTH / 2;
    const maxX = Math.max(minX, window.innerWidth - TOOLTIP_EDGE_GAP - TOOLTIP_MAX_WIDTH / 2);
    const x = Math.min(Math.max(clientX, minX), maxX);
    const placement: TooltipPlacement = rect.top < 84 ? "below" : "above";
    const y = placement === "above" ? rect.top - TOOLTIP_POINTER_GAP : rect.bottom + TOOLTIP_POINTER_GAP;
    setFloatingTooltip({ text, x, y, placement });
  }, []);

  const getEffectAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!effectAudioContextRef.current) {
      effectAudioContextRef.current = new AudioContextCtor();
    }
    return effectAudioContextRef.current;
  }, []);

  const unlockEffectAudio = useCallback(() => {
    const context = getEffectAudioContext();
    if (!context || context.state === "closed") return;

    const retryRequestedMusic = () => {
      if (isMusicRequested) {
        ambientBackdropRef.current?.retryMusic();
      }
    };

    if (context.state === "running") {
      playEffectTone(context, 0.00001, 0.03);
      retryRequestedMusic();
      return;
    }

    if (context.state === "suspended") {
      void context
        .resume()
        .then(() => {
          if (context.state === "running") {
            playEffectTone(context, 0.00001, 0.03);
            retryRequestedMusic();
          }
        })
        .catch(() => {
          // Browser audio policies may reject unlock outside a real user gesture.
        });
    }
  }, [getEffectAudioContext, isMusicRequested]);

  const playTick = useCallback(() => {
    if (isMuted || typeof window === "undefined") return;
    const context = getEffectAudioContext();
    if (!context || context.state === "closed") return;
    if (context.state === "suspended") {
      void context
        .resume()
        .then(() => {
          if (context.state === "running") {
            playEffectTone(context, 0.025, 0.05);
          }
        })
        .catch(() => {
          // If the browser requires a fresh gesture, the next pointer/key event will unlock again.
        });
      return;
    }
    playEffectTone(context, 0.025, 0.05);
  }, [getEffectAudioContext, isMuted]);

  const performMove = useCallback(
    (move: Move, options: { record?: boolean; startGame?: boolean } = {}) => {
      if (pendingMove) return;
      unlockEffectAudio();
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
    [pendingMove, playTick, unlockEffectAudio]
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
    unlockEffectAudio();

    if (isMusicPlaying) {
      ambientBackdropRef.current?.pauseMusic();
      setMusicState("off");
      return;
    }

    setMusicState("starting");
    ambientBackdropRef.current?.playMusic();
    ambientBackdropRef.current?.retryMusic();
  }, [isMusicPlaying, unlockEffectAudio]);

  const handleMusicPlaybackChange = useCallback((isPlaying: boolean) => {
    setMusicState((current) => {
      if (current === "off") return current;
      return isPlaying ? "playing" : "starting";
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toUpperCase();
      if (key === "2") {
        unlockEffectAudio();
        setDoubleTurn((value) => !value);
        return;
      }
      if (!MOVE_SYMBOLS.includes(key as MoveSymbol)) return;
      event.preventDefault();
      unlockEffectAudio();
      const suffix: MoveSuffix = isDoubleTurn ? "2" : event.shiftKey ? "'" : turnDirection === "inverse" ? "'" : "";
      performMove({ face: key as MoveSymbol, suffix }, { startGame: true });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDoubleTurn, performMove, turnDirection, unlockEffectAudio]);

  return (
    <main
      className="app-shell"
      data-theme={visualTheme}
      onMouseDownCapture={unlockEffectAudio}
      onPointerDownCapture={unlockEffectAudio}
      onTouchStartCapture={unlockEffectAudio}
    >
      <section className="play-space" aria-label="3D R-CUBE jatekter">
        <AmbientBackdrop
          ref={ambientBackdropRef}
          isMusicRequested={isMusicRequested}
          onMusicPlaybackChange={handleMusicPlaybackChange}
        />
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
              onFocus={(event) =>
                showFocusedTooltip(
                  isMuted ? "Kocka hang bekapcsolasa" : "Kocka hang kikapcsolasa",
                  event.currentTarget
                )
              }
              onBlur={() => setFloatingTooltip(null)}
              onPointerEnter={(event) =>
                showTooltip(isMuted ? "Kocka hang bekapcsolasa" : "Kocka hang kikapcsolasa", event.clientX, event.clientY)
              }
              onPointerMove={(event) =>
                showTooltip(isMuted ? "Kocka hang bekapcsolasa" : "Kocka hang kikapcsolasa", event.clientX, event.clientY)
              }
              onPointerLeave={() => setFloatingTooltip(null)}
              onClick={() => setMuted((value) => !value)}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              className={isMusicRequested ? "icon-button selected" : "icon-button"}
              type="button"
              aria-label={musicTooltip}
              aria-pressed={isMusicRequested}
              onFocus={(event) =>
                showFocusedTooltip(
                  musicTooltip,
                  event.currentTarget
                )
              }
              onBlur={() => setFloatingTooltip(null)}
              onPointerEnter={(event) =>
                showTooltip(
                  musicTooltip,
                  event.clientX,
                  event.clientY
                )
              }
              onPointerMove={(event) =>
                showTooltip(
                  musicTooltip,
                  event.clientX,
                  event.clientY
                )
              }
              onPointerLeave={() => setFloatingTooltip(null)}
              onClick={toggleMusic}
            >
              {isMusicRequested ? <Music2 size={20} /> : <Music size={20} />}
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

        {!hideMoveControls ? (
          <section className="move-pad" aria-label="Kocka mozdulatok">
            <div className="suffix-toggle" role="group" aria-label="Forgatas mod">
              <button
                className={turnDirection === "normal" ? "selected" : ""}
                type="button"
                aria-label="Alapiranyu 90 fokos forgatas"
                onFocus={(event) => showFocusedTooltip("Alapiranyu 90 fokos forgatas", event.currentTarget)}
                onBlur={() => setFloatingTooltip(null)}
                onPointerEnter={(event) => showTooltip("Alapiranyu 90 fokos forgatas", event.clientX, event.clientY)}
                onPointerMove={(event) => showTooltip("Alapiranyu 90 fokos forgatas", event.clientX, event.clientY)}
                onPointerLeave={() => setFloatingTooltip(null)}
                onClick={() => setTurnDirection("normal")}
              >
                ↻
              </button>
              <button
                className={turnDirection === "inverse" ? "selected" : ""}
                type="button"
                aria-label="Ellenkezo iranyu 90 fokos forgatas"
                onFocus={(event) => showFocusedTooltip("Ellenkezo iranyu 90 fokos forgatas", event.currentTarget)}
                onBlur={() => setFloatingTooltip(null)}
                onPointerEnter={(event) => showTooltip("Ellenkezo iranyu 90 fokos forgatas", event.clientX, event.clientY)}
                onPointerMove={(event) => showTooltip("Ellenkezo iranyu 90 fokos forgatas", event.clientX, event.clientY)}
                onPointerLeave={() => setFloatingTooltip(null)}
                onClick={() => setTurnDirection("inverse")}
              >
                ↺
              </button>
              <button
                className={isDoubleTurn ? "selected secondary-selected" : ""}
                type="button"
                aria-pressed={isDoubleTurn}
                aria-label="Dupla, 180 fokos forgatas kapcsolasa"
                onFocus={(event) => showFocusedTooltip("Dupla, 180 fokos forgatas kapcsolasa", event.currentTarget)}
                onBlur={() => setFloatingTooltip(null)}
                onPointerEnter={(event) =>
                  showTooltip("Dupla, 180 fokos forgatas kapcsolasa", event.clientX, event.clientY)
                }
                onPointerMove={(event) =>
                  showTooltip("Dupla, 180 fokos forgatas kapcsolasa", event.clientX, event.clientY)
                }
                onPointerLeave={() => setFloatingTooltip(null)}
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
                  onFocus={(event) => showFocusedTooltip(moveTitle(face), event.currentTarget)}
                  onBlur={() => setFloatingTooltip(null)}
                  onPointerEnter={(event) => showTooltip(moveTitle(face), event.clientX, event.clientY)}
                  onPointerMove={(event) => showTooltip(moveTitle(face), event.clientX, event.clientY)}
                  onPointerLeave={() => setFloatingTooltip(null)}
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
                  onFocus={(event) => showFocusedTooltip(moveTitle(slice), event.currentTarget)}
                  onBlur={() => setFloatingTooltip(null)}
                  onPointerEnter={(event) => showTooltip(moveTitle(slice), event.clientX, event.clientY)}
                  onPointerMove={(event) => showTooltip(moveTitle(slice), event.clientX, event.clientY)}
                  onPointerLeave={() => setFloatingTooltip(null)}
                  onClick={() => runNotation(slice)}
                >
                  {slice}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {floatingTooltip ? (
          <div
            className="floating-tooltip"
            data-placement={floatingTooltip.placement}
            role="tooltip"
            style={{ left: floatingTooltip.x, top: floatingTooltip.y }}
          >
            {floatingTooltip.text}
          </div>
        ) : null}

        <section className="help-card" aria-label="Sugo">
          <div className="section-title">
            <HelpCircle size={18} />
            <h2>Sugo</h2>
          </div>
          {isHelpOpen ? (
            <>
              <p>{helpSteps[helpIndex]}</p>
              <div className="help-actions">
                <button type="button" onClick={() => setHelpIndex((index) => Math.max(0, index - 1))}>
                  Elozo
                </button>
                <button
                  type="button"
                  onClick={() => setHelpIndex((index) => Math.min(helpSteps.length - 1, index + 1))}
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
