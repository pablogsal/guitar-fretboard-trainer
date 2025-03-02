// src/components/SettingsMenu.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX, Mic } from 'lucide-react';
import MicrophoneSelector from './MicrophoneSelector';

interface SettingsMenuProps {
  audioDevices: Array<{ deviceId: string; label: string }>;
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading,
  error,
  onRefresh,
  isMuted,
  onToggleMute,
  sensitivity,
  onSensitivityChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Map sensitivity level to descriptive text
  const getSensitivityLabel = () => {
    if (sensitivity <= 20) return "Very Low";
    if (sensitivity <= 40) return "Low";
    if (sensitivity <= 60) return "Medium";
    if (sensitivity <= 80) return "High";
    return "Very High";
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <SettingsIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          
          <div className="mb-4">
            <MicrophoneSelector
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={onDeviceSelect}
              isLoading={isLoading}
              error={error}
              onRefresh={onRefresh}
            />
          </div>

          {/* Sensitivity Control */}
          <div className="mb-4 bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Mic className="text-blue-400 mr-2" size={16} />
                <span className="text-sm font-medium">Microphone Sensitivity</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {getSensitivityLabel()}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Less</span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={sensitivity}
                onChange={(e) => onSensitivityChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">More</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>Mute Sounds</span>
            <button
              onClick={onToggleMute}
              className={`${
                isMuted ? 'bg-blue-600' : 'bg-gray-600'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <span
                className={`${
                  isMuted ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
            <p>Use the sensitivity slider to adjust how responsive note detection is for your instrument.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;