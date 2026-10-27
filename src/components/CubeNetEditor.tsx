import React from 'react';
import { Face, FaceletState } from '../core/types';
import { validateCubeState } from '../core/validator';
import { sound } from '../utils/audio';
import { CheckCircle2, AlertTriangle, RotateCcw, Sparkles, Flame } from 'lucide-react';

interface CubeNetEditorProps {
  state: FaceletState;
  onChange: (newState: FaceletState) => void;
  onSolve: () => void;
  onScramble: (length?: number) => void;
  onReset: () => void;
  isSolving?: boolean;
}

// Visual hex codes matching standard WCA colors
export const COLOR_HEX: Record<Face, string> = {
  U: '#f8fafc', // White
  R: '#dc2626', // Red
  F: '#16a34a', // Green
  D: '#eab308', // Yellow
  L: '#ea580c', // Orange
  B: '#2563eb', // Blue
};

export const COLOR_NAMES: Record<Face, string> = {
  U: 'White (Up)',
  R: 'Red (Right)',
  F: 'Green (Front)',
  D: 'Yellow (Down)',
  L: 'Orange (Left)',
  B: 'Blue (Back)',
};

// Face offsets in the 54-facelet array:
// U: 0, R: 9, F: 18, D: 27, L: 36, B: 45
const FACE_OFFSETS: Record<Face, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};

export const CubeNetEditor: React.FC<CubeNetEditorProps> = ({
  state,
  onChange,
  onSolve,
  onScramble,
  onReset,
  isSolving = false,
}) => {
  const [selectedColor, setSelectedColor] = React.useState<Face>('U');
  const [scrambleDifficulty, setScrambleDifficulty] = React.useState<number>(20);

  const validation = React.useMemo(() => validateCubeState(state), [state]);

  // Count occurrences of each color
  const counts = React.useMemo(() => {
    const c: Record<Face, number> = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    for (const f of state) {
      if (c[f] !== undefined) c[f]++;
    }
    return c;
  }, [state]);

  const handleTileClick = (faceletIndex: number) => {
    // Check if it's a center piece (centers are fixed to keep coordinate frame intact)
    const isCenter = [4, 13, 22, 31, 40, 49].includes(faceletIndex);
    if (isCenter) return;

    sound.playTurn();
    const nextState = [...state];
    nextState[faceletIndex] = selectedColor;
    onChange(nextState);
  };

  const renderFaceGrid = (face: Face, label: string) => {
    const offset = FACE_OFFSETS[face];
    const tiles = [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = offset + r * 3 + c;
        const colorFace = state[idx];
        const isCenter = r === 1 && c === 1;

        tiles.push(
          <button
            key={idx}
            onClick={() => handleTileClick(idx)}
            disabled={isCenter}
            title={isCenter ? `${label} Center (Fixed)` : `Click to paint ${label} tile`}
            style={{ backgroundColor: COLOR_HEX[colorFace] }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] border border-black/30 transition-transform active:scale-95 shadow-sm relative flex items-center justify-center font-bold text-[10px] text-slate-800 ${
              isCenter ? 'ring-2 ring-white/50 cursor-not-allowed opacity-90' : 'hover:brightness-110 cursor-pointer'
            }`}
          >
            {isCenter && <span className="opacity-70 text-[9px] uppercase">{face}</span>}
          </button>
        );
      }
    }

    return (
      <div className="flex flex-col items-center p-1.5 bg-slate-900/60 rounded-lg border border-slate-800/80 shadow-md">
        <span className="text-[11px] font-semibold text-slate-400 mb-1 tracking-wider uppercase">{label}</span>
        <div className="grid grid-cols-3 gap-1">{tiles}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur">
      {/* Header and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>2D Cube State Editor</span>
          </h2>
          <p className="text-xs text-slate-400">Click a color palette, then tap any tile to set its color.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Gamified Scramble Difficulty */}
          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => {
                sound.playTurn();
                setScrambleDifficulty(7);
                onScramble(7);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                scrambleDifficulty === 7
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Warmup Scramble (7 moves)"
            >
              Easy
            </button>
            <button
              onClick={() => {
                sound.playTurn();
                setScrambleDifficulty(15);
                onScramble(15);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                scrambleDifficulty === 15
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pro Scramble (15 moves)"
            >
              Pro
            </button>
            <button
              onClick={() => {
                sound.playTurn();
                setScrambleDifficulty(22);
                onScramble(22);
              }}
              className={`px-2 py-1 rounded-lg transition ${
                scrambleDifficulty === 22
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="WCA Championship Scramble (22 moves)"
            >
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>WCA</span>
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playTurn();
              onReset();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Reset cube to solved state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Color Palette Selector */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Paint:</span>
          {(['U', 'R', 'F', 'D', 'L', 'B'] as Face[]).map((f) => {
            const isSelected = selectedColor === f;
            const count = counts[f];
            const isFull = count === 9;

            return (
              <button
                key={f}
                onClick={() => setSelectedColor(f)}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${
                  isSelected
                    ? 'ring-2 ring-indigo-400 border-indigo-400/80 scale-105 bg-slate-800'
                    : 'border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-[3px] border border-black/40 shadow-sm"
                  style={{ backgroundColor: COLOR_HEX[f] }}
                />
                <span
                  className={`text-[11px] font-mono font-bold ${
                    isFull ? 'text-emerald-400' : count > 9 ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  {count}/9
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unfolded 2D Cube Net Layout */}
      <div className="py-4 flex flex-col items-center justify-center select-none overflow-x-auto">
        <div className="flex flex-col items-center gap-1.5">
          {/* Top Face: Up (U) */}
          <div className="flex justify-center">
            {renderFaceGrid('U', 'Up (White)')}
          </div>

          {/* Middle Row: Left (L), Front (F), Right (R), Back (B) */}
          <div className="flex items-center gap-1.5">
            {renderFaceGrid('L', 'Left (Orange)')}
            {renderFaceGrid('F', 'Front (Green)')}
            {renderFaceGrid('R', 'Right (Red)')}
            {renderFaceGrid('B', 'Back (Blue)')}
          </div>

          {/* Bottom Face: Down (D) */}
          <div className="flex justify-center">
            {renderFaceGrid('D', 'Down (Yellow)')}
          </div>
        </div>
      </div>

      {/* Validation Status & Solve Action */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          {validation.isValid ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">Valid Cube State — Ready to solve</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/50">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-medium truncate max-w-[280px] sm:max-w-[340px]" title={validation.error}>
                {validation.error}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onSolve}
          disabled={!validation.isValid || isSolving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition active:scale-95 ${
            validation.isValid && !isSolving
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSolving ? 'Solving...' : 'Solve Cube'}</span>
        </button>
      </div>
    </div>
  );
};
