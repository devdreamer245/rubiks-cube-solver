import { useState, useEffect } from 'react';
import { FaceletState } from './core/types';
import { getSolvedCube, cloneCube, applyMoves } from './core/cube';
import { getScrambledCube } from './core/scrambler';
import { solveCube, SolverResult } from './core/solver';
import { Cube3D } from './components/Cube3D';
import { CubeNetEditor } from './components/CubeNetEditor';
import { PlaybackControls } from './components/PlaybackControls';
import { CameraScanner } from './components/CameraScanner';
import { sound } from './utils/audio';
import { fireConfetti } from './utils/confetti';
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
  Volume2,
  VolumeX,
  Trophy,
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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active view: 'manual' (3D + 2D Net) or 'camera' (Webcam scanner)
  const [viewMode, setViewMode] = useState<'manual' | 'camera'>('manual');

  // Toggle sound
  const toggleSound = () => {
    const next = !soundEnabled;
    sound.enabled = next;
    setSoundEnabled(next);
  };

  // Autoplay timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isPlaying && solution && solution.solutionMoves.length > 0) {
      if (currentStep < solution.solutionMoves.length) {
        timer = setTimeout(() => {
          sound.playTurn();
          const nextStep = currentStep + 1;
          handleStepChange(nextStep);

          // If reached final step, celebrate with confetti & fanfare!
          if (nextStep === solution.solutionMoves.length) {
            setIsPlaying(false);
            sound.playVictory();
            fireConfetti();
          }
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
  const handleScramble = (length: number = 20) => {
    const { state } = getScrambledCube(length);
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
    sound.playTurn();

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

    // If stepped to the end manually, celebrate
    if (newStep === solution.solutionMoves.length) {
      sound.playVictory();
      fireConfetti();
    }
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
    sound.playVictory();
  };

  // Gamified Rank Calculator based on Move Count
  const getEfficiencyBadge = (moves: number) => {
    if (moves <= 18) {
      return { rank: 'S+', title: 'God Tier Optimal', color: 'from-amber-400 to-rose-500 text-amber-200' };
    }
    if (moves <= 20) {
      return { rank: 'S', title: "God's Number Range", color: 'from-emerald-400 to-teal-500 text-emerald-200' };
    }
    return { rank: 'A', title: 'Speedcuber Pro', color: 'from-indigo-400 to-cyan-500 text-indigo-200' };
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>Rubik's Solver 3D</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                  v0.5.0
                </span>
              </h1>
            </div>
          </div>

          {/* Mode Switcher, Sound & GitHub Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
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
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Camera Scan</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-slate-900 text-indigo-400 border-indigo-500/40 hover:bg-slate-800'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <a
              href="https://github.com/devdreamer245/rubiks-cube-solver"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative z-10">
        {viewMode === 'camera' ? (
          <div className="max-w-2xl mx-auto w-full">
            <CameraScanner
              onScanComplete={handleScanComplete}
              onCancel={() => setViewMode('manual')}
            />
          </div>
        ) : (
          <>
            {/* Gamified Solution Banner (when solution exists) */}
            {solution?.success && solution.solutionMoves.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-base sm:text-lg">
                        Optimal Solution Found!
                      </h3>
                      {(() => {
                        const badge = getEfficiencyBadge(solution.moveCount);
                        return (
                          <span className={`text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} border border-white/20 shadow-sm`}>
                            {badge.rank} · {badge.title}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Kociemba Two-Phase computed{' '}
                      <span className="font-mono text-emerald-300 font-bold">{solution.moveCount} moves</span> in just{' '}
                      <span className="font-mono text-indigo-300 font-bold">{solution.solveTimeMs.toFixed(1)}ms</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shadow">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{solution.moveCount} Turns</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shadow">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>{solution.solveTimeMs.toFixed(1)} ms</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shadow">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Optimal $\le 20$</span>
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
                  <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 text-xs text-slate-400 flex items-start gap-3 backdrop-blur">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-200">Interactive 3D Solver Ready:</p>
                      <p className="mt-1 leading-relaxed text-slate-400">
                        Rotate the 3D model with your mouse or finger. Use the 2D Net editor or click{' '}
                        <button
                          onClick={() => setViewMode('camera')}
                          className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/40"
                        >
                          Camera Scan
                        </button>{' '}
                        to scan your physical cube. Hit{' '}
                        <span className="text-emerald-400 font-bold">Solve Cube</span> to calculate and watch the
                        turn-by-turn playback with retro sound effects!
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
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur py-6 text-center text-xs text-slate-500 relative z-10">
        <p>Built with React 19, TypeScript, Three.js WebGL, and Herbert Kociemba's Two-Phase Algorithm.</p>
        <p className="mt-1 text-slate-600 font-mono">100% Client-Side · Zero Server Overhead · MIT License</p>
      </footer>
    </div>
  );
}
