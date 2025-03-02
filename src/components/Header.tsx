import React from 'react';
import { Music, Download, Volume2, VolumeX, Play, Pause, RefreshCw, BarChart3 } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

interface HeaderProps {
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onExportCSV: () => void;
  onRestartChallenge: () => void;
  audioDevices: Array<{ deviceId: string; label: string }>;
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoadingDevices: boolean;
  devicesError: string | null;
  onRefreshDevices: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  onToggleNoteDetector: () => void;
  showNoteDetector?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onExportCSV,
  onRestartChallenge,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoadingDevices,
  devicesError,
  onRefreshDevices,
  sensitivity,
  onSensitivityChange,
  onToggleNoteDetector,
  showNoteDetector = false
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
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        
        <button 
          onClick={onTogglePause} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isPaused ? "Resume" : "Pause"}
          title={isPaused ? "Resume" : "Pause"}
          disabled={showNoteDetector}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        
        <button 
          onClick={onRestartChallenge} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Reset Challenge"
          title="Reset Challenge"
          disabled={showNoteDetector}
        >
          <RefreshCw size={20} />
        </button>
        
        <button 
          onClick={onToggleNoteDetector} 
          className={`p-2 rounded-full transition-colors ${
            showNoteDetector 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          aria-label="Note Detector"
          title="Note Detector Mode"
        >
          <BarChart3 size={20} />
        </button>
        
        <button 
          onClick={onExportCSV} 
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Export Progress"
          title="Export Progress"
          disabled={showNoteDetector}
        >
          <Download size={20} />
        </button>
        
        <SettingsMenu
          audioDevices={audioDevices}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={onDeviceSelect}
          isLoading={isLoadingDevices}
          error={devicesError}
          onRefresh={onRefreshDevices}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          sensitivity={sensitivity}
          onSensitivityChange={onSensitivityChange}
        />
      </div>
    </header>
  );
};

export default Header;