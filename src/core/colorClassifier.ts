import { Face } from './types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

/**
 * Converts sRGB [0..255] to CIE-L*a*b* color space.
 * CIE-Lab is designed to approximate human vision:
 * - L*: Lightness (0 = black, 100 = white)
 * - a*: Green (-) to Red (+)
 * - b*: Blue (-) to Yellow (+)
 */
export function rgbToLab(rgb: RGB): Lab {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Inverse sRGB companding
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to CIE XYZ (D65 illuminant standard)
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  return {
    L: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * CIE76 Delta-E perceptual color difference formula.
 * Computes Euclidean distance in CIE-Lab color space.
 */
export function deltaE(c1: Lab, c2: Lab): number {
  return Math.sqrt(
    Math.pow(c1.L - c2.L, 2) +
    Math.pow(c1.a - c2.a, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Standard reference colors in Lab space for typical Rubik's cubes under webcam lighting.
 */
export const DEFAULT_LAB_REFERENCES: Record<Face, Lab> = {
  U: rgbToLab({ r: 240, g: 240, b: 245 }), // White: high L, near zero a & b
  D: rgbToLab({ r: 235, g: 215, b: 20 }),  // Yellow: high L, negative a, strong positive b
  R: rgbToLab({ r: 200, g: 25, b: 25 }),   // Red: moderate L, strong positive a, positive b
  L: rgbToLab({ r: 245, g: 110, b: 20 }),  // Orange: moderate-high L, positive a, strong positive b
  F: rgbToLab({ r: 20, g: 165, b: 45 }),   // Green: moderate L, strong negative a, moderate b
  B: rgbToLab({ r: 15, g: 85, b: 205 }),   // Blue: moderate L, positive a, strong negative b
};

/**
 * Classifies an RGB sample to the closest Rubik's Cube face using CIE-Lab Delta-E distance.
 * If calibrated center references are available, it uses them for exact lighting matching.
 */
export function classifyColor(rgb: RGB, customReferences?: Partial<Record<Face, RGB>>): Face {
  const sampleLab = rgbToLab(rgb);

  let bestFace: Face = 'U';
  let minDistance = Infinity;

  const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  for (const face of faces) {
    const targetLab = customReferences?.[face]
      ? rgbToLab(customReferences[face]!)
      : DEFAULT_LAB_REFERENCES[face];

    const dist = deltaE(sampleLab, targetLab);
    if (dist < minDistance) {
      minDistance = dist;
      bestFace = face;
    }
  }

  return bestFace;
}
