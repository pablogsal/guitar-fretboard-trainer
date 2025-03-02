import React from 'react';
import { Mic } from 'lucide-react';

interface SensitivityControlProps {
  sensitivity: number;
  onChange: (value: number) => void;
}

const SensitivityControl: React.FC<SensitivityControlProps> = ({ sensitivity, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange(value);
  };

  // Map sensitivity level to descriptive text
  const getSensitivityLabel = () => {
    if (sensitivity <= 20) return "Very Low (Less Sensitive)";
    if (sensitivity <= 40) return "Low";
    if (sensitivity <= 60) return "Medium";
    if (sensitivity <= 80) return "High";
    return "Very High (More Sensitive)";
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Mic className="text-blue-400 mr-2" size={18} />
          <h3 className="text-lg font-semibold text-gray-300">Microphone Sensitivity</h3>
        </div>
        <span className="text-sm font-medium px-2 py-1 rounded bg-blue-500/20 text-blue-300">
          {getSensitivityLabel()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Less</span>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={sensitivity}
          onChange={handleChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  );
};

export default SensitivityControl;