import { describe, it, expect } from 'vitest';
import {
  getSolvedCube,
  applyMove,
  applyMoves,
  areCubesEqual,
  cloneCube,
  toFaceletString,
  fromFaceletString,
} from '../src/core/cube';
import { getScrambledCube } from '../src/core/scrambler';
import { ALL_MOVES, MOVE_INVERSES, Move } from '../src/core/types';

describe('Virtual Cube Engine - Mathematical Invariants', () => {
  it('initializes a clean solved cube with 54 facelets', () => {
    const cube = getSolvedCube();
    expect(cube.length).toBe(54);
    expect(toFaceletString(cube)).toBe(
      'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'
    );
  });

  it('verifies that 4 quarter turns return to the solved state (M^4 = I)', () => {
    const baseMoves: Move[] = ['U', 'D', 'R', 'L', 'F', 'B'];

    for (const move of baseMoves) {
      const cube = getSolvedCube();
      for (let i = 0; i < 4; i++) {
        applyMove(cube, move);
      }
      expect(
        areCubesEqual(cube, getSolvedCube()),
        `Move ${move}^4 failed to restore solved state`
      ).toBe(true);
    }
  });

  it('verifies that every move followed by its inverse returns to solved (M * M^-1 = I)', () => {
    for (const move of ALL_MOVES) {
      const cube = getSolvedCube();
      const inv = MOVE_INVERSES[move];

      applyMove(cube, move);
      expect(areCubesEqual(cube, getSolvedCube())).toBe(false);

      applyMove(cube, inv);
      expect(
        areCubesEqual(cube, getSolvedCube()),
        `Move ${move} followed by ${inv} failed to restore solved state`
      ).toBe(true);
    }
  });

  it('verifies that double turns have order 2 ((M2)^2 = I)', () => {
    const doubleMoves: Move[] = ['U2', 'D2', 'R2', 'L2', 'F2', 'B2'];

    for (const move of doubleMoves) {
      const cube = getSolvedCube();
      applyMove(cube, move);
      applyMove(cube, move);
      expect(areCubesEqual(cube, getSolvedCube())).toBe(true);
    }
  });

  it('verifies the famous "Sexy Move" order 6 invariant: (R U R\' U\')^6 = I', () => {
    const cube = getSolvedCube();
    const sexyMove = "R U R' U'";

    for (let i = 1; i <= 6; i++) {
      applyMoves(cube, sexyMove);
      if (i < 6) {
        expect(areCubesEqual(cube, getSolvedCube())).toBe(false);
      }
    }

    expect(areCubesEqual(cube, getSolvedCube())).toBe(true);
  });

  it('verifies the T-Permutation order 2 invariant: (T-Perm)^2 = I', () => {
    // T-Perm: R U R' U' R' F R2 U' R' U' R U R' F'
    const tPerm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    const cube = getSolvedCube();

    applyMoves(cube, tPerm);
    expect(areCubesEqual(cube, getSolvedCube())).toBe(false);

    applyMoves(cube, tPerm);
    expect(areCubesEqual(cube, getSolvedCube())).toBe(true);
  });

  it('supports round-trip string serialization', () => {
    const cube = getSolvedCube();
    applyMoves(cube, "R U R' U' F2 D B2");
    const serialized = toFaceletString(cube);
    const deserialized = fromFaceletString(serialized);
    expect(areCubesEqual(cube, deserialized)).toBe(true);
  });

  it('generates valid scrambles adhering to WCA non-redundancy rules', () => {
    const { state, scrambleMoves } = getScrambledCube(25);
    expect(scrambleMoves.length).toBe(25);
    expect(areCubesEqual(state, getSolvedCube())).toBe(false);

    // Verify no two consecutive moves share the same face
    for (let i = 1; i < scrambleMoves.length; i++) {
      const faceA = scrambleMoves[i - 1][0];
      const faceB = scrambleMoves[i][0];
      expect(faceA).not.toBe(faceB);
    }
  });
});

