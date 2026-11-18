import React, { useEffect } from 'react';
import { Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Category, CATEGORY_ACCENTS, Task, TimerMode, TimerStatus } from '../types/pomodoro';

interface FocusOverlayProps {
  isOpen: boolean;
  mode: TimerMode;
  status: TimerStatus;
  secondsLeft: number;
  totalSeconds: number;
  activeCategory: Category;
  activeTask: Task | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onClose: () => void;
}

const MODE_LABELS: Record<TimerMode, { label: string; stroke: string; accent: string }> = {
  work: {
    label: 'Session de concentration',
    stroke: 'stroke-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  shortBreak: {
    label: 'Pause courte',
    stroke: 'stroke-sky-500',
    accent: 'text-sky-600 dark:text-sky-400',
  },
  longBreak: {
    label: 'Pause longue',
    stroke: 'stroke-amber-500',
    accent: 'text-amber-600 dark:text-amber-400',
  },
};

export const FocusOverlay: React.FC<FocusOverlayProps> = ({
  isOpen,
  mode,
  status,
  secondsLeft,
  totalSeconds,
  activeCategory,
  activeTask,
  soundEnabled,
  onToggleSound,
  onStart,
  onPause,
  onResume,
  onReset,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const meta = MODE_LABELS[mode];
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - secondsLeft / totalSeconds)) : 0;
  const progressPercent = Math.round(progress * 100);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const size = 360;
  const center = size / 2;
  const radius = center - 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const displayCategory = activeTask ? activeTask.category : activeCategory;
  const catAccent = CATEGORY_ACCENTS[displayCategory];
  const hasElapsed = secondsLeft < totalSeconds;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mode Focus sans distractions"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 p-6 sm:p-10"
    >
      {/* Top minimal bar */}
      <div className="flex items-center justify-between gap-4 max-w-4xl w-full mx-auto">
        <div className="text-sm font-semibold tracking-tight font-display">
          Cadence SI
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Son actif' : 'Muet'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" aria-hidden="true" />
            <span>Quitter le mode Focus</span>
          </button>
        </div>
      </div>

      {/* Center Focus Chronometer */}
      <div className="flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-auto text-center">
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-xs font-medium">
            <span className={meta.accent}>{meta.label}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className={catAccent.text}>{displayCategory}</span>
          </div>
          {activeTask && (
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white text-balance">
              {activeTask.title}
            </h1>
          )}
        </div>

        <div className="relative flex items-center justify-center my-2">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-64 h-64 sm:w-80 sm:h-80 md:w-[360px] md:h-[360px]"
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={8}
              className="stroke-slate-200 dark:stroke-slate-800/80"
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className={`${meta.stroke} transition-[stroke-dashoffset] duration-300 ease-out`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl sm:text-6xl font-bold font-mono-tabular tracking-tight text-slate-900 dark:text-white">
              {formattedTime}
            </div>
            <div className="mt-3 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              {progressPercent}% complété
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {status === 'idle' && (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Démarrer</span>
            </button>
          )}
          {status === 'running' && (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          )}
          {status === 'paused' && (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reprendre</span>
            </button>
          )}
          {(status !== 'idle' || hasElapsed) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle footer shortcut note */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500">
        Appuyez sur Échap pour revenir au tableau de bord
      </div>
    </div>
  );
};
