import React from 'react';
import { Play } from 'lucide-react';

interface StartButtonProps {
  onStart: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const StartButton: React.FC<StartButtonProps> = ({ 
  onStart, 
  isLoading = false, 
  disabled = false 
}) => {
  return (
    <button 
      onClick={onStart}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center gap-2
        px-8 py-4 rounded-xl font-bold text-lg
        transition-all transform hover:scale-105 shadow-lg
        ${disabled || isLoading 
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'}
      `}
    >
      {isLoading ? (
        <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
      ) : (
        <>
          <Play size={24} />
          <span>Start Training</span>
        </>
      )}
    </button>
  );
};

export default StartButton;