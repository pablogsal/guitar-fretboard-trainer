import React from 'react';
import { STRING_COLORS, getStringLabel } from '../utils/noteUtils';

interface StringSelectorProps {
  selectedStrings: number[];
  onChange: (selectedStrings: number[]) => void;
}

const StringSelector: React.FC<StringSelectorProps> = ({ selectedStrings, onChange }) => {
  const allStrings = [1, 2, 3, 4, 5, 6];

  const handleChange = (stringNumber: number) => {
    const newSelection = selectedStrings.includes(stringNumber)
      ? selectedStrings.filter(s => s !== stringNumber)
      : [...selectedStrings, stringNumber];
    onChange(newSelection);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-300">Select Strings</h3>
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