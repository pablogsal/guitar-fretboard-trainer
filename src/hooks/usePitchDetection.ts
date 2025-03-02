import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayedNote } from '../types';
import AudioContext from '../libs/AudioContext';
import autoCorrelate from '../libs/AutoCorrelate';
import { 
  noteFromPitch, 
  centsOffFromPitch, 
  getNoteAndOctave, 
  isValidGuitarFrequency
} from '../libs/Helpers';

interface UsePitchDetectionProps {
  isListening: boolean;
  isPaused: boolean;
  isMuted: boolean;
  currentNote: string;
  currentString: number;
  sensitivity?: number; // 0-100 scale, higher = more sensitive
  onNoteDetected: (noteData: PlayedNote) => void;
  onIncorrectNote?: (note: string) => void;
  deviceId?: string;
  extendedRange?: boolean; // Enable extended frequency range for high notes
}

export const usePitchDetection = ({
  isListening,
  isPaused,
  isMuted,
  currentNote,
  currentString,
  sensitivity = 50, // Default medium sensitivity
  onNoteDetected,
  onIncorrectNote,
  deviceId = '',
  extendedRange = false // Default to standard range
}: UsePitchDetectionProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [rawAudioData, setRawAudioData] = useState<Uint8Array | null>(null);
  const [isCorrectNote, setIsCorrectNote] = useState<boolean>(false);
  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);
  const [currentDetectedNote, setCurrentDetectedNote] = useState<string | null>(null);
  const [currentDetectedFrequency, setCurrentDetectedFrequency] = useState<number | null>(null);
  const [currentCents, setCurrentCents] = useState<number>(0);
  const [currentSensitivity, setCurrentSensitivity] = useState<number>(sensitivity);
  const [useExtendedRange, setUseExtendedRange] = useState<boolean>(extendedRange);

  // Track the first detected note and its octave
  const firstDetectedNoteRef = useRef<{ note: string; octave: number } | null>(null);

  // References for audio processing
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzing = useRef<boolean>(false);
  const lastWrongNoteTime = useRef<number | null>(null);
  const hasChallengeFailedRef = useRef<boolean>(false);
  
  // Enhanced note detection tracking with timestamps and confidence
  const recentDetectionsRef = useRef<Array<{
    note: string;
    timestamp: number;
    amplitude: number;
    confidence: number;
  }>>([]);
  
  // Silence detection
  const silenceDetectedRef = useRef<boolean>(false);
  const lastSoundTimestampRef = useRef<number>(0);
  
  // Store current correct note detection streak
  const correctNoteStreakRef = useRef<number>(0);
  const incorrectNoteStreakRef = useRef<number>(0);

  // Audio context and analyzer from our singleton
  const audioContext = AudioContext.getAudioContext();
  const analyserNode = AudioContext.getAnalyser();

  // Create buffer for pitch detection
  const bufferLength = 2048;
  const bufferRef = useRef<Float32Array>(new Float32Array(bufferLength));
  
  // Update extended range setting if prop changes
  useEffect(() => {
    setUseExtendedRange(extendedRange);
  }, [extendedRange]);

  // Modified frequency validation to support high E string
  const isValidFrequency = useCallback((frequency: number): boolean => {
    // Standard guitar range: ~80Hz (low E) to ~700Hz (high E 12th fret)
    // Extended range: ~80Hz to ~1400Hz (high E 24th fret)
    const minFreq = 75; // Low E with some tolerance
    const maxFreq = useExtendedRange ? 2000 : 1000;
    
    return frequency >= minFreq && frequency <= maxFreq;
  }, [useExtendedRange]);

  // Calculate dynamic thresholds based on sensitivity
  const getThresholds = useCallback(() => {
    // Map sensitivity (0-100) to appropriate thresholds
    // Lower sensitivity = higher volume threshold and stricter detection
    const volumeThreshold = 0.05 - (sensitivity / 100 * 0.045); // 0.05 at 0%, 0.005 at 100%
    const incorrectDelay = 4000 - (sensitivity / 100 * 3000); // 4000ms at 0%, 1000ms at 100%
    const minIncorrectStreak = 7 - Math.floor(sensitivity / 100 * 5); // 7 at 0%, 2 at 100%
    const minCorrectStreak = 5 - Math.floor(sensitivity / 100 * 3); // 5 at 0%, 2 at 100%
    const centsToleranceCorrect = 30 + Math.floor(sensitivity / 100 * 20); // 30 at 0%, 50 at 100%
    const centsToleranceIncorrect = 20 + Math.floor(sensitivity / 100 * 30); // 20 at 0%, 50 at 100%
    
    return {
      volumeThreshold,
      incorrectDelay,
      minIncorrectStreak,
      minCorrectStreak,
      centsToleranceCorrect,
      centsToleranceIncorrect
    };
  }, [sensitivity]);

  // Reset detection state
  const resetDetection = useCallback(() => {
    firstDetectedNoteRef.current = null;
    lastWrongNoteTime.current = null;
    hasChallengeFailedRef.current = false;
    recentDetectionsRef.current = [];
    silenceDetectedRef.current = false;
    correctNoteStreakRef.current = 0;
    incorrectNoteStreakRef.current = 0;
    lastSoundTimestampRef.current = 0;
  }, []);

  // Initialize audio context and analyzer
  const initAudio = useCallback(async () => {
    try {
      // Clean up any existing connections
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Use specific device if provided, otherwise use default
      const constraints: MediaStreamConstraints = {
        audio: deviceId 
          ? { 
              deviceId: { exact: deviceId },
              echoCancellation: true,
              autoGainControl: true,
              noiseSuppression: true,
              latency: 0
            }
          : {
              echoCancellation: true,
              autoGainControl: true,
              noiseSuppression: true,
              latency: 0
            }
      };

      // Get microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);

      // Resume the audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Connect microphone to analyzer with optimized settings for high frequency detection
      microphoneRef.current = audioContext.createMediaStreamSource(streamRef.current);
      microphoneRef.current.connect(analyserNode);
      
      // Configure analyzer for better high frequency detection
      analyserNode.fftSize = 4096; // Larger FFT size for better frequency resolution
      analyserNode.smoothingTimeConstant = 0.5; // Medium smoothing for balanced response

      setIsInitialized(true);
      resetDetection();
      setError(null);
      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      setError('Failed to initialize microphone. Please check permissions and try again.');
      setIsInitialized(false);
      return false;
    }
  }, [analyserNode, audioContext, deviceId, resetDetection]);

  // Get audio waveform data for visualization
  const updateAudioData = useCallback(() => {
    if (!isListening || isPaused) {
      // If not listening, provide a flat line
      setAudioData(new Uint8Array(128).fill(128));
      setRawAudioData(new Uint8Array(128).fill(128));
      return;
    }

    // Get the waveform data for visualization
    const smoothedDataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const rawDataArray = new Uint8Array(analyserNode.frequencyBinCount);
    
    // Get raw data first
    analyserNode.getByteTimeDomainData(rawDataArray);
    setRawAudioData(rawDataArray);
    
    // Apply smoothing for the visualized version
    analyserNode.smoothingTimeConstant = 0.8; // Increase smoothing for visualization
    analyserNode.getByteTimeDomainData(smoothedDataArray);
    setAudioData(smoothedDataArray);
    
    // Reset smoothing for pitch detection
    analyserNode.smoothingTimeConstant = 0.5;

    // Continue updating until stopped
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, [analyserNode, isListening, isPaused]);

  // Update sensitivity from props
  const updateSensitivity = useCallback((newSensitivity: number) => {
    setCurrentSensitivity(newSensitivity);
  }, []);

  // Check if the audio signal has sufficient volume to be analyzed
  const hasSignificantVolume = useCallback((buffer: Float32Array): { hasVolume: boolean, amplitude: number } => {
    let sumOfSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumOfSquares / buffer.length);
    
    // Get dynamic threshold based on sensitivity
    const { volumeThreshold } = getThresholds();
    
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
  }, [getThresholds]);

  // Process a detected note and determine if it's stable enough
  const processDetectedNote = useCallback((note: string, amplitude: number, cents: number): {
    isStable: boolean;
    isCorrect: boolean;
    isIncorrect: boolean;
  } => {
    const now = Date.now();
    const { minCorrectStreak, minIncorrectStreak } = getThresholds();
    
    // Add to recent detections, limited to last 10
    recentDetectionsRef.current.push({
      note,
      timestamp: now,
      amplitude,
      confidence: Math.max(0, 1 - Math.abs(cents) / 50) // Higher confidence when more in tune
    });
    
    // Keep only the most recent detections
    if (recentDetectionsRef.current.length > 10) {
      recentDetectionsRef.current.shift();
    }
    
    // Calculate the most frequent note in recent detections
    const noteCounts: Record<string, { count: number, totalConfidence: number }> = {};
    recentDetectionsRef.current.forEach(detection => {
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
    if (note === currentNote) {
      correctNoteStreakRef.current++;
      incorrectNoteStreakRef.current = 0;
    } else {
      incorrectNoteStreakRef.current++;
      correctNoteStreakRef.current = 0;
    }
    
    // Determine if the note is stable, correct, or incorrect
    const isStable = maxCount >= minCorrectStreak;
    const isCorrect = note === currentNote && correctNoteStreakRef.current >= minCorrectStreak;
    const isIncorrect = note !== currentNote && incorrectNoteStreakRef.current >= minIncorrectStreak;
    
    return { isStable, isCorrect, isIncorrect };
  }, [currentNote, getThresholds]);

  // Analyze the pitch using the autocorrelation algorithm
  const updatePitch = useCallback(() => {
    if (!isListening || isPaused || isAnalyzing.current || hasChallengeFailedRef.current) return;

    isAnalyzing.current = true;

    try {
      // Get the audio data from the analyzer
      analyserNode.getFloatTimeDomainData(bufferRef.current);

      // Check for significant volume
      const { hasVolume, amplitude } = hasSignificantVolume(bufferRef.current);
      
      // Exit early if volume is too low
      if (!hasVolume) {
        // If we detect silence, reset the incorrect note streak
        // This prevents errors when strings are barely touched or just starting to vibrate
        if (silenceDetectedRef.current) {
          incorrectNoteStreakRef.current = 0;
        }
        isAnalyzing.current = false;
        return;
      }

      // Use the autocorrelation algorithm to detect the pitch
      const frequency = autoCorrelate(bufferRef.current, audioContext.sampleRate);

      // Only process if we have a valid frequency for a guitar
      if (frequency > -1 && isValidFrequency(frequency)) {
        setCurrentDetectedFrequency(frequency);
        const midiNote = noteFromPitch(frequency);
        const cents = centsOffFromPitch(frequency, midiNote);
        setCurrentCents(cents);
        const { note, octave } = getNoteAndOctave(midiNote);
        const fullNote = `${note}${octave}`;

        setCurrentDetectedNote(fullNote);
        
        // Get dynamic thresholds based on sensitivity
        const { incorrectDelay, centsToleranceCorrect, centsToleranceIncorrect } = getThresholds();
        
        // Process the note to determine stability and correctness
        const { isStable, isCorrect, isIncorrect } = processDetectedNote(note, amplitude, cents);
        
        // Update UI state for visualization
        setIsCorrectNote(isCorrect);
        
        // If the detected note matches the current challenge note with sufficient stability
        if (isCorrect && Math.abs(cents) < centsToleranceCorrect) {
          // If no note has been detected yet, store the first detected note
          if (!firstDetectedNoteRef.current) {
            firstDetectedNoteRef.current = { note, octave };
            onNoteDetected({ note, octave: 'first' });
          } else {
            // Check if the new note is the same as the first note but in the next octave
            const { note: firstNote, octave: firstOctave } = firstDetectedNoteRef.current;
            if (note === firstNote && octave === firstOctave + 1 && isCorrect) {
              onNoteDetected({ note, octave: 'next' });
              resetDetection(); // Reset for the next challenge
            }
          }
        } 
        // Handle incorrect notes with sufficient stability
        else if (isIncorrect && Math.abs(cents) < centsToleranceIncorrect) {
          // Check if enough time has passed since the last wrong note notification
          const now = Date.now();
          if (!lastWrongNoteTime.current || now - lastWrongNoteTime.current > incorrectDelay) {
            lastWrongNoteTime.current = now;
            onIncorrectNote && onIncorrectNote(note);
          }
        }
      }
    } catch (err) {
      console.error("Error in pitch detection:", err);
    }

    isAnalyzing.current = false;
  }, [
    isListening, 
    isPaused, 
    hasSignificantVolume, 
    audioContext.sampleRate, 
    processDetectedNote, 
    onNoteDetected, 
    onIncorrectNote, 
    resetDetection,
    getThresholds,
    isValidFrequency
  ]);

  // Set the challenge as failed
  const setChallengeFailed = useCallback(() => {
    hasChallengeFailedRef.current = true;
  }, []);

  // Apply sensitivity changes 
  useEffect(() => {
    setCurrentSensitivity(sensitivity);
  }, [sensitivity]);

  // Start updating the audio data for visualization
  useEffect(() => {
    if (isInitialized && isListening && !isPaused) {
      updateAudioData();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [isInitialized, isListening, isPaused, updateAudioData]);

  // Start the pitch detection interval
  useEffect(() => {
    if (isInitialized && isListening && !isPaused) {
      updateIntervalRef.current = setInterval(updatePitch, 30);

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      };
    }
  }, [isInitialized, isListening, isPaused, updatePitch]);

  // Reset detection when the note changes
  useEffect(() => {
    resetDetection();
  }, [currentNote, currentString, resetDetection]);

  // Reinitialize when deviceId changes
  useEffect(() => {
    if (deviceId) {
      initAudio();
    }
  }, [deviceId, initAudio]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    isInitialized,
    error,
    initAudio,
    audioData,
    rawAudioData,
    isCorrectNote,
    detectedNotes,
    currentDetectedNote,
    currentDetectedFrequency,
    currentCents,
    setChallengeFailed,
    updateSensitivity
  };
};

export default usePitchDetection;