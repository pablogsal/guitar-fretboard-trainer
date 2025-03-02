import { noteFromPitch, centsOffFromPitch, getNoteAndOctave } from '../../libs/Helpers';
import { RecentDetection, DetectionThresholds, NoteProcessResult } from './types';
import autoCorrelate from '../../libs/AutoCorrelate';

/**
 * Process audio buffer to detect pitch and determine the note
 * @param buffer Audio data buffer
 * @param sampleRate Audio context sample rate
 * @param isValidFrequency Function to validate the frequency
 * @returns Object with detected note information or null if none detected
 */
export const detectPitch = (
  buffer: Float32Array,
  sampleRate: number,
  isValidFrequency: (freq: number) => boolean
): {
  frequency: number;
  note: string;
  noteName: string;
  octave: number;
  cents: number;
} | null => {
  // Use autocorrelation to detect the pitch
  const frequency = autoCorrelate(buffer, sampleRate);

  // Check if we have a valid frequency
  if (frequency <= 0 || !isValidFrequency(frequency)) {
    return null;
  }

  // Convert frequency to MIDI note and cents
  const midiNote = noteFromPitch(frequency);
  const cents = centsOffFromPitch(frequency, midiNote);
  
  // Get note name and octave
  const { note, octave } = getNoteAndOctave(midiNote);
  const fullNote = `${note}${octave}`;

  return {
    frequency,
    note: fullNote,
    noteName: note,
    octave,
    cents
  };
};

/**
 * Process a detected note and determine if it's stable and correct
 * @param noteName The name of the detected note
 * @param targetNote The target note to match
 * @param amplitude The audio amplitude
 * @param cents Cents off from perfect pitch
 * @param recentDetections Reference to recent note detections
 * @param correctNoteStreak Reference to correct note streak counter
 * @param incorrectNoteStreak Reference to incorrect note streak counter
 * @param thresholds Detection threshold values
 * @returns Object with detection results
 */
export const processDetectedNote = (
  noteName: string,
  targetNote: string,
  amplitude: number,
  cents: number,
  recentDetections: RecentDetection[],
  correctNoteStreak: React.MutableRefObject<number>,
  incorrectNoteStreak: React.MutableRefObject<number>,
  thresholds: DetectionThresholds
): NoteProcessResult => {
  const now = Date.now();
  
  // Add to recent detections
  recentDetections.push({
    note: noteName,
    timestamp: now,
    amplitude,
    confidence: Math.max(0, 1 - Math.abs(cents) / 50) // Higher confidence when more in tune
  });
  
  // Keep only the most recent detections
  if (recentDetections.length > 10) {
    recentDetections.shift();
  }
  
  // Calculate the most frequent note in recent detections
  const noteCounts: Record<string, { count: number, totalConfidence: number }> = {};
  recentDetections.forEach(detection => {
    if (!noteCounts[detection.note]) {
      noteCounts[detection.note] = { count: 0, totalConfidence: 0 };
    }
    noteCounts[detection.note].count++;
    noteCounts[detection.note].totalConfidence += detection.confidence;
  });
  
  // Find the most stable note
  let maxCount = 0;
  let mostStableNote = '';
  Object.entries(noteCounts).forEach(([note, data]) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      mostStableNote = note;
    }
  });
  
  // Update streaks for the correct note and incorrect notes
  if (noteName === targetNote) {
    correctNoteStreak.current++;
    incorrectNoteStreak.current = 0;
  } else {
    incorrectNoteStreak.current++;
    correctNoteStreak.current = 0;
  }
  
  // Determine if the note is stable, correct, or incorrect
  const isStable = maxCount >= thresholds.minCorrectStreak;
  const isCorrect = noteName === targetNote && correctNoteStreak.current >= thresholds.minCorrectStreak;
  const isIncorrect = noteName !== targetNote && incorrectNoteStreak.current >= thresholds.minIncorrectStreak;
  
  return { isStable, isCorrect, isIncorrect };
};

/**
 * Check if a detected note meets the criteria for octave detection
 * @param firstDetectedNote The first detected note reference
 * @param detectedNote The currently detected note
 * @param detectedOctave The octave of the currently detected note
 * @returns Whether the note is in the next octave
 */
export const isNextOctaveNote = (
  firstDetectedNote: { note: string; octave: number },
  detectedNote: string,
  detectedOctave: number
): boolean => {
  const { note: firstNote, octave: firstOctave } = firstDetectedNote;
  return detectedNote === firstNote && detectedOctave === firstOctave + 1;
};