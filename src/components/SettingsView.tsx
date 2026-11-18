import React, { useState } from 'react';
import { Bell, Check, Moon, Sun, Trash2, Volume2 } from 'lucide-react';
import { SoundProfile, TimerConfig } from '../types/pomodoro';
import { playNotificationSound } from '../utils/audio';

interface SettingsViewProps {
  config: TimerConfig;
  theme: 'dark' | 'light';
  onUpdateConfig: (next: Partial<TimerConfig>) => void;
  onToggleTheme: () => void;
  onClearHistory: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  theme,
  onUpdateConfig,
  onToggleTheme,
  onClearHistory,
  onResetAllData,
}) => {
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback('Notifications navigateur non supportées sur cet environnement.');
      return;
    }
    if (Notification.permission === 'granted') {
      onUpdateConfig({ desktopNotifications: !config.desktopNotifications });
      setNotifFeedback(null);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        onUpdateConfig({ desktopNotifications: true });
        setNotifFeedback('Notifications bureau activées.');
      } else {
        onUpdateConfig({ desktopNotifications: false });
        setNotifFeedback('Permission refusée dans le navigateur.');
      }
    } catch {
      setNotifFeedback('Impossible de demander la permission dans cet onglet.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Durations */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Durées du chronomètre
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personnalisez les plages de concentration et de récupération
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Work duration */}
          <div className="space-y-2">
            <label htmlFor="cfg-work" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Session de travail (minutes)
            </label>
            <div className="flex items-center gap-2">
              {[25, 45, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdateConfig({ workDuration: v })}
                  className={`px-3 py-1.5 text-xs font-mono-tabular rounded-md border transition-colors cursor-pointer ${
                    config.workDuration === v
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {v}
                </button>
              ))}
              <input
                id="cfg-work"
                type="number"
                min={1}
                max={180}
                value={config.workDuration}
                onChange={(e) =>
                  onUpdateConfig({
                    workDuration: Math.max(1, Math.min(180, Number(e.target.value) || 25)),
                  })
                }
                className="w-20 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Short break */}
          <div className="space-y-2">
            <label htmlFor="cfg-short" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Pause courte (5 à 10 min recommandés)
            </label>
            <div className="flex items-center gap-2">
              {[5, 8, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdateConfig({ shortBreakDuration: v })}
                  className={`px-3 py-1.5 text-xs font-mono-tabular rounded-md border transition-colors cursor-pointer ${
                    config.shortBreakDuration === v
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {v}
                </button>
              ))}
              <input
                id="cfg-short"
                type="number"
                min={1}
                max={45}
                value={config.shortBreakDuration}
                onChange={(e) =>
                  onUpdateConfig({
                    shortBreakDuration: Math.max(1, Math.min(45, Number(e.target.value) || 5)),
                  })
                }
                className="w-20 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Long break */}
          <div className="space-y-2">
            <label htmlFor="cfg-long" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Pause longue (15 à 30 min recommandés)
            </label>
            <div className="flex items-center gap-2">
              {[15, 20, 30].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onUpdateConfig({ longBreakDuration: v })}
                  className={`px-3 py-1.5 text-xs font-mono-tabular rounded-md border transition-colors cursor-pointer ${
                    config.longBreakDuration === v
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {v}
                </button>
              ))}
              <input
                id="cfg-long"
                type="number"
                min={5}
                max={60}
                value={config.longBreakDuration}
                onChange={(e) =>
                  onUpdateConfig({
                    longBreakDuration: Math.max(5, Math.min(60, Number(e.target.value) || 15)),
                  })
                }
                className="w-20 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cycles */}
          <div className="space-y-2">
            <label htmlFor="cfg-cycles" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Sessions avant pause longue
            </label>
            <input
              id="cfg-cycles"
              type="number"
              min={2}
              max={8}
              value={config.cyclesBeforeLongBreak}
              onChange={(e) =>
                onUpdateConfig({
                  cyclesBeforeLongBreak: Math.max(2, Math.min(8, Number(e.target.value) || 4)),
                })
              }
              className="w-24 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Automation toggles */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Démarrer automatiquement les pauses après une session de travail
            </span>
            <input
              type="checkbox"
              checked={config.autoStartBreaks}
              onChange={(e) => onUpdateConfig({ autoStartBreaks: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Démarrer automatiquement la session de travail après une pause
            </span>
            <input
              type="checkbox"
              checked={config.autoStartWork}
              onChange={(e) => onUpdateConfig({ autoStartWork: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* Sound & Visual Notifications */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Notifications sonores et visuelles
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Signaux acoustiques et alertes de fin de cycle
          </p>
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Alerte sonore à la fin de chaque session
          </span>
          <input
            type="checkbox"
            checked={config.soundEnabled}
            onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label htmlFor="cfg-sound-profile" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Signal sonore
            </label>
            <div className="flex items-center gap-2">
              <select
                id="cfg-sound-profile"
                value={config.soundProfile}
                onChange={(e) => onUpdateConfig({ soundProfile: e.target.value as SoundProfile })}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="chime">Carillon harmonique</option>
                <option value="bell">Cloche sobre</option>
                <option value="pulse">Double impulsion</option>
              </select>
              <button
                type="button"
                onClick={() => playNotificationSound(config.soundProfile, config.soundVolume)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tester</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="cfg-volume" className="font-medium text-slate-700 dark:text-slate-300">
                Volume
              </label>
              <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                {Math.round(config.soundVolume * 100)}%
              </span>
            </div>
            <input
              id="cfg-volume"
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={config.soundVolume}
              onChange={(e) => onUpdateConfig({ soundVolume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Notifications système du navigateur
            </p>
            {notifFeedback && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notifFeedback}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRequestNotifications}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              config.desktopNotifications
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{config.desktopNotifications ? 'Activées' : 'Activer les notifications'}</span>
          </button>
        </div>
      </section>

      {/* Theme & Persistence */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Apparence de l&apos;interface
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Basculer entre le thème sombre (recommandé) et le thème clair
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4" />
            <span>Sauvegarde automatique locale active (tâches, sessions et préférences)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!confirmClearHistory ? (
              <button
                type="button"
                onClick={() => setConfirmClearHistory(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer l&apos;historique des sessions</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 dark:text-rose-400">Confirmer l&apos;effacement ?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClearHistory(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            )}

            {!confirmResetAll ? (
              <button
                type="button"
                onClick={() => setConfirmResetAll(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span>Réinitialiser l&apos;application</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 dark:text-rose-400">Tout réinitialiser ?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllData();
                    setConfirmResetAll(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
