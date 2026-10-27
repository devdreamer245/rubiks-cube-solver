import { describe, it, expect } from 'vitest';
import { validateCubeState } from '../src/core/validator';
import { getSolvedCube, applyMoves, cloneCube } from '../src/core/cube';
import { getScrambledCube } from '../src/core/scrambler';

describe('Cube State Validator', () => {
  it('validates a solved cube state successfully', () => {
    const cube = getSolvedCube();
    const result = validateCubeState(cube);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('validates randomly scrambled legal cubes successfully', () => {
    for (let i = 0; i < 10; i++) {
      const { state, scrambleMoves } = getScrambledCube(25);
      const result = validateCubeState(state);
      if (!result.isValid) {
        console.error('Validation failed for scramble:', scrambleMoves.join(' '), 'Error:', result.error);
      }
      expect(result.isValid, result.error).toBe(true);
    }
  });

  it('rejects an invalid sticker count (e.g. 10 U and 8 D)', () => {
    const cube = getSolvedCube();
    cube[27] = 'U'; // Change one D sticker to U (now 10 U, 8 D)
    const result = validateCubeState(cube);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("must be exactly 9");
  });

  it('rejects a state with altered center pieces', () => {
    const cube = getSolvedCube();
    cube[4] = 'D'; // Change U center to D
    cube[31] = 'U'; // Swap D center to U
    const result = validateCubeState(cube);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Center for face");
  });

  it('rejects an impossible edge with opposite colors (e.g. U and D)', () => {
    const cube = getSolvedCube();
    // Edge UB is at [1, 46]. In solved state, 1='U', 46='B'.
    // Change 46 to 'D' (so edge is U-D, which cannot exist physically)
    // To preserve counts, swap with a D sticker somewhere else
    cube[46] = 'D';
    cube[35] = 'B';
    const result = validateCubeState(cube);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("opposite colors");
  });

  it('rejects an impossible corner with opposite colors (e.g. U and D on same corner)', () => {
    const cube = getSolvedCube();
    // Corner UBL is [0, 36, 47] ('U', 'L', 'B')
    // Change 47 ('B') to 'D'
    cube[47] = 'D';
    cube[35] = 'B'; // swap to balance counts
    const result = validateCubeState(cube);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("opposite colors cannot touch");
  });
});
