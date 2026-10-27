import { Move, Face, FaceletState } from './types';
import { getSolvedCube, applyMoves } from './cube';

const OPPOSITE_FACES: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  F: 'B',
  B: 'F',
};

const MODIFIERS = ['', "'", '2'] as const;

/**
 * Generates an official WCA-style random scramble sequence.
 * Enforces speedcubing scramble rules:
 * 1. Consecutive moves on the same face are prohibited (e.g. no "R R").
 * 2. Consecutive moves on opposite faces cannot cancel/commute redundantly (e.g. no "R L R").
 */
export function generateScramble(length: number = 20): Move[] {
  const scramble: Move[] = [];
  const faces: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];

  let lastFace: Face | null = null;
  let secondLastFace: Face | null = null;

  for (let i = 0; i < length; i++) {
    const validFaces = faces.filter((face) => {
      // Rule 1: No two consecutive moves on the same face
      if (face === lastFace) return false;

      // Rule 2: If last two moves are on opposite faces, the third cannot be on the same axis
      if (lastFace && secondLastFace && face === secondLastFace) {
        if (OPPOSITE_FACES[lastFace] === secondLastFace) {
          return false;
        }
      }

      return true;
    });

    const chosenFace = validFaces[Math.floor(Math.random() * validFaces.length)];
    const chosenModifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    const move = `${chosenFace}${chosenModifier}` as Move;

    scramble.push(move);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scramble;
}

/**
 * Creates a randomly scrambled cube state.
 */
export function getScrambledCube(scrambleLength: number = 20): {
  state: FaceletState;
  scrambleMoves: Move[];
} {
  const cube = getSolvedCube();
  const scrambleMoves = generateScramble(scrambleLength);
  applyMoves(cube, scrambleMoves);
  return { state: cube, scrambleMoves };
}
