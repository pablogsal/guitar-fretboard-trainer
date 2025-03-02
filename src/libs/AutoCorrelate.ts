/**
 * AutoCorrelate function for accurate pitch detection
 * @param buf - Audio buffer data
 * @param sampleRate - Sample rate of the audio context
 * @returns detected pitch frequency or -1 if not found
 */
export default function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  // Perform a quick root-mean-square check to see if there's enough signal
  let SIZE = buf.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    sumOfSquares += val * val;
  }
  
  let rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
  if (rootMeanSquare < 0.01) {
    return -1; // Not enough signal
  }

  // Find the autocorrelation
  let r1 = 0, r2 = SIZE - 1;
  let thres = 0.2;
  
  // Trim off the edges of the signal to eliminate transients
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  // Create a new trimmed array
  const buf2 = buf.slice(r1, r2);
  const SIZE2 = buf2.length;

  // Look for a periodic pattern in the trimmed array
  let c = new Array(SIZE2).fill(0);
  for (let i = 0; i < SIZE2; i++) {
    for (let j = 0; j < SIZE2 - i; j++) {
      c[i] += buf2[j] * buf2[j + i];
    }
  }

  // Find the peak of the autocorrelation
  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }
  
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE2; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
  let T0 = maxpos;

  // Interpolate to find a more precise frequency value
  let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  let a = (x1 + x3 - 2 * x2) / 2;
  let b = (x3 - x1) / 2;
  
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  // Convert period to frequency
  return sampleRate / T0;
}