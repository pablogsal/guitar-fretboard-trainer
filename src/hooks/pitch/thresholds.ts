// src/hooks/pitch/thresholds.ts
import { DetectionThresholds } from './types';

/**
 * Calculate dynamic thresholds based on sensitivity
 * @param sensitivity Value between 0-100 (low to high sensitivity)
 * @returns Threshold values for pitch detection
 */
export const calculateThresholds = (sensitivity: number): DetectionThresholds => {
  // Ensure sensitivity is within valid range
  const safeValue = Math.min(100, Math.max(0, sensitivity));
  
  // Map sensitivity (0-100) to appropriate thresholds
  // Lower sensitivity = higher volume threshold and stricter detection
  const volumeThreshold = 0.05 - (safeValue / 100 * 0.045); // 0.05 at 0%, 0.005 at 100%
  const incorrectDelay = 4000 - (safeValue / 100 * 3000); // 4000ms at 0%, 1000ms at 100%
  const minIncorrectStreak = 7 - Math.floor(safeValue / 100 * 5); // 7 at 0%, 2 at 100%
  const minCorrectStreak = 5 - Math.floor(safeValue / 100 * 3); // 5 at 0%, 2 at 100%
  const centsToleranceCorrect = 30 + Math.floor(safeValue / 100 * 20); // 30 at 0%, 50 at 100%
  const centsToleranceIncorrect = 20 + Math.floor(safeValue / 100 * 30); // 20 at 0%, 50 at 100%
  
  return {
    volumeThreshold,
    incorrectDelay,
    minIncorrectStreak,
    minCorrectStreak,
    centsToleranceCorrect,
    centsToleranceIncorrect
  };
};

/**
 * Map sensitivity value to a descriptive label
 * @param sensitivity Value between 0-100
 * @returns Human-readable description of the sensitivity level
 */
export const getSensitivityLabel = (sensitivity: number): string => {
  if (sensitivity <= 20) return "Very Low (Less Sensitive)";
  if (sensitivity <= 40) return "Low";
  if (sensitivity <= 60) return "Medium";
  if (sensitivity <= 80) return "High";
  return "Very High (More Sensitive)";
};