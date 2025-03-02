import { OPEN_STRING_FREQUENCIES, NOTE_STRINGS} from "../utils/noteUtils";

/**
 * Convert frequency to MIDI note number
 * @param frequency - Frequency in Hz
 * @returns MIDI note number
 */
export function noteFromPitch(frequency: number): number {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69; // A4 (440Hz) is MIDI note 69
}

/**
 * Calculate how many cents the frequency is off from the ideal pitch
 * @param frequency - Detected frequency
 * @param note - MIDI note number
 * @returns Cents off from perfect pitch (-50 to +50)
 */
export function centsOffFromPitch(frequency: number, note: number): number {
  // Calculate the frequency of the perfect pitch for this note
  const perfectFreq = 440 * Math.pow(2, (note - 69) / 12);
  // Calculate cents deviation
  const cents = Math.floor(1200 * Math.log(frequency / perfectFreq) / Math.log(2));
  // Return value capped between -50 and 50 cents
  return Math.max(-50, Math.min(50, cents));
}

/**
 * Convert cents to a percentage for UI display
 * @param cents - Cents off from pitch
 * @returns Percentage value (0-100)
 */
export function getDetunePercent(cents: number): string {
  // Map -50 to 50 cents to a percentage
  return String(Math.abs(cents) + 50);
}

/**
 * Convert MIDI note to note name with octave
 * @param midiNote - MIDI note number
 * @returns Object containing note name and octave
 */
export function getNoteAndOctave(midiNote: number): { note: string, octave: number } {
  const noteName = NOTE_STRINGS[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return { note: noteName, octave };
}

/**
 * Filter out false positives for guitar notes
 * @param frequency - Detected frequency
 * @returns true if the frequency is likely a valid guitar note
 */
export function isValidGuitarFrequency(frequency: number): boolean {
  // Guitar standard range is roughly 80Hz (low E) to 700Hz (high E 12th fret)
  // Add some margin for alternate tunings
  return frequency >= 75 && frequency <= 1000;
}