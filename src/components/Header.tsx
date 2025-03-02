import React from 'react';
import { Music, Download, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface HeaderProps {
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onExportCSV: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onExportCSV
}) => {
  return (
    <header className="w-full max-w-4xl flex justify-between items-center mb-8">
      <div className="flex items-center">
        <Music className="text-blue-400 mr-2" size={32} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Guitar Fretboard Trainer
        </h1>
      </div>
      <div className="flex space-x-4">
        <button 
          onClick={onToggleMute} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button 
          onClick={onTogglePause} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        <button 
          onClick={onExportCSV} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Export Progress"
        >
          <Download size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
