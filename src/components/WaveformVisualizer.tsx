import React, { useRef, useEffect, useState, useMemo } from 'react';
import { STRING_COLORS } from '../utils/noteUtils';
import { getDetunePercent } from '../libs/Helpers';

interface WaveformVisualizerProps {
  audioData: Uint8Array | null;
  isListening: boolean;
  currentString: number;
  isCorrectNote: boolean;
  detectedNote?: string | null;
  detectedFrequency?: number | null;
  cents?: number;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioData,
  isListening,
  currentString,
  isCorrectNote,
  detectedNote,
  detectedFrequency,
  cents = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fadeClass, setFadeClass] = useState<string>('');
  
  // Use the string color for the waveform - moved outside useEffect for reuse in JSX
  const waveformColor = useMemo(() => {
    if (!isListening) return '#4a5568'; // Gray when not listening
    if (isCorrectNote) return '#10b981'; // Green when correct note is played
    return STRING_COLORS[currentString] || '#4290e4'; // String color or default blue
  }, [isListening, isCorrectNote, currentString]);
  
  // Handle note change animation
  useEffect(() => {
    if (detectedNote) {
      setFadeClass('animate-fade-in');
      const timer = setTimeout(() => {
        setFadeClass('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [detectedNote]);
  
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas || !audioData) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Scale canvas for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      // Clear the canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // No data or not listening - draw a flat line
      if (!isListening || !audioData.length) {
        ctx.beginPath();
        ctx.moveTo(0, rect.height / 2);
        ctx.lineTo(rect.width, rect.height / 2);
        ctx.strokeStyle = waveformColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }
      
      // Draw the waveform
      const bufferLength = audioData.length;
      const sliceWidth = rect.width / bufferLength;
      
      ctx.beginPath();
      ctx.moveTo(0, rect.height / 2);
      
      // Draw smoother curves for better visualization
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = audioData[i] / 128.0; // convert to range roughly -1 to 1
        const y = (v * rect.height) / 4 + rect.height / 2; // scale and center
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother rendering
          const prevX = x - sliceWidth;
          const prevY = (audioData[i-1] / 128.0) * (rect.height / 4) + (rect.height / 2);
          
          // Control point for the curve
          const cpX = prevX + (x - prevX) / 2;
          const cpY = prevY;
          
          ctx.quadraticCurveTo(cpX, cpY, x, y);
        }
        
        x += sliceWidth;
      }
      
      // Add glow effect for when notes are correct
      if (isCorrectNote) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add gradient fill below the line
      const gradient = ctx.createLinearGradient(0, rect.height / 2, 0, rect.height);
      gradient.addColorStop(0, `${waveformColor}80`); // Semi-transparent color
      gradient.addColorStop(1, `${waveformColor}05`); // Almost transparent
      
      ctx.lineTo(rect.width, rect.height);
      ctx.lineTo(0, rect.height);
      ctx.fillStyle = gradient;
      ctx.fill();
    };
    
    // Draw the initial waveform
    drawWaveform();
    
    // Continuously redraw the waveform
    const animationId = requestAnimationFrame(drawWaveform);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioData, isListening, currentString, isCorrectNote, waveformColor]);
  
  // Parse the note and octave for display
  const parseNoteInfo = () => {
    if (!detectedNote) return { note: '', octave: '', octaveCategory: '' };
    
    // Extract note name and octave number
    const noteName = detectedNote.replace(/\d+$/, '');
    const octaveMatch = detectedNote.match(/\d+$/);
    const octave = octaveMatch ? octaveMatch[0] : '';
    
    return { note: noteName, octave};
  };
  
  const { note, octave} = parseNoteInfo();
  
  return (
    <div className="relative waveform-container w-full bg-gray-800/50 rounded-lg overflow-hidden mb-6">
      {/* Canvas for waveform */}
      <div className="h-32">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
      
      {/* Tuning meter (only show when a note is detected) */}
      {isListening && detectedNote && (
        <div className="px-4 py-2 bg-gray-800/80 flex items-center justify-center">
          <div className="w-full max-w-xs flex justify-center items-center">
            <div
              className="bg-gradient-to-r to-green-400 from-red-600 py-1 rounded-full rotate-180"
              style={{
                width: (cents < 0 ? getDetunePercent(cents) : "50") + "%",
              }}
            ></div>
            <span className="font-bold text-lg text-green-800 mx-1">I</span>
            <div
              className="bg-gradient-to-r from-green-400 to-red-600 py-1 rounded-full"
              style={{
                width: (cents > 0 ? getDetunePercent(cents) : "50") + "%",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Note display overlay */}
      {isListening && (
        <div className="absolute top-2 right-3 flex items-center">
          <div 
            className={`flex items-center justify-center py-1 px-3 rounded-full bg-gray-900/80 backdrop-blur-sm ${fadeClass}`}
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center">
                <span className="text-xs text-gray-400 mr-1">Detected:</span>
                <span 
                  className={`text-lg font-bold ${isCorrectNote ? 'text-green-400' : 'text-white'}`}
                  style={{ color: isCorrectNote ? '#10b981' : waveformColor }}
                >
                  {note || '–'}
                </span>
              </div>
              {detectedFrequency !== undefined && detectedFrequency !== null && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {detectedFrequency.toFixed(1)} Hz {cents !== 0 && `(${cents > 0 ? '+' : ''}${cents} cents)`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualizer;