// Constants for guitar strings (by number) and notes

// Note strings for conversion
export const NOTE_STRINGS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];
export const GUITAR_STRINGS = [1, 2, 3, 4, 5, 6]; // 1 is highest E, 6 is lowest E
export const STRING_NOTES = {
  1: 'E', // Highest E
  2: 'B',
  3: 'G',
  4: 'D',
  5: 'A',
  6: 'E'  // Lowest E
};
export const STRING_COLORS: Record<number, string> = {
  1: '#9442e4', // Highest E (purple)
  2: '#4290e4', // B (blue)
  3: '#42e45c', // G (green)
  4: '#e4d942', // D (yellow)
  5: '#e49442', // A (orange)
  6: '#e44242'  // Lowest E (red)
};

// Standard frequencies for guitar open strings
export const OPEN_STRING_FREQUENCIES = {
  1: 329.63, // High E
  2: 246.94, // B
  3: 196.00, // G
  4: 146.83, // D
  5: 110.00, // A
  6: 82.41   // Low E
};

/**
 * Generate a random string and note challenge
 */
export const generateRandomChallenge = () => {
  // Pick a random string (1-6)
  const stringNumber = GUITAR_STRINGS[Math.floor(Math.random() * GUITAR_STRINGS.length)];
  
  // Get available notes for this string (first 5 frets only to keep it simple)
  const openNote = STRING_NOTES[stringNumber];
  const openNoteIndex = NOTE_STRINGS.indexOf(openNote);
  
  // Create an array of available notes (open string + first 5 frets)
  const availableNotes = [];
  for (let i = 0; i <= 5; i++) {
    const noteIndex = (openNoteIndex + i) % 12;
    availableNotes.push(NOTE_STRINGS[noteIndex]);
  }
  
  // Choose a random note from available ones
  const note = availableNotes[Math.floor(Math.random() * availableNotes.length)];
  
  return { 
    string: stringNumber, 
    note
  };
};

/**
 * Get string label (with both number and note name)
 */
export const getStringLabel = (stringNumber: number): string => {
  return `${stringNumber} (${STRING_NOTES[stringNumber]})`;
};