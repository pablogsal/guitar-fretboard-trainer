import React from 'react';

interface CountdownTimerProps {
  countdown: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ countdown }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl p-8 shadow-lg mb-8">
      <h2 className="text-2xl font-bold mb-4">Get Ready!</h2>
      <div className="text-6xl font-bold text-blue-400 animate-pulse">
        {countdown}
      </div>
    </div>
  );
};

export default CountdownTimer;
