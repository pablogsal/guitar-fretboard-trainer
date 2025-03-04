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
 * This is the original implementation with a standard range
 * @param frequency - Detected frequency
 * @returns true if the frequency is likely a valid guitar note
 */
export function isValidGuitarFrequency(frequency: number): boolean {
  // Expanded guitar range to allow for high frets on the high E string
  // Consider frequencies from 75Hz (low E) to 2000Hz (high notes on high E string)
  return frequency >= 75 && frequency <= 2000;
}

/**
 * Get frequency range for a specific string
 * @param stringNumber - Guitar string number (1-6)
 * @returns Range object with min and max frequencies
 */
export function getStringFrequencyRange(stringNumber: number): { min: number, max: number } {
  // Basic open frequencies - ensure stringNumber is a valid key
  const openFreq = OPEN_STRING_FREQUENCIES[stringNumber as keyof typeof OPEN_STRING_FREQUENCIES] || 0;
  
  // Calculate frequency ranges based on string
  switch (stringNumber) {
    case 1: // High E - allow very high frequencies
      return { min: openFreq * 0.9, max: openFreq * 6 }; // Up to 24th fret and beyond
    case 2: // B
      return { min: openFreq * 0.9, max: openFreq * 5 };
    case 3: // G
      return { min: openFreq * 0.9, max: openFreq * 4 };
    case 4: // D
      return { min: openFreq * 0.9, max: openFreq * 3.5 };
    case 5: // A
      return { min: openFreq * 0.9, max: openFreq * 3 };
    case 6: // Low E
      return { min: openFreq * 0.9, max: openFreq * 3 };
    default:
      return { min: 75, max: 2000 };
  }
}