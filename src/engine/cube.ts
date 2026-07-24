export type Axis = "x" | "y" | "z";
export type Face = "U" | "D" | "L" | "R" | "F" | "B";
export type Slice = "M" | "E" | "S";
export type MoveSymbol = Face | Slice;
export type MoveSuffix = "" | "'" | "2";
export type DirectionName = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export interface Vec3 {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
  z: -1 | 0 | 1;
}

export interface Sticker {
  normal: Vec3;
  color: string;
}

export interface Cubie {
  id: string;
  position: Vec3;
  stickers: Sticker[];
}

export interface CubeState {
  cubies: Cubie[];
}

export interface Move {
  face: MoveSymbol;
  suffix: MoveSuffix;
}

export interface MoveDefinition {
  axis: Axis;
  layer: -1 | 0 | 1;
  turns: -2 | -1 | 1 | 2;
}

const DIRECTIONS: Record<DirectionName, Vec3> = {
  "+x": { x: 1, y: 0, z: 0 },
  "-x": { x: -1, y: 0, z: 0 },
  "+y": { x: 0, y: 1, z: 0 },
  "-y": { x: 0, y: -1, z: 0 },
  "+z": { x: 0, y: 0, z: 1 },
  "-z": { x: 0, y: 0, z: -1 }
};

export const FACE_COLORS: Record<DirectionName, string> = {
  "+x": "#d92727",
  "-x": "#f97316",
  "+y": "#f8fafc",
  "-y": "#f6d32d",
  "+z": "#2f7df6",
  "-z": "#27a844"
};

const BASE_MOVES: Record<MoveSymbol, Omit<MoveDefinition, "turns"> & { baseTurns: -1 | 1 }> = {
  R: { axis: "x", layer: 1, baseTurns: -1 },
  L: { axis: "x", layer: -1, baseTurns: 1 },
  M: { axis: "x", layer: 0, baseTurns: 1 },
  U: { axis: "y", layer: 1, baseTurns: -1 },
  D: { axis: "y", layer: -1, baseTurns: 1 },
  E: { axis: "y", layer: 0, baseTurns: 1 },
  F: { axis: "z", layer: 1, baseTurns: -1 },
  B: { axis: "z", layer: -1, baseTurns: 1 },
  S: { axis: "z", layer: 0, baseTurns: -1 }
};

export const MOVE_FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
export const MOVE_SLICES: Slice[] = ["M", "E", "S"];
export const MOVE_SYMBOLS: MoveSymbol[] = [...MOVE_FACES, ...MOVE_SLICES];

function directionOf(vec: Vec3): DirectionName {
  if (vec.x === 1) return "+x";
  if (vec.x === -1) return "-x";
  if (vec.y === 1) return "+y";
  if (vec.y === -1) return "-y";
  if (vec.z === 1) return "+z";
  return "-z";
}

