import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTimerProps {
  onComplete?: () => void;
}

export const useTimer = ({ onComplete }: UseTimerProps = {}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [countdownActive, setCountdownActive] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref if onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  // Start countdown timer
  const startCountdown = useCallback((seconds: number = 3) => {
    setCountdownActive(true);
    setCountdown(seconds);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set up new countdown timer
    timerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setCountdownActive(false);
          
          // Start elapsed time timer
          startTimeRef.current = Date.now();
          
          if (elapsedTimerRef.current) {
            clearInterval(elapsedTimerRef.current);
          }
          
          elapsedTimerRef.current = window.setInterval(() => {
            if (startTimeRef.current) {
              setElapsedTime(Date.now() - startTimeRef.current);
            }
          }, 100); // Update every 100ms instead of 10ms
          
          // Call onComplete callback if provided
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  // Reset the timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    
    setCountdown(3);
    setCountdownActive(false);
    setElapsedTime(0);
    startTimeRef.current = null;
  }, []);
  
  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);
  
  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (startTimeRef.current) {
      // Adjust the start time to account for the pause duration
      const pauseDuration = Date.now() - (startTimeRef.current + elapsedTime);
      startTimeRef.current = startTimeRef.current + pauseDuration;
      
      elapsedTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 100); // Update every 100ms instead of 10ms
    }
  }, [elapsedTime]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, []);
  
  return {
    countdown,
    countdownActive,
    elapsedTime,
    startTime: startTimeRef.current,
    startCountdown,
    resetTimer,
    pauseTimer,
    resumeTimer
  };
};

export default useTimer;