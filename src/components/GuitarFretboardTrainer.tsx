import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import CountdownTimer from './CountdownTimer';
import ChallengeDisplay from './ChallengeDisplay';
import FeedbackDisplay from './FeedbackDisplay';
import ProgressStats from './ProgressStats';
import WelcomeScreen from './WelcomeScreen';
import StringSelector from './StringSelector';
import WaveformVisualizer from './WaveformVisualizer';
import usePitchDetection from '../hooks/usePitchDetection';
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
  const [playedNotes, setPlayedNotes] = useState<PlayedNote[]>([]);
  const [correctNotes, setCorrectNotes] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [animation, setAnimation] = useState<string>('');
  const [selectedStrings, setSelectedStrings] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  
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
  const { countdown, countdownActive, elapsedTime, startTime, startCountdown, resetTimer, pauseTimer, resumeTimer } = 
    useTimer({ onComplete: () => setIsListening(true) });

  const handleStringSelect = useCallback((stringNumber: number) => {
    const challenge = generateRandomChallenge(stringNumber);
    setCurrentString(challenge.string);
    setCurrentNote(challenge.note);
    resetTimer();
    startCountdown(3);
  }, [resetTimer, startCountdown]);

  // Start a new challenge
    const startNewChallenge = useCallback(() => {
    if (isPaused) return;
    
    setPlayedNotes([]);
    setCorrectNotes([]);
    setFeedbackMessage('');
    setShowFeedback(false);
    
    const challenge = generateRandomChallenge(selectedStrings);
    setCurrentString(challenge.string);
    setCurrentNote(challenge.note);
    
    resetTimer();
    startCountdown(3);
  }, [isPaused, resetTimer, startCountdown, selectedStrings]);

  const handleRestartChallenge = useCallback(() => {
    startNewChallenge();
  }, [startNewChallenge]);

  // Complete the current challenge
  const completeChallenge = useCallback(() => {
    setIsListening(false);
    
    // Calculate time taken
    const timeTaken = startTime ? Date.now() - startTime : 0;
    
    // Add to progress
    const progressEntry: ProgressEntry = {
      date: new Date().toISOString(),
      string: getStringLabel(currentString),
      note: currentNote,
      timeTaken,
      correctNotesCount: correctNotes.length
    };
    
    setProgress(prev => [...prev, progressEntry]);
    
    // Show completion feedback
    setFeedbackMessage(`Challenge completed in ${(timeTaken / 1000).toFixed(2)} seconds!`);
    setShowFeedback(true);
    setAnimation('complete');
    
    // Start next challenge after a delay
    setTimeout(() => {
      startNewChallenge();
    }, 2000);
  }, [startTime, currentString, currentNote, correctNotes.length, startNewChallenge]);
  
  const handleNoteDetected = useCallback((detectedNote: PlayedNote) => {
    if (detectedNote.octave === 'first') {
      setCorrectNotes(['first']);
      setFeedbackMessage(`Correct! ${detectedNote.note} detected. Now play the next octave.`);
    } else if (detectedNote.octave === 'next') {
      setCorrectNotes(['first', 'next']);
      setFeedbackMessage(`Correct! ${detectedNote.note} in the next octave detected.`);
      completeChallenge();
    }

    setShowFeedback(true);
    setAnimation('success');
    setPlayedNotes(prev => [...prev, detectedNote]);
  }, [completeChallenge]);

  // Pass the selected deviceId to usePitchDetection
  const { 
    isInitialized, 
    error, 
    initAudio, 
    audioData, 
    isCorrectNote, 
    detectedNotes,
    currentDetectedNote,
    currentDetectedFrequency,
    currentCents
  } = usePitchDetection({
    isListening,
    isPaused,
    isMuted,
    currentNote,
    currentString,
    onNoteDetected: handleNoteDetected,
    deviceId: selectedDeviceId
  });

 // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newState = !prev;
      if (newState) {
        pauseTimer();
      } else {
        resumeTimer();
      }
      return newState;
    });
  }, [pauseTimer, resumeTimer]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // Handle microphone device selection
  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    // The effect in usePitchDetection will reinitialize the audio with new device
  }, [setSelectedDeviceId]);

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

  // Debug effect to monitor detected notes
  useEffect(() => {
    if (detectedNotes.length) {
      console.log('Recent detected notes:', detectedNotes.slice(-5));
    }
  }, [detectedNotes]);

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
      />

      {!isStarted ? (
        <WelcomeScreen onStart={handleStart} error={error} />
      ) : (
        <div className={`w-full max-w-4xl ${animation ? `animate-${animation}` : ''}`}>
          <StringSelector
            selectedStrings={selectedStrings}
            onChange={setSelectedStrings}
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
            <CountdownTimer countdown={countdown} />
          ) : (
            <ChallengeDisplay 
              currentString={currentString}
              currentNote={currentNote}
              correctNotes={correctNotes}
              onStringSelect={handleStringSelect}
            />
          )}
          
          <FeedbackDisplay 
            message={feedbackMessage}
            show={showFeedback}
          />
          
          <ProgressStats 
            progress={progress}
            elapsedTime={elapsedTime}
            correctNotes={correctNotes}
          />
        </div>
      )}
      
      <footer className="mt-auto pt-8 text-gray-500 text-sm">
        <p>Play each note in both octaves to complete the challenge.</p>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </footer>
    </div>
  );
};

export default GuitarFretboardTrainer;