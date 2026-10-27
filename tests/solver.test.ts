import { describe, it, expect, beforeAll } from 'vitest';
import { solveCube, initializeSolver } from '../src/core/solver';
import { getSolvedCube, applyMoves, areCubesEqual } from '../src/core/cube';
import { getScrambledCube } from '../src/core/scrambler';

describe('Kociemba Two-Phase Solver', () => {
  beforeAll(() => {
    // Pre-initialize solver lookup tables
    initializeSolver();
  });

  it('returns an empty solution for an already solved cube', () => {
    const cube = getSolvedCube();
    const result = solveCube(cube);
    expect(result.success).toBe(true);
    expect(result.moveCount).toBe(0);
    expect(result.solutionMoves.length).toBe(0);
  });

  it('solves a simple short scramble and satisfies the invariant', () => {
    const cube = getSolvedCube();
    applyMoves(cube, "R U R' U'");
    const result = solveCube(cube);

    expect(result.success).toBe(true);
    expect(result.moveCount).toBeGreaterThan(0);
    expect(result.moveCount).toBeLessThanOrEqual(22);

    // Invariant test
    applyMoves(cube, result.solutionMoves);
    expect(areCubesEqual(cube, getSolvedCube())).toBe(true);
  });

  it('solves 5 complex 25-move WCA scrambles in milliseconds with <= 22 moves', () => {
    for (let i = 0; i < 5; i++) {
      const { state, scrambleMoves } = getScrambledCube(25);
      const result = solveCube(state);

      expect(result.success, `Failed to solve scramble: ${scrambleMoves.join(' ')}`).toBe(true);
      expect(result.moveCount).toBeLessThanOrEqual(22);
      expect(result.solveTimeMs).toBeLessThan(1000); // Solves in under 1 second

      // Invariant verification
      applyMoves(state, result.solutionMoves);
      expect(areCubesEqual(state, getSolvedCube())).toBe(true);
    }
  });

  it('rejects an illegal state with descriptive error', () => {
    const cube = getSolvedCube();
    cube[0] = 'D'; // Corrupt one sticker
    cube[35] = 'U';
    // Now corner 0 (UBL) has impossible color combination
    const result = solveCube(cube);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
