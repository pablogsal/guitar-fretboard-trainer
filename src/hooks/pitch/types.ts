// src/hooks/pitch/types.ts
import { PlayedNote } from '../../types';

export interface UsePitchDetectionProps {
  isListening: boolean;
  isPaused: boolean;
  isMuted: boolean;
  currentNote: string;
  currentString: number;
  sensitivity?: number;
  onNoteDetected: (noteData: PlayedNote) => void;
  onIncorrectNote?: (note: string) => void;
  deviceId?: string;
  extendedRange?: boolean;
  detectorMode?: boolean;
}

export interface UsePitchDetectionReturn {
  isInitialized: boolean;
  error: string | null;
  initAudio: () => Promise<boolean>;
  audioData: Uint8Array | null;
  rawAudioData: Uint8Array | null;
  isCorrectNote: boolean;
  detectedNotes: string[];
  currentDetectedNote: string | null;
  currentDetectedFrequency: number | null;
  currentCents: number;
  setChallengeFailed: () => void;
  updateSensitivity: (value: number) => void;
}

export interface DetectionThresholds {
  volumeThreshold: number;
  incorrectDelay: number;
  minIncorrectStreak: number;
  minCorrectStreak: number;
  centsToleranceCorrect: number;
  centsToleranceIncorrect: number;
}

export interface RecentDetection {
  note: string;
  timestamp: number;
  amplitude: number;
  confidence: number;
}

export interface NoteProcessResult {
  isStable: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
}

export interface AudioInitOptions {
  deviceId: string;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  noiseSuppression?: boolean;
  latency?: number;
}

export interface AudioServices {
  audioContext: AudioContext;
  analyserNode: AnalyserNode;
}

export interface ProcessVolumeResult {
  hasVolume: boolean;
  amplitude: number;
}