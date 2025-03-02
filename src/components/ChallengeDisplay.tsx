// src/components/ChallengeDisplay.tsx
import React from 'react';
import { STRING_COLORS, getStringLabel } from '../utils/noteUtils';

interface ChallengeDisplayProps {
  currentString: number;
  currentNote: string;
  correctNotes: string[];
}

const ChallengeDisplay: React.FC<ChallengeDisplayProps> = ({ 
  currentString, 
  currentNote,
  correctNotes 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl p-8 shadow-lg mb-8">
      <div className="flex flex-col items-center mb-6">
        <div 
          className="text-5xl font-bold mb-2" 
          style={{ color: STRING_COLORS[currentString] }}
        >
          {currentNote}
        </div>
        <div className="text-2xl text-gray-300">
          on string <span style={{ color: STRING_COLORS[currentString] }}>{getStringLabel(currentString)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
          {correctNotes.includes('low') && <div className="w-4 h-4 rounded-full bg-green-500"></div>}
        </div>
        <div className="text-gray-400">Low Octave</div>
        
        <div className="mx-4">•</div>
        
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
          {correctNotes.includes('high') && <div className="w-4 h-4 rounded-full bg-green-500"></div>}
        </div>
        <div className="text-gray-400">High Octave</div>
      </div>
    </div>
  );
};

export default ChallengeDisplay;