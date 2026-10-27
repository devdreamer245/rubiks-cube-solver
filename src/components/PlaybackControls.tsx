import React from 'react';
import { Move } from '../core/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from 'lucide-react';

interface PlaybackControlsProps {
  solutionMoves: Move[];
  currentStep: number;
  isPlaying: boolean;
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  playbackSpeed: number; // in ms
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  solutionMoves,
  currentStep,
  isPlaying,
  onStepChange,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
}) => {
  const totalSteps = solutionMoves.length;

  if (totalSteps === 0) return null;

  return (
    <div className="flex flex-col bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur mt-4">
      {/* Top Bar: Progress and Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Solution Progress
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 mr-1">Speed:</span>
          {[
            { label: '0.5x', speed: 1200 },
            { label: '1x', speed: 600 },
            { label: '2x', speed: 300 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onSpeedChange(item.speed)}
              className={`px-2 py-0.5 text-xs rounded font-medium transition ${
                playbackSpeed === item.speed
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Move Timeline Carousel */}
      <div className="py-3 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <button
          onClick={() => onStepChange(0)}
          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
            currentStep === 0
              ? 'bg-slate-800 text-white border-slate-600 shadow'
              : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300'
          }`}
        >
          Start
        </button>

        {solutionMoves.map((m, idx) => {
          const stepNum = idx + 1;
          const isCurrent = currentStep === stepNum;
          const isPassed = currentStep > stepNum;

          return (
            <button
              key={idx}
              onClick={() => onStepChange(stepNum)}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition active:scale-95 ${
                isCurrent
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20 scale-105'
                  : isPassed
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                  : 'bg-slate-900/50 text-slate-500 border-slate-800/80 hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Navigation Controls Bar */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-3">
        <button
          onClick={() => onStepChange(0)}
          disabled={currentStep === 0}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Jump to Start"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{currentStep === totalSteps ? 'Replay' : 'Auto Play'}</span>
            </>
          )}
        </button>

        <button
          onClick={() => onStepChange(Math.min(totalSteps, currentStep + 1))}
          disabled={currentStep === totalSteps}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onStepChange(totalSteps)}
          disabled={currentStep === totalSteps}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Jump to Solved State"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
