import React from 'react';

interface MicrophoneSelectorProps {
  audioDevices: Array<{
    deviceId: string;
    label: string;
  }>;
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading,
  error,
  onRefresh
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-300">Select Microphone</h3>
        <button 
          onClick={onRefresh} 
          className="text-sm text-blue-400 hover:text-blue-300"
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
      
      {isLoading ? (
        <p className="text-gray-400">Loading microphones...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : audioDevices.length === 0 ? (
        <p className="text-yellow-400">No microphones found. Please connect a microphone.</p>
      ) : (
        <select 
          value={selectedDeviceId}
          onChange={(e) => onDeviceSelect(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default MicrophoneSelector;