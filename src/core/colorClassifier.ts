import { Face } from './types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

/**
 * Converts RGB [0..255] to HSV
 */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s,
    v,
  };
}

/**
 * Classifies a raw RGB sample into one of the 6 Rubik's Cube faces:
 * U (White), R (Red), F (Green), D (Yellow), L (Orange), B (Blue).
 *
 * Uses Hue, Saturation, and Value thresholds to reliably distinguish:
 * - White: low saturation (s < 0.25) and high value (v > 0.40)
 * - Yellow: hue 42..75, high saturation
 * - Green: hue 75..165
 * - Blue: hue 170..260
 * - Orange: hue 10..42
 * - Red: hue > 340 or < 10
 */
export function classifyColorHSV(rgb: RGB): Face {
  const { h, s, v } = rgbToHsv(rgb.r, rgb.g, rgb.b);

  // 1. White detection: low color saturation and decent brightness
  if (s < 0.28 && v > 0.35) {
    return 'U';
  }

  // 2. High brightness yellow check (sometimes washed out)
  if (h >= 45 && h <= 75) {
    return 'D'; // Yellow
  }

  // 3. Green
  if (h > 75 && h <= 165) {
    return 'F'; // Green
  }

  // 4. Blue
  if (h > 165 && h <= 265) {
    return 'B'; // Blue
  }

  // 5. Orange vs Red
  if (h > 12 && h < 45) {
    return 'L'; // Orange
  }

  // 6. Red (wraps around 0/360 degrees)
  return 'R'; // Red
}
