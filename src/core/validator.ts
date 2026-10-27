import { Face, FaceletState, CENTER_INDICES } from './types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  colorCounts?: Record<Face, number>;
}

/**
 * Standard 12 edge positions on the 54-facelet cube (Herbert Kociemba / cubejs convention).
 * Indices reference URFDLB ordered facelets:
 * U (0..8), R (9..17), F (18..26), D (27..35), L (36..44), B (45..53)
 */
export const EDGE_INDICES: [number, number][] = [
  [5, 10],  // UR: U6, R2
  [7, 19],  // UF: U8, F2
  [3, 37],  // UL: U4, L2
  [1, 46],  // UB: U2, B2
  [32, 16], // DR: D6, R8
  [28, 25], // DF: D2, F8
  [30, 43], // DL: D4, L8
  [34, 52], // DB: D8, B8
  [23, 12], // FR: F6, R4
  [21, 41], // FL: F4, L6
  [50, 39], // BL: B6, L4
  [48, 14], // BR: B4, R6
];

/**
 * Standard 8 corner positions on the 54-facelet cube (Herbert Kociemba / cubejs convention).
 */
export const CORNER_INDICES: [number, number, number][] = [
  [8, 9, 20],   // URF
  [6, 18, 38],  // UFL
  [0, 36, 47],  // ULB
  [2, 45, 11],  // UBR
  [29, 26, 15], // DFR
  [27, 44, 24], // DLF
  [33, 53, 42], // DBL
  [35, 17, 51], // DRB
];

/**
 * Opposite face mapping in standard URFDLB orientation
 */
const OPPOSITE_FACES: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  F: 'B',
  B: 'F',
};

/**
 * Validates a 54-facelet cube state thoroughly:
 * 1. Correct length (54)
 * 2. Exactly 9 of each color/facelet
 * 3. 6 unique centers
 * 4. 12 valid and unique edge pieces (no impossible combinations like U-D)
 * 5. 8 valid and unique corner pieces (no impossible combinations like U-D)
 */
export function validateCubeState(state: FaceletState): ValidationResult {
  // 1. Length check
  if (!state || state.length !== 54) {
    return {
      isValid: false,
      error: `Invalid facelet count: expected 54, got ${state?.length ?? 0}`,
    };
  }

  // 2. Count each facelet
  const counts: Record<Face, number> = {
    U: 0,
    R: 0,
    F: 0,
    D: 0,
    L: 0,
    B: 0,
  };

  for (let i = 0; i < 54; i++) {
    const f = state[i];
    if (!counts.hasOwnProperty(f)) {
      return {
        isValid: false,
        error: `Invalid facelet character '${f}' at index ${i}`,
      };
    }
    counts[f]++;
  }

  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const face of faces) {
    if (counts[face] !== 9) {
      return {
        isValid: false,
        error: `Face '${face}' has ${counts[face]} stickers (must be exactly 9).`,
        colorCounts: counts,
      };
    }
  }

  // 3. Center pieces must be unique
  const centers = [
    state[CENTER_INDICES.U],
    state[CENTER_INDICES.R],
    state[CENTER_INDICES.F],
    state[CENTER_INDICES.D],
    state[CENTER_INDICES.L],
    state[CENTER_INDICES.B],
  ];

  const uniqueCenters = new Set(centers);
  if (uniqueCenters.size !== 6) {
    return {
      isValid: false,
      error: 'Center pieces must all be unique. Check for duplicate center colors.',
    };
  }

  // Verify centers match their positions
  for (const face of faces) {
    if (state[CENTER_INDICES[face]] !== face) {
      return {
        isValid: false,
        error: `Center for face ${face} has unexpected sticker '${state[CENTER_INDICES[face]]}'.`,
      };
    }
  }

  // 4. Validate Edges
  const seenEdges = new Set<string>();
  for (const [i1, i2] of EDGE_INDICES) {
    const c1 = state[i1];
    const c2 = state[i2];

    if (c1 === c2) {
      return {
        isValid: false,
        error: `Invalid edge piece at indices [${i1}, ${i2}]: duplicate color '${c1}'.`,
      };
    }

    if (OPPOSITE_FACES[c1] === c2) {
      return {
        isValid: false,
        error: `Impossible edge piece at indices [${i1}, ${i2}]: opposite colors '${c1}' and '${c2}' cannot be adjacent.`,
      };
    }

    // Canonical representation for uniqueness
    const edgeKey = [c1, c2].sort().join('-');
    if (seenEdges.has(edgeKey)) {
      return {
        isValid: false,
        error: `Duplicate edge piece found with colors ${edgeKey} at indices [${i1}, ${i2}].`,
      };
    }
    seenEdges.add(edgeKey);
  }

  // 5. Validate Corners
  const seenCorners = new Set<string>();
  for (const [i1, i2, i3] of CORNER_INDICES) {
    const c1 = state[i1];
    const c2 = state[i2];
    const c3 = state[i3];

    if (c1 === c2 || c1 === c3 || c2 === c3) {
      return {
        isValid: false,
        error: `Invalid corner piece: duplicate colors at indices [${i1}, ${i2}, ${i3}].`,
      };
    }

    if (
      OPPOSITE_FACES[c1] === c2 ||
      OPPOSITE_FACES[c1] === c3 ||
      OPPOSITE_FACES[c2] === c3
    ) {
      return {
        isValid: false,
        error: `Impossible corner piece: opposite colors cannot touch on the same corner piece.`,
      };
    }

    const cornerKey = [c1, c2, c3].sort().join('-');
    if (seenCorners.has(cornerKey)) {
      return {
        isValid: false,
        error: `Duplicate corner piece found with colors ${cornerKey}.`,
      };
    }
    seenCorners.add(cornerKey);
  }

  return {
    isValid: true,
    colorCounts: counts,
  };
}
