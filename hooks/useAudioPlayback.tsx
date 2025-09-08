import { useEffect, useRef } from 'react';
import audioService from '../services/audioService';

interface UseAudioPlaybackProps {
  isPlaying: boolean;
  currentTrack: any;
  audioOutputRef: React.RefObject<HTMLAudioElement>;
}

export const useAudioPlayback = ({ isPlaying, currentTrack, audioOutputRef }: UseAudioPlaybackProps) => {
  const isAudioInitialized = useRef(false);

  useEffect(() => {
    const audioEl = audioOutputRef.current;
    if (!audioEl || !currentTrack) return;

    const managePlayback = async () => {
      try {
        if (isPlaying) {
          if (!isAudioInitialized.current) {
            await audioService.init(audioEl);
            isAudioInitialized.current = true;
          }
          audioService.startPlayback(currentTrack.type, currentTrack.originalIndex);
          await audioEl.play();

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        } else {
          audioService.stopPlayback(false); // Stop main synth but leave mixers active
          audioEl.pause();

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        }
      } catch (e) {
        console.error("Audio playback management failed:", e);
      }
    };

    managePlayback();
    
  }, [isPlaying, currentTrack, audioOutputRef]);
};