function asCoord(value: number): -1 | 0 | 1 {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function clampTurn(turns: number): -2 | -1 | 1 | 2 {
  const normalized = ((((turns % 4) + 4) % 4) || 4) as 1 | 2 | 3 | 4;
  if (normalized === 1) return 1;
  if (normalized === 2) return 2;
  if (normalized === 3) return -1;
  return -2;
}

export function parseMove(notation: string): Move {
  const match = notation.trim().match(/^([UDLRFBMES])(['2]?)$/);
  if (!match) {
    throw new Error(`Invalid move notation: ${notation}`);
  }
  return {
    face: match[1] as MoveSymbol,
    suffix: match[2] as MoveSuffix
  };
}

export function formatMove(move: Move): string {
  return `${move.face}${move.suffix}`;
}

export function invertMove(move: Move): Move {
  if (move.suffix === "2") return move;
  return { face: move.face, suffix: move.suffix === "'" ? "" : "'" };
}

export function moveToDefinition(move: Move): MoveDefinition {
  const base = BASE_MOVES[move.face];
  const suffixMultiplier = move.suffix === "2" ? 2 : move.suffix === "'" ? -1 : 1;
  return {
    axis: base.axis,
    layer: base.layer,
    turns: clampTurn(base.baseTurns * suffixMultiplier)
  };
}

function rotateOnce(vec: Vec3, axis: Axis, turn: -1 | 1): Vec3 {
  if (axis === "x") {
    return turn === 1
      ? { x: vec.x, y: asCoord(-vec.z), z: asCoord(vec.y) }
      : { x: vec.x, y: asCoord(vec.z), z: asCoord(-vec.y) };
  }
  if (axis === "y") {
    return turn === 1
      ? { x: asCoord(vec.z), y: vec.y, z: asCoord(-vec.x) }
      : { x: asCoord(-vec.z), y: vec.y, z: asCoord(vec.x) };
  }
  return turn === 1
    ? { x: asCoord(-vec.y), y: asCoord(vec.x), z: vec.z }
    : { x: asCoord(vec.y), y: asCoord(-vec.x), z: vec.z };
}

export function rotateVec(vec: Vec3, axis: Axis, turns: -2 | -1 | 1 | 2): Vec3 {
  const step = turns > 0 ? 1 : -1;
  const count = Math.abs(turns);
  let next = vec;
  for (let index = 0; index < count; index += 1) {
    next = rotateOnce(next, axis, step);
  }
  return next;
}

export function createSolvedCube(): CubeState {
  const cubies: Cubie[] = [];
  for (const x of [-1, 0, 1] as const) {
    for (const y of [-1, 0, 1] as const) {
      for (const z of [-1, 0, 1] as const) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position: Vec3 = { x, y, z };
        const stickers = (Object.entries(DIRECTIONS) as Array<[DirectionName, Vec3]>)
          .filter(([, normal]) => {
            if (normal.x !== 0) return normal.x === x;
            if (normal.y !== 0) return normal.y === y;
            return normal.z === z;
          })
          .map(([direction, normal]) => ({
            normal,
            color: FACE_COLORS[direction]
          }));
        cubies.push({ id: `${x},${y},${z}`, position, stickers });
      }
    }
  }
  return { cubies };
}

export function applyMove(cube: CubeState, move: Move): CubeState {
  const definition = moveToDefinition(move);
  return {
    cubies: cube.cubies.map((cubie) => {
      const stickers = cubie.stickers.map((sticker) => ({ ...sticker, normal: { ...sticker.normal } }));
      if (cubie.position[definition.axis] !== definition.layer) {
        return { ...cubie, position: { ...cubie.position }, stickers };
      }
      return {
        ...cubie,
        position: rotateVec(cubie.position, definition.axis, definition.turns),
        stickers: stickers.map((sticker) => ({
          ...sticker,
          normal: rotateVec(sticker.normal, definition.axis, definition.turns)
        }))
      };
    })
  };
}

export function applyMoves(cube: CubeState, moves: Move[]): CubeState {
  return moves.reduce((state, move) => applyMove(state, move), cube);
}

export function serializeCube(cube: CubeState): string {
  return cube.cubies
    .map((cubie) => {
      const stickers = cubie.stickers
        .map((sticker) => `${directionOf(sticker.normal)}:${sticker.color}`)
        .sort()
        .join("|");
      return `${cubie.id}@${cubie.position.x},${cubie.position.y},${cubie.position.z}[${stickers}]`;
    })
    .sort()
    .join("\n");
}

export function isSolved(cube: CubeState): boolean {
  return cube.cubies.every((cubie) =>
    cubie.stickers.every((sticker) => FACE_COLORS[directionOf(sticker.normal)] === sticker.color)
  );
}

export function generateScramble(length = 22): Move[] {
  const moves: Move[] = [];
  let previousFace: Face | null = null;
  const suffixes: MoveSuffix[] = ["", "'", "2"];
  while (moves.length < length) {
    const face = MOVE_FACES[Math.floor(Math.random() * MOVE_FACES.length)];
    if (face === previousFace) continue;
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    moves.push({ face, suffix });
    previousFace = face;
  }
  return moves;
}

export function normalToDirection(normal: Vec3): DirectionName {
  return directionOf(normal);
}
