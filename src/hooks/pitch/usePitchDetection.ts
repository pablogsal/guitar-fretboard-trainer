// src/hooks/pitch/usePitchDetection.ts (partial update)
import { useState, useEffect, useRef, useCallback } from 'react';
import { UsePitchDetectionProps, UsePitchDetectionReturn, RecentDetection } from './types';
import AudioContext from '../../libs/AudioContext';
import { calculateThresholds } from './thresholds';
import { 
  isValidFrequency, 
  hasSignificantVolume, 
  initializeAudio, 
  getAudioData, 
  createEmptyAudioData 
} from './audioUtils';
import { detectPitch, processDetectedNote, isNextOctaveNote } from './noteProcessing';

/**
 * Custom hook for pitch detection to identify guitar notes
 */
export const usePitchDetection = ({
  isListening,
  isPaused,
  currentNote,
  currentString,
  sensitivity = 50,
  onNoteDetected,
  onIncorrectNote,
  deviceId = '',
  extendedRange = false,
  detectorMode = false
}: UsePitchDetectionProps): UsePitchDetectionReturn => {
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [rawAudioData, setRawAudioData] = useState<Uint8Array | null>(null);
  const [isCorrectNote, setIsCorrectNote] = useState<boolean>(false);
  const [_detectedNotes] = useState<string[]>([]);
  const [currentDetectedNote, setCurrentDetectedNote] = useState<string | null>(null);
  const [currentDetectedFrequency, setCurrentDetectedFrequency] = useState<number | null>(null);
  const [currentCents, setCurrentCents] = useState<number>(0);
  const [currentSensitivity, setCurrentSensitivity] = useState<number>(sensitivity);
  const [useExtendedRange, setUseExtendedRange] = useState<boolean>(extendedRange);

  // References
  const firstDetectedNoteRef = useRef<{ note: string; octave: number } | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzing = useRef<boolean>(false);
  const lastWrongNoteTime = useRef<number | null>(null);
  const hasChallengeFailedRef = useRef<boolean>(false);
  const recentDetectionsRef = useRef<RecentDetection[]>([]);
  const silenceDetectedRef = useRef<boolean>(false);
  const lastSoundTimestampRef = useRef<number>(0);
  const correctNoteStreakRef = useRef<number>(0);
  const incorrectNoteStreakRef = useRef<number>(0);

  // Buffer for pitch detection
  const bufferLength = 2048;
  const bufferRef = useRef<Float32Array>(new Float32Array(bufferLength));
  
  // Audio context and analyzer from singleton
  const audioContext = AudioContext.getAudioContext();
  const analyserNode = AudioContext.getAnalyser();

  /**
   * Reset detection state
   */
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

  /**
   * Set the challenge as failed
   */
  const setChallengeFailed = useCallback(() => {
    hasChallengeFailedRef.current = true;
  }, []);

  /**
   * Update sensitivity from props
   */
  const updateSensitivity = useCallback((newSensitivity: number) => {
    setCurrentSensitivity(newSensitivity);
  }, []);

  /**
   * Initialize audio context and analyzer
   */
  const initAudio = useCallback(async (): Promise<boolean> => {
    try {
      // Clean up any existing connections
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Initialize audio components
      const { microphone, stream } = await initializeAudio(
        audioContext, 
        analyserNode, 
        deviceId
      );
      
      // Store references
      microphoneRef.current = microphone;
      streamRef.current = stream;

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

  /**
   * Update audio data for visualization
   */
  const updateAudioData = useCallback(() => {
    // Check if we should be processing audio
    const shouldProcess = isListening && (detectorMode || !isPaused);
    
    if (!shouldProcess) {
      // If not processing, provide a flat line
      const { rawData, smoothedData } = createEmptyAudioData();
      setAudioData(smoothedData);
      setRawAudioData(rawData);
      return;
    }

    // Get audio data for visualization
    const { rawData, smoothedData } = getAudioData(analyserNode);
    setRawAudioData(rawData);
    setAudioData(smoothedData);
    
    // Continue updating until stopped
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, [analyserNode, isListening, isPaused, detectorMode]);

  /**
   * Analyze the pitch using the autocorrelation algorithm
   */
  const updatePitch = useCallback(() => {
    // Check if we should be processing
    const shouldProcess = isListening && (detectorMode || !isPaused);
    
    if (!shouldProcess || isAnalyzing.current || hasChallengeFailedRef.current) return;

    isAnalyzing.current = true;

    try {
      // Get thresholds based on current sensitivity
      const thresholds = calculateThresholds(currentSensitivity);
      
      // Get the audio data from the analyzer
      analyserNode.getFloatTimeDomainData(bufferRef.current);

      // Check for significant volume
      const { hasVolume, amplitude } = hasSignificantVolume(
        bufferRef.current, 
        thresholds.volumeThreshold,
        lastSoundTimestampRef, 
        silenceDetectedRef
      );
      
      // Exit early if volume is too low
      if (!hasVolume) {
        // If we detect silence, reset the incorrect note streak
        if (silenceDetectedRef.current) {
          incorrectNoteStreakRef.current = 0;
        }
        isAnalyzing.current = false;
        return;
      }

      // Validate frequency is within guitar range
      const validateFreq = (freq: number) => isValidFrequency(freq, useExtendedRange);
      
      // Detect pitch from buffer
      const pitchData = detectPitch(bufferRef.current, audioContext.sampleRate, validateFreq);

      // Process detected pitch
      if (pitchData) {
        const { frequency, note, noteName, octave, cents } = pitchData;
        
        // Update state with detected values
        setCurrentDetectedFrequency(frequency);
        setCurrentDetectedNote(note);
        setCurrentCents(cents);
        
        // Process the note to determine stability and correctness
        const { isCorrect, isIncorrect } = processDetectedNote(
          noteName, 
          currentNote,
          amplitude, 
          cents,
          recentDetectionsRef.current,
          correctNoteStreakRef,
          incorrectNoteStreakRef,
          thresholds
        );
        
        // Update UI state for visualization
        setIsCorrectNote(isCorrect);
        
        // If in detector mode, just display the note without triggering success/failure
        if (detectorMode) {
          isAnalyzing.current = false;
          return;
        }
        
        // Game mode logic - handle correct notes
        if (isCorrect && Math.abs(cents) < thresholds.centsToleranceCorrect) {
          // If no note has been detected yet, store the first detected note
          if (!firstDetectedNoteRef.current) {
            firstDetectedNoteRef.current = { note: noteName, octave };
            onNoteDetected({ note: noteName, octave: 'first' });
          } else {
            // Check if the new note is the same as the first note but in the next octave
            if (isNextOctaveNote(firstDetectedNoteRef.current, noteName, octave) && isCorrect) {
              onNoteDetected({ note: noteName, octave: 'next' });
              resetDetection(); // Reset for the next challenge
            }
          }
        } 
        // Handle incorrect notes
        else if (isIncorrect && Math.abs(cents) < thresholds.centsToleranceIncorrect) {
          // Check if enough time has passed since the last wrong note notification
          const now = Date.now();
          if (!lastWrongNoteTime.current || now - lastWrongNoteTime.current > thresholds.incorrectDelay) {
            lastWrongNoteTime.current = now;
            onIncorrectNote && onIncorrectNote(noteName);
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
    detectorMode,
    currentSensitivity,
    audioContext.sampleRate, 
    analyserNode,
    currentNote,
    onNoteDetected,
    onIncorrectNote,
    resetDetection,
    useExtendedRange
  ]);

  // Update extended range setting if prop changes
  useEffect(() => {
    setUseExtendedRange(extendedRange);
  }, [extendedRange]);

  // Apply sensitivity changes 
  useEffect(() => {
    setCurrentSensitivity(sensitivity);
  }, [sensitivity]);

  // Start updating the audio data for visualization
  useEffect(() => {
    if (isInitialized && isListening) {
      updateAudioData();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [isInitialized, isListening, updateAudioData]);

  // Start the pitch detection interval
  useEffect(() => {
    if (isInitialized && isListening) {
      updateIntervalRef.current = setInterval(updatePitch, 30);

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      };
    }
  }, [isInitialized, isListening, updatePitch]);

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
    detectedNotes: [], // This is unused but needed by the return type
    currentDetectedNote,
    currentDetectedFrequency,
    currentCents,
    setChallengeFailed,
    updateSensitivity
  };
};

export default usePitchDetection;