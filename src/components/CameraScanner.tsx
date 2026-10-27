import React, { useRef, useState, useEffect } from 'react';
import { Face, FaceletState } from '../core/types';
import { classifyColorHSV } from '../core/colorClassifier';
import { COLOR_HEX, COLOR_NAMES } from './CubeNetEditor';
import {
  Camera,
  RotateCcw,
  Check,
  VideoOff,
} from 'lucide-react';

interface CameraScannerProps {
  onScanComplete: (state: FaceletState) => void;
  onCancel: () => void;
}

const SCAN_ORDER: Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanComplete,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentFaceIndex, setCurrentFaceIndex] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store scanned facelets for each of the 6 faces (each face has 9 facelets)
  const [scannedFaces, setScannedFaces] = useState<Record<Face, Face[] | null>>({
    U: null,
    L: null,
    F: null,
    R: null,
    B: null,
    D: null,
  });

  // Current preview of captured face
  const [previewFace, setPreviewFace] = useState<Face[] | null>(null);

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

  // Sample pixel colors from the 3x3 grid
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate central 3x3 grid region
    const minDim = Math.min(canvas.width, canvas.height);
    const boxSize = minDim * 0.55;
    const startX = (canvas.width - boxSize) / 2;
    const startY = (canvas.height - boxSize) / 2;
    const cellSize = boxSize / 3;
    const sampleBox = Math.max(10, Math.floor(cellSize * 0.3));

    const detected: Face[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const centerX = startX + col * cellSize + cellSize / 2;
        const centerY = startY + row * cellSize + cellSize / 2;

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

        const avgR = Math.round(totalR / totalPixels);
        const avgG = Math.round(totalG / totalPixels);
        const avgB = Math.round(totalB / totalPixels);

        // Center piece is locked to the current target face
        if (row === 1 && col === 1) {
          detected.push(currentFace);
        } else {
          const colorFace = classifyColorHSV({ r: avgR, g: avgG, b: avgB });
          detected.push(colorFace);
        }
      }
    }

    setPreviewFace(detected);
  };

  const handleConfirmFace = () => {
    if (!previewFace) return;

    const updated = {
      ...scannedFaces,
      [currentFace]: previewFace,
    };
    setScannedFaces(updated);
    setPreviewFace(null);

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
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur flex flex-col gap-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-white text-base">Guided Webcam Scanner</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Cancel
        </button>
      </div>

      {/* Stepper indicator for 6 faces */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {SCAN_ORDER.map((face, idx) => {
          const isDone = scannedFaces[face] !== null;
          const isCurrent = idx === currentFaceIndex;

          return (
            <div
              key={face}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isCurrent
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/40"
                style={{ backgroundColor: COLOR_HEX[face] }}
              />
              <span>{face}</span>
              {isDone && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
          );
        })}
      </div>

      {/* Instruction Banner */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Step {currentFaceIndex + 1} of 6: </span>
          <span className="font-bold text-white">
            Hold up the <span style={{ color: COLOR_HEX[currentFace] }}>{COLOR_NAMES[currentFace]}</span> face.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Center sticker must be {COLOR_NAMES[currentFace].split(' ')[0]}
        </span>
      </div>

      {/* Video Viewport with 3x3 Targeting Reticle */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
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
              className="w-full h-full object-cover transform -scale-x-100" // Mirror camera
            />

            {/* 3x3 Target Reticle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[55%] aspect-square grid grid-cols-3 grid-rows-3 gap-1.5 p-2 rounded-xl border-2 border-dashed border-indigo-400/80 bg-black/20 backdrop-blur-[1px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border border-white/40 flex items-center justify-center ${
                      i === 4 ? 'ring-2 ring-emerald-400 bg-emerald-500/20' : 'bg-white/10'
                    }`}
                  >
                    {i === 4 && (
                      <span className="text-[10px] font-bold text-emerald-300 uppercase">
                        Center
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Dialog / Capture Button */}
      {previewFace ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Captured Colors:</span>
            <span className="text-[11px] text-slate-500">Check if colors match your cube</span>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900 rounded-lg border border-slate-800">
              {previewFace.map((f, idx) => (
                <div
                  key={idx}
                  style={{ backgroundColor: COLOR_HEX[f] }}
                  className="w-8 h-8 rounded border border-black/30 shadow-sm"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
            <button
              onClick={handleConfirmFace}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{currentFaceIndex === 5 ? 'Finish & Open Solver' : 'Confirm Face'}</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleCapture}
          disabled={hasPermission !== true}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>Capture Face ({currentFace})</span>
        </button>
      )}
    </div>
  );
};
