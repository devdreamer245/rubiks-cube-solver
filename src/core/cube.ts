import Cube from 'cubejs';
import { FaceletState, Move } from './types';

/**
 * Creates a brand new solved 54-facelet cube state.
 * Returns an array of 54 characters in URFDLB order.
 */
export function getSolvedCube(): FaceletState {
  const solved = new Cube().asString();
  return fromFaceletString(solved);
}

/**
 * Applies a single WCA move (e.g. U, R', F2) to a 54-facelet state (mutates in-place).
 */
export function applyMove(state: FaceletState, move: Move): void {
  const str = toFaceletString(state);
  const cube = Cube.fromString(str);
  cube.move(move);
  const result = fromFaceletString(cube.asString());
  for (let i = 0; i < 54; i++) {
    state[i] = result[i];
  }
}

/**
 * Applies a sequence of moves (e.g. "R U R' U'") to a 54-facelet state.
 */
export function applyMoves(state: FaceletState, moves: string | Move[]): void {
  const moveStr = Array.isArray(moves) ? moves.join(' ') : moves;
  if (!moveStr.trim()) return;

  const str = toFaceletString(state);
  const cube = Cube.fromString(str);
  cube.move(moveStr);
  const result = fromFaceletString(cube.asString());
  for (let i = 0; i < 54; i++) {
    state[i] = result[i];
  }
}

/**
 * Converts a 54-facelet array into a flat 54-character string (Kociemba format).
 */
export function toFaceletString(state: FaceletState): string {
  return state.join('');
}

/**
 * Parses a 54-character string into a FaceletState array.
 */
export function fromFaceletString(str: string): FaceletState {
  if (str.length !== 54) {
    throw new Error(`Invalid facelet string length: expected 54, got ${str.length}`);
  }
  return str.split('') as FaceletState;
}

/**
 * Checks if two cube states are identical.
 */
export function areCubesEqual(a: FaceletState, b: FaceletState): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Clones a cube state.
 */
export function cloneCube(state: FaceletState): FaceletState {
  return [...state];
}
