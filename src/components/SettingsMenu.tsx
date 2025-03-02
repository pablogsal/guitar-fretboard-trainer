// src/components/SettingsMenu.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, Volume2, VolumeX } from 'lucide-react';
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
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading,
  error,
  onRefresh,
  isMuted,
  onToggleMute
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
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
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;