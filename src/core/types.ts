/**
 * Rubik's Cube Face identifiers
 * Standard convention: U (Up), R (Right), F (Front), D (Down), L (Left), B (Back)
 */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/**
 * Standard WCA color scheme matching face centers:
 * U: White, R: Red, F: Green, D: Yellow, L: Orange, B: Blue
 */
export type CubeColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

export const FACE_COLORS: Record<Face, CubeColor> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

export const COLOR_TO_FACE: Record<CubeColor, Face> = {
  white: 'U',
  red: 'R',
  green: 'F',
  yellow: 'D',
  orange: 'L',
  blue: 'B',
};

/**
 * Standard Facelet indices (0 to 53) in Kociemba URFDLB order:
 * U1..U9 (0..8)
 * R1..R9 (9..17)
 * F1..F9 (18..26)
 * D1..D9 (27..35)
 * L1..L9 (36..44)
 * B1..B9 (45..53)
 */
export type Facelet = Face;
export type FaceletState = Facelet[]; // Array of 54 facelets

/**
 * Valid Rubik's Cube face turns (WCA notation)
 */
export type Move =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2';

export const ALL_MOVES: Move[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
];

/**
 * Inverse mapping for each move (e.g. U -> U', U2 -> U2, U' -> U)
 */
export const MOVE_INVERSES: Record<Move, Move> = {
  'U': "U'", "U'": 'U', 'U2': 'U2',
  'D': "D'", "D'": 'D', 'D2': 'D2',
  'F': "F'", "F'": 'F', 'F2': 'F2',
  'B': "B'", "B'": 'B', 'B2': 'B2',
  'L': "L'", "L'": 'L', 'L2': 'L2',
  'R': "R'", "R'": 'R', 'R2': 'R2',
};

/**
 * Center piece indices for each face in the 54-facelet array
 */
export const CENTER_INDICES: Record<Face, number> = {
  U: 4,
  R: 13,
  F: 22,
  D: 31,
  L: 40,
  B: 49,
};
