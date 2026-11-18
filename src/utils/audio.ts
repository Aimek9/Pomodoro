import { SoundProfile } from '../types/pomodoro';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {
      // Ignore autoplay restrictions before user gesture
    });
  }
  return sharedAudioCtx;
}

export function playNotificationSound(profile: SoundProfile, volume = 0.7): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const safeVolume = Math.max(0.05, Math.min(1, volume));
  const now = ctx.currentTime;

  const playTone = (freq: number, startOffset: number, duration: number, type: OscillatorType = 'sine', peakGain = 0.35) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + startOffset);

    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(peakGain * safeVolume, now + startOffset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  if (profile === 'chime') {
    // Clean ascending fifth harmonic chord (executive desk chime)
    playTone(523.25, 0, 0.55, 'sine', 0.3);
    playTone(659.25, 0.14, 0.6, 'sine', 0.28);
    playTone(783.99, 0.28, 0.85, 'sine', 0.32);
  } else if (profile === 'bell') {
    // Crisp dual bell strike
    playTone(880, 0, 0.75, 'triangle', 0.28);
    playTone(1318.5, 0.02, 0.5, 'sine', 0.14);
    playTone(880, 0.42, 0.8, 'triangle', 0.22);
  } else {
    // Minimalist double pulse
    playTone(587.33, 0, 0.18, 'sine', 0.32);
    playTone(587.33, 0.26, 0.24, 'sine', 0.32);
  }
}

export function sendDesktopNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        silent: true,
      });
    } catch {
      // Some sandboxed iframes restrict Notification constructor
    }
  }
}
