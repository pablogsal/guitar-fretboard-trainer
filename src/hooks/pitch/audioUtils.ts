import { ProcessVolumeResult } from './types';

/**
 * Check if a frequency is valid for guitar
 * @param frequency The detected frequency in Hz
 * @param extendedRange Whether to allow an extended frequency range
 * @returns Boolean indicating if the frequency is valid for guitar
 */
export const isValidFrequency = (frequency: number, extendedRange: boolean): boolean => {
  const minFreq = 75; // Low E with some tolerance
  const maxFreq = extendedRange ? 2000 : 1000; // Higher range for extended mode
  
  return frequency >= minFreq && frequency <= maxFreq;
};

/**
 * Check if the audio signal has sufficient volume to be analyzed
 * @param buffer Audio data buffer
 * @param volumeThreshold Minimum volume threshold
 * @param lastSoundTimestampRef Reference to last sound timestamp
 * @param silenceDetectedRef Reference to silence detection state
 * @returns Object with volume check result and amplitude
 */
export const hasSignificantVolume = (
  buffer: Float32Array, 
  volumeThreshold: number,
  lastSoundTimestampRef: React.MutableRefObject<number>,
  silenceDetectedRef: React.MutableRefObject<boolean>
): ProcessVolumeResult => {
  // Calculate Root Mean Square (RMS) of the buffer to determine volume
  let sumOfSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumOfSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumOfSquares / buffer.length);
  
  // Update silence detection
  const now = Date.now();
  if (rms < volumeThreshold) {
    // If we have a series of low volume detections, consider it silence
    if (now - lastSoundTimestampRef.current > 500) {
      silenceDetectedRef.current = true;
    }
    return { hasVolume: false, amplitude: rms };
  } else {
    // Reset silence detection and update last sound timestamp
    silenceDetectedRef.current = false;
    lastSoundTimestampRef.current = now;
    return { hasVolume: true, amplitude: rms };
  }
};

/**
 * Initialize the audio context and analyzer for pitch detection
 * @param audioContext The audio context instance
 * @param analyserNode The analyzer node
 * @param deviceId The audio device ID to use (optional)
 * @returns Promise resolving to the created audio nodes and stream
 */
export const initializeAudio = async (
  audioContext: AudioContext,
  analyserNode: AnalyserNode,
  deviceId: string = ''
): Promise<{
  microphone: MediaStreamAudioSourceNode;
  stream: MediaStream;
}> => {
  // Configure audio constraints
  const constraints: MediaStreamConstraints = {
    audio: deviceId 
      ? { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        }
      : {
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        }
  };

  // Get microphone access
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Resume the audio context if suspended
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Connect microphone to analyzer
  const microphone = audioContext.createMediaStreamSource(stream);
  microphone.connect(analyserNode);
  
  // Configure analyzer for better high frequency detection
  analyserNode.fftSize = 4096; // Larger FFT size for better frequency resolution
  analyserNode.smoothingTimeConstant = 0.5; // Medium smoothing for balanced response

  return { microphone, stream };
};

/**
 * Get audio waveform data for visualization
 * @param analyserNode The analyzer node to read data from
 * @returns Arrays containing raw and smoothed audio data
 */
export const getAudioData = (
  analyserNode: AnalyserNode
): { 
  rawData: Uint8Array; 
  smoothedData: Uint8Array 
} => {
  const smoothedDataArray = new Uint8Array(analyserNode.frequencyBinCount);
  const rawDataArray = new Uint8Array(analyserNode.frequencyBinCount);
  
  // Get raw data first
  analyserNode.getByteTimeDomainData(rawDataArray);
  
  // Apply smoothing for the visualized version
  analyserNode.smoothingTimeConstant = 0.8; // Increase smoothing for visualization
  analyserNode.getByteTimeDomainData(smoothedDataArray);
  
  // Reset smoothing for pitch detection
  analyserNode.smoothingTimeConstant = 0.5;

  return { 
    rawData: rawDataArray, 
    smoothedData: smoothedDataArray 
  };
};

/**
 * Create empty audio data (flat line) when not listening
 * @returns Object with empty audio data arrays
 */
export const createEmptyAudioData = (): { 
  rawData: Uint8Array; 
  smoothedData: Uint8Array 
} => {
  const emptyData = new Uint8Array(128).fill(128);
  return {
    rawData: emptyData,
    smoothedData: emptyData
  };
};