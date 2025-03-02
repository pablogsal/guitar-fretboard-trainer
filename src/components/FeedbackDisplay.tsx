import React from 'react';

interface FeedbackDisplayProps {
  message: string;
  show: boolean;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ message, show }) => {
  if (!show) return null;
  
  const getBgColor = () => {
    if (message.includes('Correct')) return 'bg-green-500/20 text-green-300';
    if (message.includes('Incorrect')) return 'bg-red-500/20 text-red-300';
    if (message.includes('completed')) return 'bg-blue-500/20 text-blue-300';
    return 'bg-gray-700 text-gray-300';
  };
  
  return (
    <div className={`mb-8 p-4 rounded-lg text-center text-lg font-medium ${getBgColor()}`}>
      {message}
    </div>
  );
};

export default FeedbackDisplay;
