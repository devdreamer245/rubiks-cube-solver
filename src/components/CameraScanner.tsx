import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Face, FaceletState } from '../core/types';
import { classifyColor, RGB } from '../core/colorClassifier';
import { COLOR_HEX, COLOR_NAMES } from './CubeNetEditor';
import { sound } from '../utils/audio';
import {
  Camera,
  RotateCcw,
  Check,
  VideoOff,
  Sun,
  Palette,
  Sparkles,
  FlipHorizontal,
  Info,
} from 'lucide-react';

interface CameraScannerProps {
  onScanComplete: (state: FaceletState) => void;
  onCancel: () => void;
}

const SCAN_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];
const ALL_FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanComplete,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentFaceIndex, setCurrentFaceIndex] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Live real-time colors detected in the video stream
  const [liveColors, setLiveColors] = useState<Face[]>(Array(9).fill('U'));

  // Calibrated center colors learned during scan
  const [centerCalibrations, setCenterCalibrations] = useState<Partial<Record<Face, RGB>>>({});

  // Scanned faces storage (9 stickers per face)
  const [scannedFaces, setScannedFaces] = useState<Record<Face, Face[] | null>>({
    U: null,
    L: null,
    F: null,
    R: null,
    B: null,
    D: null,
  });

  // Preview of currently captured face
  const [previewFace, setPreviewFace] = useState<Face[] | null>(null);

  // Manual editing: which color is currently selected in the paint palette
  const [activePaintColor, setActivePaintColor] = useState<Face>('U');
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(null);

  const currentFace = SCAN_ORDER[currentFaceIndex];

  // Request camera access on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        activeStream = mediaStream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasPermission(false);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera permissions in your browser.'
            : 'Could not access camera. Please check that a webcam is connected.'
        );
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Helper to sample average RGB of a region on canvas
  const sampleCellRGB = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    cellSize: number,
    row: number,
    col: number
  ): RGB => {
    const centerX = startX + col * cellSize + cellSize / 2;
    const centerY = startY + row * cellSize + cellSize / 2;
    const sampleBox = Math.max(12, Math.floor(cellSize * 0.35));

    const sampleStartX = Math.floor(centerX - sampleBox / 2);
    const sampleStartY = Math.floor(centerY - sampleBox / 2);

    const imgData = ctx.getImageData(sampleStartX, sampleStartY, sampleBox, sampleBox);
    const data = imgData.data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }

    return {
      r: Math.round(totalR / totalPixels),
      g: Math.round(totalG / totalPixels),
      b: Math.round(totalB / totalPixels),
    };
  };

  // Real-time video sampling loop to show live color feedback
  const sampleLiveFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const minDim = Math.min(canvas.width, canvas.height);
    const boxSize = minDim * 0.55;
    const startX = (canvas.width - boxSize) / 2;
    const startY = (canvas.height - boxSize) / 2;
    const cellSize = boxSize / 3;

    const detected: Face[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 1 && col === 1) {
          detected.push(currentFace); // Center piece is fixed reference
        } else {
          const rgb = sampleCellRGB(ctx, startX, startY, cellSize, row, col);
          const face = classifyColor(rgb, centerCalibrations);
          detected.push(face);
        }
      }
    }

    setLiveColors(detected);
  }, [currentFace, centerCalibrations, isMirrored]);

  useEffect(() => {
    if (previewFace) return;
    const interval = setInterval(sampleLiveFrame, 150);
    return () => clearInterval(interval);
  }, [sampleLiveFrame, previewFace]);

  // Capture current frame
  const handleCapture = () => {
    sound.playSnap();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const minDim = Math.min(canvas.width, canvas.height);
    const boxSize = minDim * 0.55;
    const startX = (canvas.width - boxSize) / 2;
    const startY = (canvas.height - boxSize) / 2;
    const cellSize = boxSize / 3;

    const detected: Face[] = [];

    // Calibrate the center piece RGB to adapt to current lighting
    const centerRGB = sampleCellRGB(ctx, startX, startY, cellSize, 1, 1);
    setCenterCalibrations((prev) => ({
      ...prev,
      [currentFace]: centerRGB,
    }));

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row === 1 && col === 1) {
          detected.push(currentFace);
        } else {
          const rgb = sampleCellRGB(ctx, startX, startY, cellSize, row, col);
          const face = classifyColor(rgb, {
            ...centerCalibrations,
            [currentFace]: centerRGB,
          });
          detected.push(face);
        }
      }
    }

    setPreviewFace(detected);
    setSelectedTileIdx(null);
  };

  // Manual Color Painting on Captured Face:
  // If user clicks a tile, paint it with the active palette color
  const handleTilePaint = (index: number) => {
    if (!previewFace || index === 4) return; // Center piece is locked
    sound.playTurn();

    const updated = [...previewFace];
    updated[index] = activePaintColor;
    setPreviewFace(updated);
    setSelectedTileIdx(index);
  };

  const handleConfirmFace = () => {
    if (!previewFace) return;
    sound.playTurn();

    const updated = {
      ...scannedFaces,
      [currentFace]: previewFace,
    };
    setScannedFaces(updated);
    setPreviewFace(null);
    setSelectedTileIdx(null);

    if (currentFaceIndex < SCAN_ORDER.length - 1) {
      setCurrentFaceIndex(currentFaceIndex + 1);
    } else {
      // Reconstruct 54-facelet state in standard URFDLB order:
      // U (0..8), R (9..17), F (18..26), D (27..35), L (36..44), B (45..53)
      const u = updated.U || Array(9).fill('U');
      const r = updated.R || Array(9).fill('R');
      const f = updated.F || Array(9).fill('F');
      const d = updated.D || Array(9).fill('D');
      const l = updated.L || Array(9).fill('L');
      const b = updated.B || Array(9).fill('B');

      const fullState: FaceletState = [...u, ...r, ...f, ...d, ...l, ...b];
      onScanComplete(fullState);
    }
  };

  const handleRetake = () => {
    setPreviewFace(null);
    setSelectedTileIdx(null);
  };

  return (
    <div className="bg-slate-900/95 rounded-3xl border border-indigo-500/20 p-5 sm:p-7 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              <span>Webcam Scanner</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Vision + Manual Override
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toggle camera mirror mode"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Flip</span>
          </button>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Stepper indicator for 6 faces */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1 relative z-10">
        {SCAN_ORDER.map((face, idx) => {
          const isDone = scannedFaces[face] !== null;
          const isCurrent = idx === currentFaceIndex;

          return (
            <div
              key={face}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isCurrent
                  ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30 scale-105 shadow-lg'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                style={{ backgroundColor: COLOR_HEX[face] }}
              />
              <span>{face}</span>
              {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
            </div>
          );
        })}
      </div>

      {/* Instruction Banner */}
      <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
        <div>
          <span className="text-slate-400">Step {currentFaceIndex + 1} of 6: </span>
          <span className="font-bold text-white">
            Hold up the <span style={{ color: COLOR_HEX[currentFace] }}>{COLOR_NAMES[currentFace]}</span> face.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Keep cube parallel to camera under clean lighting</span>
        </div>
      </div>

      {/* Video Viewport with Live Targeting Reticle */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {hasPermission === false ? (
          <div className="p-6 text-center flex flex-col items-center gap-2 max-w-sm">
            <VideoOff className="w-8 h-8 text-rose-400" />
            <p className="text-sm font-semibold text-rose-300">Camera Unavailable</p>
            <p className="text-xs text-slate-400">{errorMessage}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'transform -scale-x-100' : ''}`}
            />

            {/* 3x3 Target Reticle Overlay with LIVE Color Dots */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[55%] aspect-square grid grid-cols-3 grid-rows-3 gap-2 p-2.5 rounded-2xl border-2 border-dashed border-indigo-400/90 bg-black/25 backdrop-blur-[2px] shadow-2xl">
                {Array.from({ length: 9 }).map((_, i) => {
                  const detectedColor = liveColors[i] || 'U';
                  const isCenter = i === 4;

                  return (
                    <div
                      key={i}
                      className={`rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                        isCenter
                          ? 'border-emerald-400/80 bg-emerald-500/25 shadow-lg shadow-emerald-500/20'
                          : 'border-white/40 bg-black/40'
                      }`}
                    >
                      {/* Live color indicator badge */}
                      <span
                        className="w-4 h-4 rounded-full border border-black/50 shadow-md transition-colors"
                        style={{ backgroundColor: COLOR_HEX[detectedColor] }}
                      />
                      {isCenter && (
                        <span className="text-[9px] font-bold text-emerald-300 uppercase mt-0.5 tracking-wider">
                          Center
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Dialog with FULL MANUAL COLOR EDITING */}
      {previewFace ? (
        <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 flex flex-col gap-4 shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Verify & Edit Captured Face:</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Tap any tile below to paint it!</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* The 3x3 Captured Grid */}
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                {previewFace.map((f, idx) => {
                  const isCenter = idx === 4;
                  const isSelected = selectedTileIdx === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTilePaint(idx)}
                      disabled={isCenter}
                      title={isCenter ? 'Fixed Center' : `Tap to paint with ${COLOR_NAMES[activePaintColor]}`}
                      style={{ backgroundColor: COLOR_HEX[f] }}
                      className={`w-11 h-11 rounded-xl border border-black/40 shadow-md transition-all active:scale-95 flex items-center justify-center font-bold text-xs text-slate-900 ${
                        isCenter
                          ? 'opacity-90 cursor-not-allowed ring-2 ring-emerald-400'
                          : isSelected
                          ? 'ring-4 ring-indigo-400 scale-105 z-10'
                          : 'hover:scale-105 hover:brightness-110 cursor-pointer'
                      }`}
                    >
                      {isCenter ? (
                        <span className="text-[10px] uppercase font-mono">{f}</span>
                      ) : (
                        <span className="opacity-70 text-[9px] uppercase font-mono">{f}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5">Face: {COLOR_NAMES[currentFace]}</span>
            </div>

            {/* Manual Color Paint Palette */}
            <div className="flex flex-col gap-2 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select Color to Paint:</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ALL_FACES.map((f) => {
                  const isSelected = activePaintColor === f;
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        sound.playTurn();
                        setActivePaintColor(f);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition ${
                        isSelected
                          ? 'ring-2 ring-indigo-400 border-indigo-400 bg-slate-800 scale-105 font-bold shadow'
                          : 'border-slate-700/60 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-[4px] border border-black/40 shadow-sm"
                        style={{ backgroundColor: COLOR_HEX[f] }}
                      />
                      <span className="text-[11px] font-medium">{f}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Pick color, then tap any tile to correct it!</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={handleConfirmFace}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/30 transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{currentFaceIndex === 5 ? 'Finish & Open Solver' : 'Confirm Face'}</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleCapture}
          disabled={hasPermission !== true}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95 relative z-10"
        >
          <Camera className="w-4 h-4" />
          <span>Capture Face ({currentFace})</span>
        </button>
      )}
    </div>
  );
};
