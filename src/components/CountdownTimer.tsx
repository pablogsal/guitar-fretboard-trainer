import React from 'react';
import { STRING_COLORS, getStringLabel } from '../utils/noteUtils';

interface CountdownTimerProps {
  countdown: number;
  currentString: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  countdown, 
  currentString 
}) => {
  const stringLabel = getStringLabel(currentString);
  const stringColor = STRING_COLORS[currentString];
  
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl p-8 shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-2">Get Ready!</h2>
      
      {/* Larger, centered string display */}
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-sm text-gray-300 mb-2">Prepare string:</div>
        <div 
          className="text-5xl font-bold px-6 py-3 rounded-lg flex items-center justify-center"
          style={{ 
            color: stringColor, 
            backgroundColor: `${stringColor}20`,
            minWidth: '180px',
            textAlign: 'center'
          }}
        >
          {stringLabel}
        </div>
      </div>
      
      <div className="text-4xl font-bold text-blue-400 animate-pulse mt-2">
        {countdown}
      </div>
    </div>
  );
};

export default CountdownTimer;