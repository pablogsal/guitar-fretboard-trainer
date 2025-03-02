// src/hooks/useAudioDevices.ts
import { useState, useEffect } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useAudioDevices = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getAudioDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get list of all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter to only audio input devices
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
          kind: device.kind
        }));
      
      setAudioDevices(audioInputDevices);
      
      // Set default selected device (if available)
      if (audioInputDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputDevices[0].deviceId);
      }
    } catch (err) {
      setError('Failed to get audio devices. Please ensure microphone permissions are granted.');
      console.error('Error getting audio devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAudioDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isLoading,
    error,
    refreshDevices: getAudioDevices
  };
};

export default useAudioDevices;