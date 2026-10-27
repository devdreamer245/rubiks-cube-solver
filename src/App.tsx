import { useState, useEffect } from 'react';
import { FaceletState } from './core/types';
import { getSolvedCube, cloneCube, applyMoves } from './core/cube';
import { getScrambledCube } from './core/scrambler';
import { solveCube, SolverResult } from './core/solver';
import { Cube3D } from './components/Cube3D';
import { CubeNetEditor } from './components/CubeNetEditor';
import { PlaybackControls } from './components/PlaybackControls';
import { CameraScanner } from './components/CameraScanner';
import {
  Boxes,
  Github,
  Zap,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  Camera,
  Layers,
} from 'lucide-react';

export default function App() {
  // Current cube state being viewed/edited
  const [cubeState, setCubeState] = useState<FaceletState>(getSolvedCube);

  // Baseline state before solving (for step replay)
  const [baseState, setBaseState] = useState<FaceletState>(getSolvedCube);

  // Computed solution details
  const [solution, setSolution] = useState<SolverResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(600);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // Active view: 'manual' (3D + 2D Net) or 'camera' (Webcam scanner)
  const [viewMode, setViewMode] = useState<'manual' | 'camera'>('manual');

  // Autoplay timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isPlaying && solution && solution.solutionMoves.length > 0) {
      if (currentStep < solution.solutionMoves.length) {
        timer = setTimeout(() => {
          handleStepChange(currentStep + 1);
        }, playbackSpeed);
      } else {
        setIsPlaying(false);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStep, solution, playbackSpeed]);

  // Handle manual tile painting in 2D Net
  const handleStateChange = (newState: FaceletState) => {
    setCubeState(newState);
    setBaseState(cloneCube(newState));
    setSolution(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Quick Random WCA Scramble
  const handleScramble = () => {
    const { state } = getScrambledCube(22);
    setCubeState(state);
    setBaseState(cloneCube(state));
    setSolution(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Reset to clean solved cube
  const handleReset = () => {
    const solved = getSolvedCube();
    setCubeState(solved);
    setBaseState(cloneCube(solved));
    setSolution(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Solve Action
  const handleSolve = () => {
    setIsSolving(true);

    // Yield to UI thread to show spinner
    setTimeout(() => {
      const result = solveCube(cubeState);
      setSolution(result);
      setBaseState(cloneCube(cubeState));
      setCurrentStep(0);
      setIsSolving(false);

      if (result.success && result.solutionMoves.length > 0) {
        setIsPlaying(true);
      }
    }, 50);
  };

  // Step Navigation in Solution Playback
  const handleStepChange = (newStep: number) => {
    if (!solution || !solution.solutionMoves.length) return;

    setCurrentStep(newStep);

    // Reconstruct state at newStep by starting from baseState and applying slice of moves
    const reconstructed = cloneCube(baseState);
    if (newStep > 0) {
      const movesToApply = solution.solutionMoves.slice(0, newStep);
      applyMoves(reconstructed, movesToApply);
    }
    setCubeState(reconstructed);
  };

  const handleTogglePlay = () => {
    if (!solution) return;
    if (currentStep === solution.solutionMoves.length) {
      // Replay from start
      handleStepChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Callback when 6-face webcam scanning finishes
  const handleScanComplete = (scannedState: FaceletState) => {
    setCubeState(scannedState);
    setBaseState(cloneCube(scannedState));
    setSolution(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setViewMode('manual');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>Rubik's Solver 3D</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  v0.4.0
                </span>
              </h1>
            </div>
          </div>

          {/* Mode Switcher & GitHub Link */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D Solver</span>
              </button>

              <button
                onClick={() => setViewMode('camera')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'camera'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera Scan</span>
              </button>
            </div>

            <a
              href="https://github.com/devdreamer245/rubiks-cube-solver"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {viewMode === 'camera' ? (
          <div className="max-w-2xl mx-auto w-full">
            <CameraScanner
              onScanComplete={handleScanComplete}
              onCancel={() => setViewMode('manual')}
            />
          </div>
        ) : (
          <>
            {/* Solution Summary Banner (when solution exists) */}
            {solution?.success && solution.solutionMoves.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <span>Optimal Solution Found!</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                        {solution.moveCount} Moves
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Computed via Herbert Kociemba's Two-Phase Algorithm in{' '}
                      <span className="font-mono text-emerald-400 font-semibold">
                        {solution.solveTimeMs.toFixed(1)}ms
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{solution.solveTimeMs.toFixed(1)} ms</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>$\le 22$ Move Guarantee</span>
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 3D Visualizer & Playback Controls (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <Cube3D state={cubeState} />

                {/* Playback Controls (Active when solution exists) */}
                {solution?.success && solution.solutionMoves.length > 0 ? (
                  <PlaybackControls
                    solutionMoves={solution.solutionMoves}
                    currentStep={currentStep}
                    isPlaying={isPlaying}
                    onStepChange={handleStepChange}
                    onTogglePlay={handleTogglePlay}
                    playbackSpeed={playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                    onReset={() => handleStepChange(0)}
                  />
                ) : (
                  <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4 text-xs text-slate-400 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-300">How to use this solver:</p>
                      <p className="mt-1 leading-relaxed text-slate-400">
                        Use the 2D Net editor on the right or click{' '}
                        <button
                          onClick={() => setViewMode('camera')}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold underline decoration-indigo-400/30"
                        >
                          Camera Scan
                        </button>{' '}
                        to capture your physical cube. You can also click{' '}
                        <span className="text-indigo-300 font-semibold">Scramble</span> to test a random configuration.
                        Then click <span className="text-emerald-400 font-semibold">Solve Cube</span> to compute and watch
                        the 3D step-by-step solution.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: 2D Net Editor & Color Palette (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <CubeNetEditor
                  state={cubeState}
                  onChange={handleStateChange}
                  onSolve={handleSolve}
                  onScramble={handleScramble}
                  onReset={handleReset}
                  isSolving={isSolving}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Built as an open-source engineering portfolio project using React, TypeScript, Three.js, and Kociemba's Algorithm.</p>
        <p className="mt-1 text-slate-600 font-mono">MIT Licensed · Zero External API Latency · 100% Client-Side</p>
      </footer>
    </div>
  );
}
