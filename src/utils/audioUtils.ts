import { ProgressEntry } from '../types';
import { NOTE_STRINGS } from './noteUtils';

/**
 * Play a sound effect based on the type
 */
export const playSound = (type: 'success' | 'error', isMuted: boolean): void => {
  if (isMuted) return;
  
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = ctx.createGain();
  
  gainNode.connect(ctx.destination);
  
  if (type === 'success') {
    // Play a pleasant chord
    const notes = [440, 554.37, 659.25]; // A4, C#5, E5 - A major chord
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      const noteGain = ctx.createGain();
      noteGain.gain.value = 0.1; // Lower volume to avoid clipping
      
      oscillator.connect(noteGain);
      noteGain.connect(gainNode);
      
      oscillator.start(ctx.currentTime + i * 0.05); // Stagger the notes slightly
      
      // Fade out
      noteGain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
      noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5 + i * 0.05);
      
      oscillator.stop(ctx.currentTime + 0.6 + i * 0.05);
    });
    
  } else if (type === 'error') {
    // Create two oscillators for a dissonant sound
    const frequencies = [220, 233.08]; // A3 and Bb3 - dissonant interval
    
    frequencies.forEach(freq => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = freq;
      
      oscillator.connect(gainNode);
      
      // Start with quick attack
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      
      // Fade out quickly
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    });
  }
};

/**
 * Export progress data as CSV
 */
export const exportProgressAsCSV = (progress: ProgressEntry[]): void => {
  if (progress.length === 0) {
    console.error('No progress data to export');
    return;
  }
  
  // Create CSV header
  let csv = 'Date,Time,String,String Number,Note,Time Taken (ms),Correct Notes,Errors,Success\n';
  
  // Add each progress entry
  progress.forEach((entry: ProgressEntry) => {
    const date = new Date(entry.date);
    const formattedDate = `${date.toLocaleDateString()}`;
    const formattedTime = `${date.toLocaleTimeString()}`;
    
    // Get the string number (either from stringNumber field or by parsing string label)
    const stringNumber = 'stringNumber' in entry 
      ? entry.stringNumber 
      : parseInt((entry as { string: string }).string.charAt(0));
    
    csv += `${formattedDate},${formattedTime},${entry.string},${stringNumber},${entry.note},${entry.timeTaken},${entry.correctNotesCount},${entry.errors},${entry.success}\n`;
  });
  
  // Create a blob and download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'guitar-fretboard-progress.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Convert note name to frequency
 * @param note Note name like "A", "C#", etc.
 * @param octave Optional octave number (default: 4)
 * @returns Frequency in Hz
 */
export const noteToFrequency = (note: string, octave?: number): number | null => {
  // Extract note and octave if provided as one string (e.g., "A4")
  let noteOnly = note;
  let octaveNum = octave || 4;
  
  // Check if the note includes an octave number
  const octaveMatch = note.match(/\d+$/);
  if (octaveMatch) {
    noteOnly = note.replace(/\d+$/, '');
    octaveNum = parseInt(octaveMatch[0]);
  }
  
  // Find the note index
  const noteIndex = NOTE_STRINGS.indexOf(noteOnly);
  if (noteIndex === -1) return null;
  
  // Calculate frequency using the formula: f = 440 * 2^((n-69)/12)
  // where n is the MIDI note number
  const midiNote = noteIndex + 12 * (octaveNum + 1);
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
  
  return frequency;
};