/**
 * Play a sound effect based on the type
 */
export const playSound = (type: 'success' | 'error', isMuted: boolean): void => {
  if (isMuted) return;
  
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  if (type === 'success') {
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  } else if (type === 'error') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 220;
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }
};

/**
 * Export progress data as CSV
 */
export const exportProgressAsCSV = (progress: any[]): void => {
  if (progress.length === 0) {
    console.error('No progress data to export');
    return;
  }
  
  // Create CSV header
  let csv = 'Date,String,Note,Time Taken (ms),Correct Notes Count\n';
  
  // Add each progress entry
  progress.forEach(entry => {
    csv += `${entry.date},${entry.string},${entry.note},${entry.timeTaken},${entry.correctNotesCount}\n`;
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
