import React, { useEffect } from 'react';
import { STRING_COLORS, getStringLabel } from '../utils/noteUtils';

interface StringSelectorProps {
  selectedStrings: number[];
  onChange: (selectedStrings: number[]) => void;
}

const StringSelector: React.FC<StringSelectorProps> = ({ selectedStrings, onChange }) => {
  const allStrings = [1, 2, 3, 4, 5, 6];

  // Ensure we always have at least one string selected
  useEffect(() => {
    if (selectedStrings.length === 0) {
      onChange([1, 2, 3, 4, 5, 6]);
    }
  }, [selectedStrings, onChange]);

  const handleChange = (stringNumber: number) => {
    // Create a new array with the toggled selection
    const newSelection = selectedStrings.includes(stringNumber)
      ? selectedStrings.filter(s => s !== stringNumber)
      : [...selectedStrings, stringNumber].sort();
    
    // Don't allow deselecting the last string
    if (newSelection.length === 0) {
      return;
    }
    
    console.log("String selection changed to:", newSelection);
    onChange(newSelection);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-300">Select Strings</h3>
        <div className="text-sm text-gray-400">
          {selectedStrings.length === 6 ? 'All strings' : `${selectedStrings.length} string(s) selected`}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allStrings.map(stringNumber => {
          const isSelected = selectedStrings.includes(stringNumber);
          return (
            <button
              key={stringNumber}
              onClick={() => handleChange(stringNumber)}
              className={`
                flex items-center justify-center p-2 rounded-lg transition-all
                ${isSelected
                  ? 'opacity-100 shadow-md hover:brightness-110'
                  : 'opacity-40 hover:opacity-70'
                }
              `}
              style={{
                backgroundColor: STRING_COLORS[stringNumber],
              }}
              aria-pressed={isSelected}
              aria-label={`Select string ${getStringLabel(stringNumber)}`}
            >
              <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {getStringLabel(stringNumber)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StringSelector;