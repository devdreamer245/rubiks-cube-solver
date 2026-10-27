import Cube from 'cubejs';
import { FaceletState, Move } from './types';
import { toFaceletString, applyMoves, areCubesEqual, getSolvedCube } from './cube';
import { validateCubeState } from './validator';

export interface SolverResult {
  success: boolean;
  solutionMoves: Move[];
  solutionString: string;
  moveCount: number;
  solveTimeMs: number;
  error?: string;
}

let isInitialized = false;

/**
 * Initializes Kociemba solver pruning tables.
 * Takes ~500ms on first run, subsequent calls are instantaneous.
 */
export function initializeSolver(): void {
  if (!isInitialized) {
    Cube.initSolver();
    isInitialized = true;
  }
}

/**
 * Solves any legal 54-facelet cube configuration using Kociemba's Two-Phase Algorithm.
 * Returns an optimal or near-optimal move sequence (typically 18-21 moves).
 */
export function solveCube(state: FaceletState): SolverResult {
  // 1. Pre-flight state validation
  const validation = validateCubeState(state);
  if (!validation.isValid) {
    return {
      success: false,
      solutionMoves: [],
      solutionString: '',
      moveCount: 0,
      solveTimeMs: 0,
      error: validation.error || 'Invalid cube state',
    };
  }

  // 2. Ensure solver tables are loaded
  const startTime = performance.now();
  initializeSolver();

  try {
    const faceletStr = toFaceletString(state);
    const cube = Cube.fromString(faceletStr);

    if (cube.isSolved()) {
      return {
        success: true,
        solutionMoves: [],
        solutionString: '',
        moveCount: 0,
        solveTimeMs: performance.now() - startTime,
      };
    }

    // Solve via Kociemba two-phase algorithm
    const solutionStr = cube.solve().trim();
    const solveTimeMs = performance.now() - startTime;

    const solutionMoves = solutionStr.split(/\s+/).filter(Boolean) as Move[];

    // 3. Mathematical Invariant Verification:
    // Verify that applying the proposed solution restores the cube to solved state
    const testCube = [...state];
    applyMoves(testCube, solutionMoves);
    if (!areCubesEqual(testCube, getSolvedCube())) {
      return {
        success: false,
        solutionMoves: [],
        solutionString: '',
        moveCount: 0,
        solveTimeMs,
        error: 'Solver returned a sequence that failed mathematical verification.',
      };
    }

    return {
      success: true,
      solutionMoves,
      solutionString: solutionStr,
      moveCount: solutionMoves.length,
      solveTimeMs,
    };
  } catch (err: any) {
    return {
      success: false,
      solutionMoves: [],
      solutionString: '',
      moveCount: 0,
      solveTimeMs: performance.now() - startTime,
      error: err?.message || 'Failed to compute solution',
    };
  }
}
