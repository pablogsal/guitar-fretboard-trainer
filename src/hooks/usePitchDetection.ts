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
  onNoteDetected: (noteData: PlayedNote) => void;
  deviceId?: string;
}

export const usePitchDetection = ({
  isListening,
  isPaused,
  isMuted,
  currentNote,
  currentString,
  onNoteDetected,
  deviceId = ''
}: UsePitchDetectionProps) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [isCorrectNote, setIsCorrectNote] = useState<boolean>(false);
  const [detectedNotes, setDetectedNotes] = useState<string[]>([]);
  const [currentDetectedNote, setCurrentDetectedNote] = useState<string | null>(null);
  const [currentDetectedFrequency, setCurrentDetectedFrequency] = useState<number | null>(null);
  const [currentCents, setCurrentCents] = useState<number>(0);

  // Track the first detected note and its octave
  const firstDetectedNoteRef = useRef<{ note: string; octave: number } | null>(null);

  // References for audio processing
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzing = useRef<boolean>(false);

  // Audio context and analyzer from our singleton
  const audioContext = AudioContext.getAudioContext();
  const analyserNode = AudioContext.getAnalyser();

  // Create buffer for pitch detection
  const bufferLength = 2048;
  const bufferRef = useRef<Float32Array>(new Float32Array(bufferLength));

  // Reset detection state
  const resetDetection = useCallback(() => {
    firstDetectedNoteRef.current = null;
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

      // Connect microphone to analyzer
      microphoneRef.current = audioContext.createMediaStreamSource(streamRef.current);
      microphoneRef.current.connect(analyserNode);

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
      return;
    }

    // Get the waveform data for visualization
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteTimeDomainData(dataArray);
    setAudioData(dataArray);

    // Continue updating until stopped
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  }, [analyserNode, isListening, isPaused]);

  // Analyze the pitch using the autocorrelation algorithm
  const updatePitch = useCallback(() => {
    if (!isListening || isPaused || isAnalyzing.current) return;

    isAnalyzing.current = true;

    try {
      // Get the audio data from the analyzer
      analyserNode.getFloatTimeDomainData(bufferRef.current);

      // Use the autocorrelation algorithm to detect the pitch
      const frequency = autoCorrelate(bufferRef.current, audioContext.sampleRate);

      // Only process if we have a valid frequency
      if (frequency > -1 && isValidGuitarFrequency(frequency)) {
        setCurrentDetectedFrequency(frequency);
        const midiNote = noteFromPitch(frequency);
        const cents = centsOffFromPitch(frequency, midiNote);
        setCurrentCents(cents);
        const { note, octave } = getNoteAndOctave(midiNote);
        const fullNote = `${note}${octave}`;

        setCurrentDetectedNote(fullNote);

        // If the detected note matches the current challenge note
        if (note === currentNote) {
          // If no note has been detected yet, store the first detected note
          if (!firstDetectedNoteRef.current) {
            firstDetectedNoteRef.current = { note, octave };
            onNoteDetected({ note, octave: 'first' });
          } else {
            // Check if the new note is the same as the first note but in the next octave
            const { note: firstNote, octave: firstOctave } = firstDetectedNoteRef.current;
            if (note === firstNote && octave === firstOctave + 1) {
              onNoteDetected({ note, octave: 'next' });
              resetDetection(); // Reset for the next challenge
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in pitch detection:", err);
    }

    isAnalyzing.current = false;
  }, [isListening, isPaused, currentNote, onNoteDetected, resetDetection]);

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
    isCorrectNote,
    detectedNotes,
    currentDetectedNote,
    currentDetectedFrequency,
    currentCents
  };
};

export default usePitchDetection;