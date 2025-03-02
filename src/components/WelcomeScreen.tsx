import React, { useState } from 'react';
import StartButton from './StartButton';
import { Music } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  error: string | null;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, error }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 shadow-xl mb-8 text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-6">
            <Music size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Guitar Fretboard Trainer
          </h2>
          <p className="text-gray-300 max-w-lg mx-auto mb-8">
            Train your ear and learn the notes on your guitar fretboard. This app will help you identify and play notes on specific strings in different octaves.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mb-10">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2 text-blue-400">1</div>
              <p className="text-sm">Allow microphone access to detect your guitar notes</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2 text-blue-400">2</div>
              <p className="text-sm">Play the shown note on the specified string in both octaves</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2 text-blue-400">3</div>
              <p className="text-sm">Track your progress and download your results</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6 w-full max-w-lg">
              {error}
            </div>
          )}
          
          <StartButton 
            onStart={handleStart}
            isLoading={isLoading}
            disabled={!!error}
          />
        </div>
        
        <div className="text-gray-500 text-sm">
          <p>Make sure your guitar is properly tuned before starting</p>
          <p className="mt-1">You will need to allow microphone access for note detection</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;