import React, { useState, useEffect } from 'react';
import { Mic, ArrowLeft, XCircle, Waves } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';

interface NoteDetectorProps {
  audioData: Uint8Array | null;
  rawAudioData: Uint8Array | null;
  detectedNote: string | null;
  detectedFrequency: number | null;
  cents: number;
  isListening: boolean;
  onExit: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

const NoteDetector: React.FC<NoteDetectorProps> = ({
  audioData,
  rawAudioData,
  detectedNote,
  detectedFrequency,
  cents,
  isListening,
  onExit,
  sensitivity,
  onSensitivityChange
}) => {
  const [history, setHistory] = useState<Array<{note: string, frequency: number, time: number}>>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [lastDetectedNote, setLastDetectedNote] = useState<string | null>(null);
  const MAX_HISTORY_SIZE = 20; // Limit history to 20 entries
  
  // Add a detected note to history when it changes
  useEffect(() => {
    if (detectedNote && detectedFrequency) {
      // Only add to history if it's a different note than last time
      // or if it's the same note but more than 500ms has passed
      const now = Date.now();
      const lastEntry = history[history.length - 1];
      const timeSinceLastEntry = lastEntry ? now - lastEntry.time : Infinity;
      
      if (detectedNote !== lastDetectedNote || timeSinceLastEntry > 500) {
        setHistory(prev => {
          // Limit history to MAX_HISTORY_SIZE entries
          const newHistory = [...prev];
          if (newHistory.length >= MAX_HISTORY_SIZE) {
            newHistory.shift(); // Remove oldest entry
          }
          newHistory.push({
            note: detectedNote,
            frequency: detectedFrequency,
            time: now
          });
          return newHistory;
        });
        
        setLastDetectedNote(detectedNote);
      }
    }
  }, [detectedNote, detectedFrequency, history, lastDetectedNote]);
  
  // Format the time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Clear the history
  const handleClearHistory = () => {
    setHistory([]);
    setLastDetectedNote(null);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Mic className="text-blue-400 mr-2" size={24} />
            <h2 className="text-2xl font-bold text-white">Note Detector</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center"
            >
              <Waves size={16} className="mr-1" />
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            
            <button
              onClick={handleClearHistory}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium flex items-center"
            >
              <XCircle size={16} className="mr-1" />
              Clear
            </button>
            
            <button
              onClick={onExit}
              className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white font-medium flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" />
              Exit
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Current detection display */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="text-2xl text-gray-400 mb-2">Detected Note:</div>
              <div className="text-6xl font-bold text-white mb-2">
                {detectedNote ? detectedNote : '--'}
              </div>
              {detectedFrequency && (
                <div className="text-xl text-gray-400">
                  {detectedFrequency.toFixed(2)} Hz {cents !== 0 && `(${cents > 0 ? '+' : ''}${cents} cents)`}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-400 mb-2">Microphone Sensitivity</div>
              <div className="flex items-center gap-2 w-64">
                <span className="text-xs text-gray-500">Low</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">High</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Value: {sensitivity}%
              </div>
            </div>
          </div>
          
          {/* Waveform visualization - using the existing WaveformVisualizer */}
          <div className="bg-gray-900 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Waveform Analysis</h3>
            <WaveformVisualizer 
              audioData={audioData}
              rawAudioData={rawAudioData}
              isListening={isListening}
              currentString={0}
              isCorrectNote={false}
              detectedNote={detectedNote}
              detectedFrequency={detectedFrequency}
              cents={cents}
            />
          </div>
          
          {/* Note detection history - limited to 20 entries */}
          {showHistory && (
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-300">Detection History</h3>
                <div className="text-sm text-gray-400">Last {MAX_HISTORY_SIZE} detections</div>
              </div>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-left">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Note</th>
                      <th className="px-4 py-2">Frequency (Hz)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((item, index) => (
                        <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/50">
                          <td className="px-4 py-2">{history.length - index}</td>
                          <td className="px-4 py-2">{formatTime(item.time)}</td>
                          <td className="px-4 py-2 font-medium">{item.note}</td>
                          <td className="px-4 py-2">{item.frequency.toFixed(2)}</td>
                        </tr>
                      )).reverse()
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No notes detected yet. Play some notes to see the history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetector;