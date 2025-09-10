
import { useEffect } from 'react';
import audioService from '../services/audioService';

interface UseAudioPlaybackProps {
  isPlaying: boolean;
  currentTrack: any;
}

export const useAudioPlayback = ({ isPlaying, currentTrack }: UseAudioPlaybackProps) => {
  useEffect(() => {
    const managePlayback = async () => {
      if (!currentTrack) return;

      try {
        if (isPlaying) {
          await audioService.startPlayback(currentTrack.type, currentTrack.originalIndex);
        } else {
          // Stop main synth but leave mixers active
          await audioService.stopPlayback(false);
        }
      } catch (e) {
        console.error("Audio playback management failed:", e);
      }
    };

    managePlayback();
    
    // Cleanup on unmount
    return () => {
      audioService.stopPlayback(true);
    };
  }, [isPlaying, currentTrack]);
};
