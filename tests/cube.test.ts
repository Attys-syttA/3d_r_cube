import { describe, expect, it } from "vitest";
import {
  applyMove,
  applyMoves,
  createSolvedCube,
  generateScramble,
  invertMove,
  isSolved,
  MOVE_SYMBOLS,
  parseMove,
  serializeCube
} from "../src/engine/cube";

describe("cube move engine", () => {
  it("returns to the original state after four quarter turns on any face", () => {
    const solved = createSolvedCube();
    for (const face of MOVE_SYMBOLS) {
      const moved = applyMoves(solved, [0, 1, 2, 3].map(() => ({ face, suffix: "" })));
      expect(serializeCube(moved), face).toBe(serializeCube(solved));
    }
  });

  it("cancels a move with its inverse", () => {
    const solved = createSolvedCube();
    for (const face of MOVE_SYMBOLS) {
      const move = { face, suffix: "" } as const;
      const moved = applyMoves(solved, [move, invertMove(move)]);
      expect(serializeCube(moved), face).toBe(serializeCube(solved));
    }
  });

  it("treats a double turn as two quarter turns", () => {
    const solved = createSolvedCube();
    for (const notation of ["R", "M", "E", "S"]) {
      expect(serializeCube(applyMove(solved, parseMove(`${notation}2`))), notation).toBe(
        serializeCube(applyMoves(solved, [parseMove(notation), parseMove(notation)]))
      );
    }
  });

  it("keeps a scramble reversible and non-solved", () => {
    const solved = createSolvedCube();
    const scramble = generateScramble(30);
    const scrambled = applyMoves(solved, scramble);
    const reversed = applyMoves(scrambled, scramble.toReversed().map(invertMove));

    expect(isSolved(scrambled)).toBe(false);
    expect(serializeCube(reversed)).toBe(serializeCube(solved));
  });

  it("rejects invalid notation", () => {
    expect(() => parseMove("X")).toThrow("Invalid move notation");
  });
});
