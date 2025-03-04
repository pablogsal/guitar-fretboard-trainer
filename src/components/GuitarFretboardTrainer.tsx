// src/components/GuitarFretboardTrainer.tsx - Fixed string selection
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import CountdownTimer from './CountdownTimer';
import ChallengeDisplay from './ChallengeDisplay';
import FeedbackDisplay from './FeedbackDisplay';
import ProgressStats from './ProgressStats';
import TimeHistogram from './TimeHistogram';
import WelcomeScreen from './WelcomeScreen';
import StringSelector from './StringSelector';
import WaveformVisualizer from './WaveformVisualizer';
import NoteDetector from './NoteDetector';
import { usePitchDetection } from '../hooks/pitch';
import useTimer from '../hooks/useTimer';
import useAudioDevices from '../hooks/useAudioDevices';
import { generateRandomChallenge, getStringLabel } from '../utils/noteUtils';
import { exportProgressAsCSV, playSound } from '../utils/audioUtils';
import { ProgressEntry, PlayedNote } from '../types';

const GuitarFretboardTrainer: React.FC = () => {
  // State variables
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentString, setCurrentString] = useState<number>(1);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [,setPlayedNotes] = useState<PlayedNote[]>([]);
  const [correctNotes, setCorrectNotes] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [animation, setAnimation] = useState<string>('');
  const [selectedStrings, setSelectedStrings] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [maxErrors] = useState<number>(3); // Maximum errors allowed before failing
  const [isChallengeFailed, setIsChallengeFailed] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(50); // Default medium sensitivity
  const [showNoteDetector, setShowNoteDetector] = useState<boolean>(false);
  
  // Challenge start time reference for accurate timing
  const challengeStartTimeRef = useRef<number | null>(null);
  const currentChallengeRef = useRef<{ string: number; note: string } | null>(null);
  
  // Get audio devices with the hook
  const { 
    audioDevices, 
    selectedDeviceId, 
    setSelectedDeviceId, 
    isLoading: isLoadingDevices, 
    error: devicesError, 
    refreshDevices 
  } = useAudioDevices();

  // Custom hooks
  const { countdown, countdownActive, elapsedTime, startCountdown, resetTimer, pauseTimer, resumeTimer } = 
    useTimer({ 
      onComplete: () => {
        // Start listening and record the actual challenge start time
        setIsListening(true);
        challengeStartTimeRef.current = Date.now();
      } 
    });

  // Handle note detection success
  const handleNoteDetected = useCallback((detectedNote: PlayedNote) => {
    // Don't process if in detector mode or challenge failed
    if (showNoteDetector || isChallengeFailed) return;
    
    if (detectedNote.octave === 'first') {
      setCorrectNotes(['first']);
      setFeedbackMessage(`Correct! ${detectedNote.note} detected. Now play the next octave.`);
      playSound('success', isMuted);
    } else if (detectedNote.octave === 'next') {
      setCorrectNotes(['first', 'next']);
      setFeedbackMessage(`Correct! ${detectedNote.note} in the next octave detected.`);
      playSound('success', isMuted);
      completeChallenge(true);
    }

    setShowFeedback(true);
    setAnimation('success');
    setPlayedNotes(prev => [...prev, detectedNote]);
  }, [showNoteDetector, isChallengeFailed, isMuted]);

  // Handle incorrect note detection
  const handleIncorrectNote = useCallback((note: string) => {
    // Don't process if in detector mode or challenge failed
    if (showNoteDetector || isChallengeFailed) return;
    
    setErrorCount(prev => {
      const newErrorCount = prev + 1;
      
      // Play error sound
      playSound('error', isMuted);
      
      // Show error feedback with clear display of both the detected and target notes
      setFeedbackMessage(`Incorrect! ${note} detected instead of ${currentNote}.`);
      setShowFeedback(true);
      setAnimation('error');
      
      // If too many errors, fail the challenge
      if (newErrorCount >= maxErrors) {
        setIsChallengeFailed(true);
        setChallengeFailed(); // Tell the pitch detection to stop checking
        completeChallenge(false);
      }
      
      return newErrorCount;
    });
  }, [showNoteDetector, isChallengeFailed, currentNote, isMuted, maxErrors]);

  // Pass the selected deviceId to usePitchDetection
  const { 
    error, 
    initAudio, 
    audioData,
    rawAudioData, 
    isCorrectNote, 
    currentDetectedNote,
    currentDetectedFrequency,
    currentCents,
    setChallengeFailed,
    updateSensitivity
  } = usePitchDetection({
    isListening: isListening || showNoteDetector, // Listen in both game and detector modes
    isPaused, // Only pass the regular isPaused state
    isMuted, // No longer mute sounds in detector mode
    currentNote,
    currentString,
    sensitivity,
    onNoteDetected: handleNoteDetected,
    onIncorrectNote: handleIncorrectNote,
    deviceId: selectedDeviceId,
    extendedRange: true, // Allow detection of higher frequencies
    detectorMode: showNoteDetector // Explicitly tell the hook when we're in detector mode
  });

  // Update sensitivity when slider changes
  useEffect(() => {
    if (updateSensitivity) {
      updateSensitivity(sensitivity);
    }
  }, [sensitivity, updateSensitivity]);

  // Start a new challenge
  const startNewChallenge = useCallback(() => {
    if (isPaused || showNoteDetector) return;
    
    // setPlayedNotes([]);
    setCorrectNotes([]);
    setFeedbackMessage('');
    setShowFeedback(false);
    setErrorCount(0);  // Reset error count for new challenge
    setIsChallengeFailed(false); // Reset failure state
    
    // Reset challenge start time
    challengeStartTimeRef.current = null;
    
    // Ensure we have at least one string selected
    if (selectedStrings.length === 0) {
      console.warn("No strings selected, defaulting to all strings");
      setSelectedStrings([1, 2, 3, 4, 5, 6]);
      return;
    }
    
    // Log the currently selected strings
    console.log("Selected strings for challenge:", selectedStrings);
    
    try {
      // Get a random challenge using only the selected strings
      const challenge = generateRandomChallenge(selectedStrings);
      
      // Update state with the new challenge
      setCurrentString(challenge.string);
      setCurrentNote(challenge.note);
      currentChallengeRef.current = challenge;
      
      // Console log for debugging
      console.log(`New challenge: String ${challenge.string} (${getStringLabel(challenge.string)}), Note ${challenge.note}`);
      
      resetTimer();
      startCountdown(3);
    } catch (error) {
      console.error("Error generating challenge:", error);
      // Fallback to using all strings if something went wrong
      setSelectedStrings([1, 2, 3, 4, 5, 6]);
      const fallbackChallenge = generateRandomChallenge([1, 2, 3, 4, 5, 6]);
      setCurrentString(fallbackChallenge.string);
      setCurrentNote(fallbackChallenge.note);
      currentChallengeRef.current = fallbackChallenge;
      resetTimer();
      startCountdown(3);
    }
  }, [isPaused, showNoteDetector, resetTimer, startCountdown, selectedStrings]);

  const handleRestartChallenge = useCallback(() => {
    if (showNoteDetector) return; // Don't restart if in detector mode
    startNewChallenge();
  }, [showNoteDetector, startNewChallenge]);

  // Complete the current challenge
  const completeChallenge = useCallback((success: boolean = true) => {
    if (showNoteDetector) return; // Don't complete challenges in detector mode
    
    setIsListening(false);
    
    // Calculate time taken based on when the challenge actually started
    let timeTaken = 0;
    if (challengeStartTimeRef.current) {
      timeTaken = Date.now() - challengeStartTimeRef.current;
    } else {
      // Fallback to timer's elapsed time if challenge start time wasn't recorded
      timeTaken = elapsedTime;
    }
    
    // Ensure current challenge info is available
    if (!currentChallengeRef.current) {
      console.error("No current challenge information available");
      return;
    }
    
    // Create a proper string identifier that includes both the number and note
    const currentStringNumber = currentChallengeRef.current.string;
    const stringIdentifier = getStringLabel(currentStringNumber);
    
    // Add to progress with the current string properly recorded
    const progressEntry: ProgressEntry = {
      date: new Date().toISOString(),
      string: stringIdentifier, // Store the full string label like "1 (E)"
      stringNumber: currentStringNumber, // Also store just the number for filtering
      note: currentChallengeRef.current.note,
      timeTaken,
      correctNotesCount: correctNotes.length,
      errors: errorCount,
      success
    };
    
    console.log("Adding progress entry:", progressEntry);
    
    setProgress(prev => [...prev, progressEntry]);
    
    // Play sound based on success/failure if not muted
    if (!isMuted) {
      playSound(success ? 'success' : 'error', isMuted);
    }
    
    // Show completion feedback - using challenge elapsed time
    if (success) {
      setFeedbackMessage(`Challenge completed in ${(timeTaken / 1000).toFixed(2)} seconds!`);
      setAnimation('complete');
    } else {
      setFeedbackMessage(`Challenge failed. Too many errors. Try again!`);
      setAnimation('error');
    }
    setShowFeedback(true);
    
    // Reset challenge start time
    challengeStartTimeRef.current = null;
    
    // Start next challenge after a delay if not in detector mode
    if (!showNoteDetector) {
      setTimeout(() => {
        startNewChallenge();
      }, 2000);
    }
  }, [elapsedTime, correctNotes.length, errorCount, isMuted, showNoteDetector, startNewChallenge]);

 // Toggle pause state
  const togglePause = useCallback(() => {
    if (showNoteDetector) return; // Don't toggle pause in detector mode
    
    setIsPaused(prev => {
      const newState = !prev;
      if (newState) {
        pauseTimer();
      } else {
        resumeTimer();
      }
      return newState;
    });
  }, [showNoteDetector, pauseTimer, resumeTimer]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // Handle microphone device selection
  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, [setSelectedDeviceId]);

  // Handle sensitivity change
  const handleSensitivityChange = useCallback((value: number) => {
    setSensitivity(value);
  }, []);

  // Toggle note detector mode
  const toggleNoteDetector = useCallback(() => {
    setShowNoteDetector(prev => !prev);
    
    // If turning detector mode on, pause the game
    if (!showNoteDetector) {
      if (!isPaused) {
        pauseTimer();
      }
    } else {
      // If turning detector mode off, resume timer if it was playing before
      if (!isPaused) {
        resumeTimer();
      }
    }
  }, [isPaused, pauseTimer, resumeTimer, showNoteDetector]);

  // Export progress data
  const handleExportCSV = useCallback(() => {
    if (progress.length === 0) {
      setFeedbackMessage('No progress data to export');
      setShowFeedback(true);
      return;
    }
    
    exportProgressAsCSV(progress);
  }, [progress]);

  // Start the app on first load
  const handleStart = useCallback(async () => {
    const success = await initAudio();
    if (success) {
      setIsStarted(true);
      startNewChallenge();
    }
    return success;
  }, [initAudio, startNewChallenge]);

  // Animation effect
  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => {
        setAnimation('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animation]);

  // Handle strings selection change
  const handleStringSelectionChange = useCallback((newSelectedStrings: number[]) => {
    console.log("String selection changed to:", newSelectedStrings);
    
    // Validate to make sure we always have at least one string
    if (newSelectedStrings.length === 0) {
      console.warn("Cannot have zero strings selected");
      return;
    }
    
    setSelectedStrings(newSelectedStrings);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <Header 
        isMuted={isMuted}
        isPaused={isPaused}
        onToggleMute={toggleMute}
        onTogglePause={togglePause}
        onExportCSV={handleExportCSV}
        onRestartChallenge={handleRestartChallenge}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={handleDeviceSelect}
        isLoadingDevices={isLoadingDevices}
        devicesError={devicesError}
        onRefreshDevices={refreshDevices}
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
        onToggleNoteDetector={toggleNoteDetector}
        showNoteDetector={showNoteDetector}
      />

      {!isStarted ? (
        <WelcomeScreen onStart={handleStart} error={error} />
      ) : (
        <div className={`w-full max-w-4xl ${animation ? `animate-${animation}` : ''}`}>
          <StringSelector
            selectedStrings={selectedStrings}
            onChange={handleStringSelectionChange}
          />
          
          <WaveformVisualizer 
            audioData={audioData}
            isListening={isListening}
            currentString={currentString}
            isCorrectNote={isCorrectNote}
            detectedNote={currentDetectedNote}
            detectedFrequency={currentDetectedFrequency}
            cents={currentCents}
          />

          {countdownActive ? (
            <CountdownTimer 
              countdown={countdown} 
              currentString={currentString}
            />
          ) : (
            <ChallengeDisplay 
              currentString={currentString}
              currentNote={currentNote}
              correctNotes={correctNotes}
            />
          )}
          
          <FeedbackDisplay 
            message={feedbackMessage}
            show={showFeedback && !showNoteDetector} // Hide feedback in detector mode
          />
          
          <ProgressStats 
            progress={progress}
            elapsedTime={elapsedTime}
            correctNotes={correctNotes}
            errorCount={errorCount}
            maxErrors={maxErrors}
          />
          
          {progress.length > 0 && (
            <TimeHistogram progress={progress} />
          )}
        </div>
      )}
      
      {showNoteDetector && isStarted && (
        <NoteDetector
          audioData={audioData}
          rawAudioData={rawAudioData}
          detectedNote={currentDetectedNote}
          detectedFrequency={currentDetectedFrequency}
          cents={currentCents}
          isListening={true} // Always set to true in detector mode
          onExit={toggleNoteDetector}
          sensitivity={sensitivity}
          onSensitivityChange={handleSensitivityChange}
        />
      )}
      
      <footer className="mt-auto pt-8 text-gray-500 text-sm">
        <p>Play each note in both octaves to complete the challenge. Max {maxErrors} errors allowed.</p>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </footer>
    </div>
  );
};

export default GuitarFretboardTrainer;