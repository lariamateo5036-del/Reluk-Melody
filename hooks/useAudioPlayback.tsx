import { useEffect } from 'react';
import audioService from '../services/audioService';

interface UseAudioPlaybackProps {
  isPlaying: boolean;
  currentTrack: any;
  silentAudioRef: React.RefObject<HTMLAudioElement>;
}

export const useAudioPlayback = ({ isPlaying, currentTrack, silentAudioRef }: UseAudioPlaybackProps) => {
  useEffect(() => {
    if (isPlaying && currentTrack) {
      audioService.start(currentTrack.type, currentTrack.originalIndex);
      silentAudioRef.current?.play().catch(e => console.warn("Silent audio playback failed", e));
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      audioService.stop(false); // Stop main synth but leave mixers active
      silentAudioRef.current?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, currentTrack, silentAudioRef]);
};
